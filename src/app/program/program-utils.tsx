import {
  ConfirmedSignatureInfo,
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";
import { useContext } from "react";
import { ProgramContext } from "./program-data-access";
import { verifyEd25516 } from "../utils/hash";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

export const useProgram = () => useContext(ProgramContext);

export const extractMemoPayloadSignature = (memo: string) => {
  const memoContents: string[] = [];
  let pointer = 0;
  for (let i = 0; i < 2; i++) {
    const closeBracket = memo.indexOf("]", pointer);
    if (closeBracket === -1) {
      break;
    }
    const nextLen = +memo.slice(pointer + 1, closeBracket);
    pointer = closeBracket + 2;
    memoContents.push(memo.slice(pointer, pointer + nextLen));
    pointer = pointer + nextLen + 2;
  }
  if (memoContents.length !== 2) {
    return null;
  }

  const payloadPayload = memoContents[0].startsWith("Payload:")
    ? memoContents[0].slice(8)
    : null;
  if (!payloadPayload) {
    return null;
  }
  const payloadMatches = payloadPayload.match(
    /url:'(?<url>.*?)'; hash:'(?<hash>.*?)'; blockSlot:'(?<blockSlot>.*?)'/
  );
  if (
    !payloadMatches ||
    !payloadMatches.groups?.url ||
    !payloadMatches.groups?.hash ||
    !payloadMatches.groups?.blockSlot
  ) {
    return null;
  }
  const signaturePayload = memoContents[1].startsWith("Signature:")
    ? memoContents[1].slice(10)
    : null;
  if (!signaturePayload) {
    return null;
  }

  return {
    payloadPayload,
    signaturePayload,
  };
};

export const precheckTxMemo = (
  confirmedSignatureInfo: ConfirmedSignatureInfo,
  signer: PublicKey
) => {
  const { memo } = confirmedSignatureInfo;
  if (!memo) {
    return false;
  }
  if (confirmedSignatureInfo.err) {
    return false;
  }
  const { payloadPayload, signaturePayload } =
    extractMemoPayloadSignature(memo) ?? {};

  if (!payloadPayload || !signaturePayload) {
    return false;
  }

  return verifyEd25516(
    payloadPayload,
    Array.from(bs58.decode(signaturePayload)),
    signer
  );
};

export const findFirstValidTx = async (
  txHashes: string[],
  signer: PublicKey,
  connection: Connection
): Promise<ParsedTransactionWithMeta | null> => {
  const txs = await connection.getParsedTransactions(txHashes, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  for (const tx of txs) {
    if (!tx) continue;
    if (
      tx.transaction.message.accountKeys.find(
        (key) => key.pubkey.equals(signer) && key.signer
      )
    ) {
      return tx;
    }
  }
  return null;
};
