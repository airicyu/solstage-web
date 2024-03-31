import { PublicKey } from "@solana/web3.js";
import { useEffect, useMemo } from "react";

import { useParams } from "react-router-dom";

import { ExplorerLink } from "../cluster/cluster-ui";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { AccountButtons } from "./components/AccountButtons";
import { AccountNFTs } from "./components/AccountNFTs";
import { useProgram } from "../program/program-utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { Tooltip } from "antd";

export default function AccountDetailFeature() {
  const params = useParams();
  const wallet = useWallet();
  const address = useMemo(() => {
    if (!params.address) {
      return;
    }
    try {
      return new PublicKey(params.address);
    } catch (e) {
      console.log(`Invalid public key`, e);
    }
  }, [params]);
  const { setAddress } = useProgram();

  const viewMode =
    !address || !wallet.publicKey || !address.equals(wallet.publicKey);

  useEffect(() => {
    if (address && setAddress) {
      setAddress(address);
    }
  }, [address, setAddress]);

  const viewModeNotice = useMemo(() => {
    if (!viewMode) {
      return null;
    }

    if (!wallet.publicKey) {
      return (
        <>
          <Tooltip title="This is not your wallet. If you want to manage your wallet profile. Please connect to your wallet to see.">
            (View only mode)
          </Tooltip>
        </>
      );
    }

    if (!address) {
      return <div>Error loading account</div>;
    }

    return (
      <>
        <Tooltip title="This is not your wallet. If you want to manage your wallet profile. Please connect to your wallet to see.">
          (View only mode)
        </Tooltip>{" "}
        <a
          href={`/#/profile/${wallet.publicKey}`}
          rel="noopener noreferrer"
          className={`link font-mono`}
        >
          {" "}
          Switch to your wallet
        </a>
      </>
    );
  }, [viewMode, wallet.publicKey]);

  return (
    <div>
      {/* <AppHero
        title={<AccountBalance address={address} />} */}
      <AppHero
        title={"Solstage"}
        subtitle={
          <>
            <div className="my-4">
              wallet:{" "}
              <ExplorerLink
                path={`account/${address}`}
                label={ellipsify(address.toString())}
              />{" "}
            </div>
            <div className="my-4">{viewModeNotice}</div>
          </>
        }
      >
        <div className="my-4">
          <AccountButtons address={address} />
        </div>
      </AppHero>
      <div className="space-y-8">
        {/* <AccountTokens address={address} /> */}
        {/* <AccountTransactions address={address} /> */}
        <AccountNFTs address={address} />
      </div>
    </div>
  );
}
