import { programId, IDL as BasicIDL } from "./anchor";
import { Program } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export function useProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const wallet = useWallet();
  const program = new Program(BasicIDL, programId, provider);

  const [filterSourcePDA] = (wallet.publicKey &&
    PublicKey.findProgramAddressSync(
      [
        anchor.utils.bytes.utf8.encode("filterSource:"),
        wallet.publicKey.toBuffer(),
        anchor.utils.bytes.utf8.encode(":default"),
      ],
      programId
    )) ?? [null];

  const getFilterAccount = useQuery({
    queryKey: ["get-filter-account", { cluster }],
    queryFn: () => {
      if (!filterSourcePDA) {
        return null;
      }
      return connection.getParsedAccountInfo(filterSourcePDA);
    },
    enabled: !!wallet.publicKey,
  });

  const initialize = useMutation({
    mutationKey: ["program", "initialize", { cluster }],
    mutationFn: async () =>
      (filterSourcePDA &&
        program.methods
          .initialize()
          .accounts({
            filterSource: filterSourcePDA,
          })
          .rpc()) ??
      null,
    onSuccess: (signature) => {
      signature && transactionToast(signature);
    },
    onError: () => toast.error("Failed to run program"),
  });

  const setFilter = useMutation({
    mutationKey: ["program", "setFilter", { cluster }],
    mutationFn: async ({
      url,
      hash,
    }: {
      url: string;
      hash: number[];
    }): Promise<string | null> => {
      console.log(hash, url, filterSourcePDA?.toString());
      return (
        (filterSourcePDA &&
          program.methods
            .setFilter(hash, url)
            .accounts({ filterSource: filterSourcePDA })
            .rpc()) ??
        null
      );
    },
    onSuccess: (signature) => {
      signature && transactionToast(signature);
    },
    onError: () => toast.error("Failed to run program"),
  });

  return {
    program,
    programId,
    getFilterAccount,
    initialize,
    setFilter,
  };
}
