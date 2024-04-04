import { createContext, useCallback, useEffect, useState } from "react";
import { ShdwDrive, StorageAccountV2 } from "@shadow-drive/sdk";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import toast from "react-hot-toast";

export type UploadFilterContextType = {
  hasStoageAccount: boolean | undefined;
  storageAcc: PublicKey | undefined;
  uploadUrl: string | undefined;
  initAccount: () => Promise<void>;
  uploadFilter: (filterContent: string) => Promise<string | null>;
};

export const UploadFilterContext = createContext<UploadFilterContextType>({
  hasStoageAccount: undefined,
  storageAcc: undefined,
  uploadUrl: undefined,
  initAccount: async () => {},
  uploadFilter: async () => {
    return null;
  },
} as UploadFilterContextType);

type UploadFilterContextState = {
  drive?: ShdwDrive;
  hasStoageAccount?: boolean;
  storageAcc?: PublicKey;
  uploadUrl?: string;
};

const STORAGE_FILTER_ACC_NAME = "solstage";
const FILTER_FILE_NAME = "default-filter.json";

export const UploadFilterContextProvider = ({ children }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
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
          (acc) => acc.account.identifier === STORAGE_FILTER_ACC_NAME
        )?.publicKey;

        if (acc) {
          console.log("setStorageAcc(acc);");
          setContextState((state) => ({
            ...state,
            drive,
            hasStoageAccount: true,
            storageAcc: acc,
          }));
          toast.success("Storage account loaded.");
        } else {
          console.log("setStorageAcc(undefined);");
          setContextState((state) => ({
            ...state,
            drive,
            hasStoageAccount: false,
            storageAcc: undefined,
          }));
          toast.success("Storage account is not found!");
        }
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
        toast.error("You need to have at least 0.01 $SHDW to create storage!");
        throw new Error("No $SHDW token account.");
        // const loadingToastHandler = toast(
        //   "No SHDW account found, swapping SOL for some SHDW for account bootstrap."
        // );
        // try {
        //   await swapSolForShdw(wallet, connection, 0.1);
        //   toast.success("Swap SOL for SHDW transaction succeeded!");
        // } catch (e) {
        //   toast.error(
        //     "Swap SOL for SHDW transaction failed! Please try again."
        //   );
        //   throw e;
        // } finally {
        //   toast.dismiss(loadingToastHandler);
        // }
      }

      const info = await connection.getTokenAccountBalance(ata);
      console.log("shdw balance", info.value.uiAmount);
      if (info.value.uiAmount != null && info.value.uiAmount < 0.01) {
        toast.error("You need to have at least 0.01 $SHDW to create storage!");
        throw new Error("Not enough SHDW token balance!");
        // const loadingToastHandler = toast(
        //   "Swapping SOL for some SHDW for account bootstrap."
        // );
        // try {
        //   await swapSolForShdw(wallet, connection, 0.1);
        //   toast.success("Swap SOL for SHDW transaction succeeded!");
        // } catch (e) {
        //   toast.error(
        //     "Swap SOL for SHDW transaction failed! Please try again."
        //   );
        //   throw e;
        // } finally {
        //   toast.dismiss(loadingToastHandler);
        // }
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
        await contextState.drive.createStorageAccount(
          STORAGE_FILTER_ACC_NAME,
          "100KB"
        );
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

      const filterFile = new File([filterContent], FILTER_FILE_NAME, {
        type: "application/json",
      });

      const getStorageAccount = await contextState.drive.getStorageAccount(
        contextState.storageAcc
      );
      console.log(`getStorageAccount:`, getStorageAccount);

      const fileKeys = await contextState.drive.listObjects(
        contextState.storageAcc
      );

      if (!fileKeys.keys.includes(FILTER_FILE_NAME)) {
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
      }}
    >
      {children}
    </UploadFilterContext.Provider>
  );
};
