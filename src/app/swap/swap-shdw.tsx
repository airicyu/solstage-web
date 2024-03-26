import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, VersionedTransaction } from "@solana/web3.js";

export async function swapSolForShdw(
  wallet: WalletContextState,
  connection: Connection,
  numShdw: number
): Promise<string> {
  if (!wallet.publicKey) {
    throw new Error("Wallet not connected");
  }
  const quoteResponse = await (
    await fetch(
      `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y&amount=${
        numShdw * 10 ** 9
      }&slippageBps=10000&swapMode=ExactOut`
    )
  ).json();

  const { swapTransaction } = await (
    await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // quoteResponse from /quote api
        quoteResponse,
        // user public key to be used for the swap
        userPublicKey: wallet.publicKey.toString(),
        // auto wrap and unwrap SOL. default is true
        wrapAndUnwrapSol: true,
        // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
        // feeAccount: "fee_account_public_key"
      }),
    })
  ).json();

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
  // console.log(transaction);

  // // sign the transaction
  const tx = await wallet.sendTransaction(transaction, connection);

  await connection.confirmTransaction(tx, "confirmed");

  return tx;
}
