export async function hashSha256(val: string) {
  const utf8 = new TextEncoder().encode(val);
  const hashBuffer = await crypto.subtle.digest("SHA-256", utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray;
}

export function bytesToHexString(hashBytes: number[]) {
  return hashBytes.map((bytes) => bytes.toString(16).padStart(2, "0")).join("");
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
