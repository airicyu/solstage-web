import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";

export async function hashSha256(val: string) {
  const utf8 = new TextEncoder().encode(val);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray;
}

export async function verifyEd25516(
  message: string,
  signature: number[],
  signer: PublicKey
): Promise<boolean> {
  try {
    return nacl.sign.detached.verify(
      Buffer.from(message, "utf-8"),
      Uint8Array.from(signature),
      signer.toBytes()
    );
  } catch (e) {
    console.error(e);
    return false;
  }
}

export function bytesToHexString(bytes: number[]): string {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexStringToBytes(hexString: string): Uint8Array {
  if (hexString.length % 2 !== 0) {
    throw "Must have an even number of hex digits to convert to bytes";
  }
  const numBytes = hexString.length / 2;
  const byteArray = new Uint8Array(numBytes);
  for (let i = 0; i < numBytes; i++) {
    byteArray[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return byteArray;
}

// async function hash(string) {
//   const utf8 = new TextEncoder().encode(string);
//   const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
//   const hashArray = Array.from(new Uint8Array(hashBuffer));
//   const hashHex = hashArray
//     .map((bytes) => bytes.toString(16).padStart(2, '0'))
//     .join('');
//   return hashHex;
// }
