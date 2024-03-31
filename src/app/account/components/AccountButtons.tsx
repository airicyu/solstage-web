import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "antd";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useUploadFilter } from "../../filter/upload-filter-util";
import { ModalAirdrop, ModalReceive, ModalSend } from "./models";

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet();
  // const { cluster } = useCluster();
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const { storageAcc, hasStoageAccount, initAccount } = useUploadFilter();
  // const { connection } = useConnection();
  const [isLoadingInit, setIsLoadingInit] = useState(false);

  const needInit = useMemo(() => {
    return storageAcc === null;
  }, [storageAcc]);

  return (
    <div>
      <ModalAirdrop
        hide={() => setShowAirdropModal(false)}
        address={address}
        show={showAirdropModal}
      />
      <ModalReceive
        address={address}
        show={showReceiveModal}
        hide={() => setShowReceiveModal(false)}
      />
      <ModalSend
        address={address}
        show={showSendModal}
        hide={() => setShowSendModal(false)}
      />
      <div className="space-x-2">
        {needInit && (
          <Button
            className="btn btn-xs lg:btn-md btn-outline"
            type="default"
            onClick={async () => {
              if (!wallet.publicKey) {
                toast.error(
                  "Wallet not connected! Please connect wallet first."
                );
                return;
              }
              setIsLoadingInit(true);
              try {
                if (hasStoageAccount === undefined) {
                  toast.error(
                    "Storage account is loading! Please wait some seconds and try again."
                  );
                  return;
                }
                console.log("storageAcc", hasStoageAccount, storageAcc);
                if (hasStoageAccount === false) {
                  await initAccount();
                }
              } catch (e) {
                console.error(e);
                toast.error("Failed to initialize account");
              } finally {
                setIsLoadingInit(false);
              }
            }}
            loading={isLoadingInit}
          >
            Initialize Account
          </Button>
        )}
      </div>
    </div>
  );
}
