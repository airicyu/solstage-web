import { Button, Input, Tooltip } from "antd";
import { AppHero } from "../ui/ui-layout";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "./../../assets/solstage-logo.png";

export default function DashboardFeature() {
  const wallet = useWallet();

  const [inputAddress, setInputAddress] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (wallet.publicKey) {
      setInputAddress(wallet.publicKey.toBase58());
    }
  }, [wallet.publicKey]);

  const goSearch = useCallback(() => {
    if (inputAddress && inputAddress.trim().length > 0) {
      navigate(`/profile/${inputAddress}`);
    }
  }, [inputAddress, navigate]);

  return (
    <div>
      <AppHero
        title="Solstage"
        subtitle={
          <>
            <p className="py-[10px]">
              Putting NFTs in categorized filter boxes!
            </p>
            <div className="space-y-2 flex justify-center">
              <img className="h-[200px]" alt="Logo" src={logo} />
            </div>
          </>
        }
      />

      <div className="max-w-xl mx-auto py-2 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <Input
            defaultValue={inputAddress}
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Input the wallet address to view"
            size="small"
            className={"w-[370px]"}
          />
          <div className="space-x-2 inline-block m-1"></div>
          <Tooltip title="search">
            <Button
              type="primary"
              shape="circle"
              className="bg-[#1677ff]"
              icon={<SearchOutlined />}
              disabled={!inputAddress || inputAddress.trim().length === 0}
              onClick={goSearch}
            />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
