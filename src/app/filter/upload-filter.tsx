import React, { useCallback, useEffect, useState } from "react";
import { ShadowFile, ShdwDrive, StorageAccountV2 } from "@shadow-drive/sdk";
import { useWallet, useConnection, Wallet } from "@solana/wallet-adapter-react";
import FormData from "form-data";
import { Connection, PublicKey } from "@solana/web3.js";
import { Button } from "antd";

export function useUploadFilter() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [uploadUrl, setUploadUrl] = useState<string | undefined>();
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [drive, setDrive] = useState<ShdwDrive | undefined>();
  const [storageAcc, setStorageAcc] = useState<PublicKey | null | undefined>(
    undefined
  );

  /**
   * load "drive"
   */
  useEffect(() => {
    new ShdwDrive(connection, wallet).init().then(setDrive);
  }, [connection, wallet]);

  /**
   * load file storage account
   */
  useEffect(() => {
    (async () => {
      if (!drive) {
        console.debug("!drive");
        return null;
      }
      const accounts: {
        publicKey: PublicKey;
        account: StorageAccountV2;
      }[] = await drive.getStorageAccounts();
      try {
        const acc = accounts.find(
          (acc) => acc.account.identifier === "solstage"
        )?.publicKey;
        console.debug("setStorageAcc(acc);");
        setStorageAcc(acc);
      } catch (e) {
        console.debug("setStorageAcc(null);");
        setStorageAcc(null);
      }
    })();
  }, [drive]);

  // // check storage account exists
  // const checkAccountExists = useCallback(() => {
  //   return !!storageAcc;
  // }, [storageAcc]);

  /**
   * init storage account
   */
  const initAccount = useCallback(async () => {
    if (!drive) return null;
    const { shdw_bucket, transaction_signature } =
      await drive.createStorageAccount("solstage", "100KB");
    console.log(`shdw_bucket: ${shdw_bucket}`);
    console.log(`transaction_signature: ${transaction_signature}`);
  }, [drive]);

  /**
   * upload/edit filter file to shadow drive
   */
  const uploadFilter = useCallback(
    (filterContent: string) => {
      (async () => {
        if (!drive) {
          throw new Error("Drive not initialized");
        }

        if (!storageAcc) {
          await initAccount();
        }

        if (!storageAcc) {
          throw new Error("No account found");
        }

        const filterFile = new File([filterContent], "default-filter.json", {
          type: "application/json",
        });

        const getStorageAccount = await drive.getStorageAccount(storageAcc);
        console.log(`getStorageAccount:`, getStorageAccount);

        const fileKeys = await drive.listObjects(storageAcc);
        if (!fileKeys.keys.includes("default-filter.json")) {
          console.log("new file upload");
          const upload = await drive.uploadFile(storageAcc, filterFile);
          console.log(`upload:`, upload);
          setUploadUrl(upload.finalized_locations[0]);
          setRefreshFlag(true);
        } else {
          console.log("edit file upload");
          const { finalized_location } = await drive.editFile(
            storageAcc,
            `https://shdw-drive.genesysgo.net/${storageAcc.toString()}/default-filter.json`,
            filterFile
          );
          console.log(`finalized_location: `, finalized_location);
          setUploadUrl(finalized_location);
          setRefreshFlag(true);
        }
      })();
    },
    [drive, initAccount, storageAcc]
  );

  return {
    storageAcc,
    initAccount,
    uploadFilter,
    refreshFlag,
    setRefreshFlag,
  };
}

// export async function uploadFilter(
//   connection: Connection,
//   wallet: Wallet,
//   file: File
// ): Promise<string> {
//   const drive = await new ShdwDrive(connection, wallet).init();
//   let accounts: {
//     publicKey: PublicKey;
//     account: StorageAccountV2;
//   }[] = [];
//   try {
//     accounts = await drive.getStorageAccounts();
//   } catch (e) {
//     const { shdw_bucket, transaction_signature } =
//       await drive.createStorageAccount("solstage", "100KB");
//     console.log(`shdw_bucket: ${shdw_bucket}`);
//     console.log(`transaction_signature: ${transaction_signature}`);
//     accounts = await drive.getStorageAccounts();
//   }
//   console.log(`accounts:`, accounts);
//   const acc = accounts.find(
//     (acc) => acc.account.identifier === "solstage"
//   )?.publicKey;
//   if (!acc) {
//     throw new Error("No account found");
//   }
//   const getStorageAccount = await drive.getStorageAccount(acc);
//   console.log(`getStorageAccount:`, getStorageAccount);

