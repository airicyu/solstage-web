import { programId, IDL as BasicIDL, SolstageProgram } from "./anchor";
import { Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import base58 from "bs58";
import {
  MEMO_PROGRAM_ID,
  extractMemoPayloadSignature,
  findFirstValidTx,
  precheckTxMemo,
} from "./program-utils";

export type ProgramContextType = {
  program: Program<SolstageProgram> | null;
  programId: PublicKey | null;
  getFilterInfo: UseQueryResult<
    {
      url: string;
      hash: string;
    } | null,
    Error
  > | null;
  setFilter: UseMutationResult<
    string | null,
    Error,
    { url: string; hash: string },
    unknown
  > | null;
  address: PublicKey | null;
  setAddress: ((address: PublicKey) => void) | null;
};

export const ProgramContext = createContext<ProgramContextType>({
  program: null,
  programId: null,
  getFilterInfo: null,
  setFilter: null,
  address: null,
  setAddress: null,
});

export const ProgramContextProvider = ({ children }: { children: any }) => {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const wallet = useWallet();
  const program = new Program(BasicIDL, programId, provider);
  const [address, setAddress] = useState<PublicKey | null>(null);

  const [filterSourcePDA] = useMemo(
    () =>
      (address &&
        PublicKey.findProgramAddressSync(
          [
            anchor.utils.bytes.utf8.encode("filterSource:"),
            address.toBuffer(),
            anchor.utils.bytes.utf8.encode(":default"),
          ],
          programId
        )) ?? [null],
    [address]
  );

  const getFilterInfo = useQuery({
    queryKey: ["get-filter-info", { cluster }],
    queryFn: async () => {
      console.log("getFilterInfo start");
      if (!address || !filterSourcePDA) {
        return null;
      }
      try {
        const taggedTxs = await connection.getSignaturesForAddress(
          filterSourcePDA,
          {
            limit: 100,
          },
          "confirmed"
        );

        const prefilteredTaggedTxs: string[] = (
          await Promise.all(
            taggedTxs.map((taggedTx) =>
              precheckTxMemo(taggedTx, address as PublicKey).then((res) =>
                res ? taggedTx.signature : ""
              )
            )
          )
        ).filter((_) => _ !== "");

        const validTx = await findFirstValidTx(
          prefilteredTaggedTxs,
          address,
          connection
        );

        if (!validTx) {
          return null;
        } else {
          const taggedTx = taggedTxs.filter(
            (tx) => tx.signature === validTx.transaction.signatures[0]
          )[0];

          const { payloadPayload, signaturePayload } =
            extractMemoPayloadSignature(taggedTx.memo!) ?? {};

          if (!payloadPayload || !signaturePayload) {
            return null;
          }

          const payloadMatches = payloadPayload.match(
            /url:'(?<url>.*?)'; hash:'(?<hash>.*?)'; blockSlot:'(?<bh>.*?)'/
          );
          console.log(payloadMatches?.groups);
          const signatureMatches = signaturePayload.match(/(?<signature>.*)/);
          console.log(signatureMatches?.groups);

          if (
            !payloadMatches?.groups?.["url"] ||
            !payloadMatches?.groups?.["hash"]
          ) {
            return null;
          }
          console.log("getFilterInfo return");
          return {
            url: payloadMatches.groups["url"],
            hash: payloadMatches.groups["hash"],
          };
        }
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    enabled: !!address && !!filterSourcePDA,
  });

  useEffect(() => {
    getFilterInfo.refetch();
  }, [getFilterInfo]);

  const setFilterMemo = useCallback(
    async (url: string, hash: string) => {
      const { context: latestBlockHashContext, value: latestBlockHash } =
        await connection.getLatestBlockhashAndContext("confirmed");

      if (!wallet.publicKey) {
        console.error("wallet not connected");
        return;
      }

      if (!address) {
        return;
      }

      if (!address.equals(wallet.publicKey)) {
        console.error("wallet not equal to current viewing address");
        return;
      }

      if (!wallet.signMessage) {
        return;
      }

      if (!filterSourcePDA) {
        return;
      }

      try {
        const messagePayload = `url:'${url}'; hash:'${hash}'; blockSlot:'${latestBlockHashContext.slot}'`;
        const signature = base58.encode(
          await wallet.signMessage(Buffer.from(messagePayload, "utf-8"))
        );

        const tagAccount = filterSourcePDA;

        const messageV0 = new TransactionMessage({
          payerKey: wallet.publicKey,
          recentBlockhash: latestBlockHash.blockhash,
          instructions: [
            new TransactionInstruction({
              keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
              ],
              data: Buffer.from("Payload:" + messagePayload, "utf-8"),
              programId: MEMO_PROGRAM_ID,
            }),
            new TransactionInstruction({
              keys: [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
              ],
              data: Buffer.from("Signature:" + signature, "utf-8"),
              programId: MEMO_PROGRAM_ID,
            }),
            SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: tagAccount,
              lamports: 0,
            }),
          ],
        }).compileToV0Message();

        const tx = new VersionedTransaction(messageV0);
        const txHash = await wallet.sendTransaction(
          tx as any as Transaction,
          connection,
          undefined as any
        );
        await connection.confirmTransaction(
          {
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: txHash,
          },
          "confirmed"
        );
        return txHash;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    [address, connection, filterSourcePDA, wallet]
  );

  const setFilter = useMutation({
    mutationKey: ["program", "setFilter", { cluster }],
    mutationFn: async ({
      url,
      hash,
    }: {
      url: string;
      hash: string;
    }): Promise<string | null> => {
      if (!wallet.publicKey) {
        console.error("wallet not connected");
        return null;
      }
      if (!address) {
        return null;
      }
      if (!address.equals(wallet.publicKey)) {
        console.error("wallet not equal to current viewing address");
        return null;
      }
      console.log(hash, url, filterSourcePDA?.toString());
      return (filterSourcePDA && (await setFilterMemo(url, hash))) ?? null;
    },
    onSuccess: (signature) => {
      signature && transactionToast(signature);
    },
    onError: () => toast.error("Failed to run program"),
  });

  return (
    <ProgramContext.Provider
      value={{
        program,
        programId,
        getFilterInfo,
        setFilter,
        address,
        setAddress,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};
