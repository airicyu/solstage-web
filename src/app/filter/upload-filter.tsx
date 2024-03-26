import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ShdwDrive, StorageAccountV2 } from "@shadow-drive/sdk";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { swapSolForShdw } from "../swap/swap-shdw";
import toast from "react-hot-toast";

export type UploadFilterContextType = {
  hasStoageAccount: boolean | undefined;
  storageAcc: PublicKey | undefined;
  uploadUrl: string | undefined;
  initAccount: () => Promise<void>;
  uploadFilter: (filterContent: string) => Promise<string | null>;
  uploadRefreshFlag: boolean;
  setUploadRefreshFlag: (flag: boolean) => void;
};

export const UploadFilterContext = createContext<UploadFilterContextType>({
  hasStoageAccount: undefined,
  storageAcc: undefined,
  uploadUrl: undefined,
  initAccount: async () => {},
  uploadFilter: async () => {
    return null;
  },
  uploadRefreshFlag: false,
  setUploadRefreshFlag: async () => {},
} as UploadFilterContextType);

export const useUploadFilter = () => useContext(UploadFilterContext);

type UploadFilterContextState = {
  drive?: ShdwDrive;
  hasStoageAccount?: boolean;
  storageAcc?: PublicKey;
  uploadUrl?: string;
};

export const UploadFilterContextProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
  const [contextState, setContextState] = useState<UploadFilterContextState>(
    {}
  );
  // const [drive, setDrive] = useState<ShdwDrive | undefined>();
  // const [storageAcc, setStorageAcc] = useState<PublicKey | undefined>(
  //   undefined
  // );

  /**
   * load "drive"
   */
  useEffect(() => {
    new ShdwDrive(connection, wallet).init().then(async (drive) => {
      try {
        const accounts: {
          publicKey: PublicKey;
          account: StorageAccountV2;
        }[] = await drive.getStorageAccounts();

        console.log("shdw accounts", accounts);
        const acc = accounts.find(
          (acc) => acc.account.identifier === "solstage"
        )?.publicKey;
        console.log("setStorageAcc(acc);");
        setContextState((state) => ({
          ...state,
          drive,
          hasStoageAccount: true,
          storageAcc: acc,
        }));
        toast.success("Storage account loaded.");
      } catch (e) {
        console.log("setStorageAcc(undefined);");
        setContextState((state) => ({
          ...state,
          drive,
          hasStoageAccount: false,
          storageAcc: undefined,
        }));
        toast.success("Storage account is not found!");
      }
    });
  }, [connection, wallet]);

  const checkToSwapSolForShdw = useCallback(
    async (wallet) => {
      const ata = getAssociatedTokenAddressSync(
        new PublicKey("SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y"),
        wallet.publicKey
      );
      console.log("ata", ata?.toString());
      const ataAccountInfo = await connection.getAccountInfo(ata);

      console.log("ata account info", ataAccountInfo);
      if (!ataAccountInfo) {
        const loadingToastHandler = toast(
          "No SHDW account found, swapping SOL for some SHDW for account bootstrap."
        );
        try {
          await swapSolForShdw(wallet, connection, 0.1);
          toast.success("Swap SOL for SHDW transaction succeeded!");
        } catch (e) {
          toast.error(
            "Swap SOL for SHDW transaction failed! Please try again."
          );
          throw e;
        } finally {
          toast.dismiss(loadingToastHandler);
        }
      }

      const info = await connection.getTokenAccountBalance(ata);
      console.log("shdw balance", info.value.uiAmount);
      if (info.value.uiAmount != null && info.value.uiAmount < 0.05) {
        const loadingToastHandler = toast(
          "Swapping SOL for some SHDW for account bootstrap."
        );
        try {
          await swapSolForShdw(wallet, connection, 0.1);
          toast.success("Swap SOL for SHDW transaction succeeded!");
        } catch (e) {
          toast.error(
            "Swap SOL for SHDW transaction failed! Please try again."
          );
          throw e;
        } finally {
          toast.dismiss(loadingToastHandler);
        }
      }
      console.log("shdw balance is enough");
    },
    [connection]
  );

  /**
   * init storage account
   */
  const initAccount = useCallback(async () => {
    const loadingToastHandler = toast.loading("Creating storage account...");
    try {
      if (!contextState.drive) {
        return;
      }
      await checkToSwapSolForShdw(wallet);

      const { shdw_bucket, transaction_signature } =
        await contextState.drive.createStorageAccount("solstage", "100KB");
      console.log(`shdw_bucket: ${shdw_bucket}`);
      console.log(`transaction_signature: ${transaction_signature}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to create storage account");
    } finally {
      toast.dismiss(loadingToastHandler);
    }
  }, [checkToSwapSolForShdw, contextState.drive, wallet]);

  /**
   * upload/edit filter file to shadow drive
   */
  const uploadFilter = useCallback(
    async (filterContent: string): Promise<string | null> => {
      if (!contextState.drive) {
        throw new Error("Drive not initialized");
      }

      if (!contextState.hasStoageAccount) {
        await initAccount();
      }

      if (!contextState.storageAcc) {
        throw new Error("No account found");
      }

      const filterFile = new File([filterContent], "default-filter.json", {
        type: "application/json",
      });

      const getStorageAccount = await contextState.drive.getStorageAccount(
        contextState.storageAcc
      );
      console.log(`getStorageAccount:`, getStorageAccount);

      const fileKeys = await contextState.drive.listObjects(
        contextState.storageAcc
      );

      if (!fileKeys.keys.includes("default-filter.json")) {
        const loadingToastHandler = toast(
          "Uploading filter file to storage account..."
        );
        try {
          console.log("new file upload");
          const upload = await contextState.drive.uploadFile(
            contextState.storageAcc,
            filterFile
          );
          console.log(`upload:`, upload);
          setContextState((state) => ({
            ...state,
            uploadUrl: upload.finalized_locations[0],
          }));
          setRefreshFlag(true);
          return upload.finalized_locations[0]!;
        } catch (e) {
          toast.error("Failed to upload filter file");
        } finally {
          toast.dismiss(loadingToastHandler);
        }
      } else {
        console.log("edit file upload");
        const { finalized_location } = await contextState.drive.editFile(
          contextState.storageAcc,
          `https://shdw-drive.genesysgo.net/${contextState.storageAcc.toString()}/default-filter.json`,
          filterFile
        );
        console.log(`finalized_location: `, finalized_location);
        setContextState((state) => ({
          ...state,
          uploadUrl: finalized_location,
        }));
        setRefreshFlag(true);
        return finalized_location;
      }

      return null;
    },
    [
      contextState.drive,
      contextState.hasStoageAccount,
      contextState.storageAcc,
      initAccount,
    ]
  );

  return (
    <UploadFilterContext.Provider
      value={{
        hasStoageAccount: contextState.hasStoageAccount,
        storageAcc: contextState.storageAcc,
        uploadUrl: contextState.uploadUrl,
        initAccount,
        uploadFilter,
        uploadRefreshFlag: refreshFlag,
        setUploadRefreshFlag: setRefreshFlag,
      }}
    >
      {children}
    </UploadFilterContext.Provider>
  );
};