//   const fileKeys = await drive.listObjects(acc);
//   if (!fileKeys.keys.includes("default-filter.json")) {
//     console.log("new file upload");
//     const upload = await drive.uploadFile(acc, file);
//     console.log(`upload:`, upload);
//     return upload.finalized_locations[0];
//   } else {
//     console.log("edit file upload");
//     const { finalized_location } = await drive.editFile(
//       acc,
//       `https://shdw-drive.genesysgo.net/${acc.toString()}/default-filter.json`,
//       file
//     );
//     console.log(`finalized_location: `, finalized_location);
//     return finalized_location;
//   }
// }

// export default function Upload() {
//   const [file, setFile] = useState<File | undefined>();
//   const [uploadUrl, setUploadUrl] = useState<string | undefined>();
//   const [txnSig, setTxnSig] = useState<string | undefined>();
//   const { connection } = useConnection();
//   const wallet = useWallet();
//   return (
//     <div>
//       <Button
//         onClick={async (e) => {
//           e.preventDefault();
//           console.log(`wallet: ${wallet.toString()}`);
//           const drive = await new ShdwDrive(connection, wallet).init();

//           const { shdw_bucket, transaction_signature } =
//             await drive.createStorageAccount("solstage", "100KB");
//           console.log(`shdw_bucket: ${shdw_bucket}`);
//           console.log(`transaction_signature: ${transaction_signature}`);

//           drive.getStorageAccounts();
//         }}
//       >
//         Create account
//       </Button>
//       <form
//         onSubmit={async (event) => {
//           event.preventDefault();
//           try {
//             const drive = await new ShdwDrive(connection, wallet).init();
//             let accounts: {
//               publicKey: PublicKey;
//               account: StorageAccountV2;
//             }[] = [];
//             try {
//               accounts = await drive.getStorageAccounts();
//             } catch (e) {
//               const { shdw_bucket, transaction_signature } =
//                 await drive.createStorageAccount("solstage", "100KB");
//               console.log(`shdw_bucket: ${shdw_bucket}`);
//               console.log(`transaction_signature: ${transaction_signature}`);
//               accounts = await drive.getStorageAccounts();
//             }
//             console.log(`accounts:`, accounts);
//             const acc = accounts.find(
//               (acc) => acc.account.identifier === "solstage"
//             )?.publicKey;
//             if (!acc) {
//               throw new Error("No account found");
//             }
//             const getStorageAccount = await drive.getStorageAccount(acc);
//             console.log(`getStorageAccount:`, getStorageAccount);

//             if (file) {
//               const fileKeys = await drive.listObjects(acc);
//               if (!fileKeys.keys.includes("default-filter.json")) {
//                 console.log("new file upload");
//                 const upload = await drive.uploadFile(acc, file);
//                 console.log(`upload:`, upload);
//                 setUploadUrl(upload.finalized_locations[0]);
//                 setTxnSig(upload.message);
//               } else {
//                 console.log("edit file upload");
//                 const { finalized_location } = await drive.editFile(
//                   acc,
//                   `https://shdw-drive.genesysgo.net/${acc.toString()}/default-filter.json`,
//                   file
//                 );
//                 console.log(`finalized_location: `, finalized_location);
//               }
//             }
//           } catch (error) {
//             console.log(`Error: ${error}`);
//           }
//         }}
//       >
//         <h1>ShdwDrive File Upload</h1>
//         <input
//           type="file"
//           onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
//         />
//         <br />
//         <button type="submit">Upload</button>
//       </form>
//       <span>You may have to wait 60-120s for the URL to appear</span>
//       <div>
//         {uploadUrl ? (
//           <div>
//             <h3>Success!</h3>
//             <h4>URL: {uploadUrl}</h4>
//             <h4>Sig: {txnSig}</h4>
//           </div>
//         ) : (
//           <div></div>
//         )}
//       </div>
//     </div>
//   );
// }