// export function useUploadFilter() {
//   const { connection } = useConnection();
//   const wallet = useWallet();
//   const [uploadUrl, setUploadUrl] = useState<string | undefined>();
//   const [refreshFlag, setRefreshFlag] = useState<boolean>(false);
//   const [drive, setDrive] = useState<ShdwDrive | undefined>();
//   const [storageAcc, setStorageAcc] = useState<PublicKey | null | undefined>(
//     undefined
//   );

//   /**
//    * load "drive"
//    */
//   useEffect(() => {
//     console.log("new ShdwDrive");
//     new ShdwDrive(connection, wallet).init().then((drive) => {
//       setDrive(drive);
//     });
//   }, [connection, wallet]);

//   /**
//    * load file storage account
//    */
//   useEffect(() => {
//     (async () => {
//       console.debug("drive", drive);
//       if (!drive) {
//         console.debug("!drive");
//         return;
//       }
//       const accounts: {
//         publicKey: PublicKey;
//         account: StorageAccountV2;
//       }[] = await drive.getStorageAccounts();
//       try {
//         const acc = accounts.find(
//           (acc) => acc.account.identifier === "solstage"
//         )?.publicKey;
//         console.debug("setStorageAcc(acc);");
//         setStorageAcc(acc);
//       } catch (e) {
//         console.debug("setStorageAcc(null);");
//         setStorageAcc(null);
//       }
//     })();
//   }, [drive]);

//   // // check storage account exists
//   // const checkAccountExists = useCallback(() => {
//   //   return !!storageAcc;
//   // }, [storageAcc]);

//   /**
//    * init storage account
//    */
//   const initAccount = useCallback(async () => {
//     if (!drive) return null;
//     const { shdw_bucket, transaction_signature } =
//       await drive.createStorageAccount("solstage", "100KB");
//     console.log(`shdw_bucket: ${shdw_bucket}`);
//     console.log(`transaction_signature: ${transaction_signature}`);
//   }, [drive]);

//   /**
//    * upload/edit filter file to shadow drive
//    */
//   const uploadFilter = useCallback(
//     (filterContent: string) => {
//       (async () => {
//         if (!drive) {
//           throw new Error("Drive not initialized");
//         }

//         if (!storageAcc) {
//           await initAccount();
//         }

//         if (!storageAcc) {
//           throw new Error("No account found");
//         }

//         const filterFile = new File([filterContent], "default-filter.json", {
//           type: "application/json",
//         });

//         const getStorageAccount = await drive.getStorageAccount(storageAcc);
//         console.log(`getStorageAccount:`, getStorageAccount);

//         const fileKeys = await drive.listObjects(storageAcc);
//         if (!fileKeys.keys.includes("default-filter.json")) {
//           console.log("new file upload");
//           const upload = await drive.uploadFile(storageAcc, filterFile);
//           console.log(`upload:`, upload);
//           setUploadUrl(upload.finalized_locations[0]);
//           setRefreshFlag(true);
//         } else {
//           console.log("edit file upload");
//           const { finalized_location } = await drive.editFile(
//             storageAcc,
//             `https://shdw-drive.genesysgo.net/${storageAcc.toString()}/default-filter.json`,
//             filterFile
//           );
//           console.log(`finalized_location: `, finalized_location);
//           setUploadUrl(finalized_location);
//           setRefreshFlag(true);
//         }
//       })();
//     },
//     [drive, initAccount, storageAcc]
//   );

//   return {
//     storageAcc,
//     initAccount,
//     uploadFilter,
//     refreshFlag,
//     setRefreshFlag,
//   };
// }

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
