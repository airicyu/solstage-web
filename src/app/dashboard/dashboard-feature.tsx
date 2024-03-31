import { Button, Input, Tooltip } from "antd";
import { AppHero } from "../ui/ui-layout";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

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
      <AppHero title="Solstage" subtitle="Your Wallet, Your NFT Profile" />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <h2>Wallet address to check:</h2>
          <Input
            defaultValue={inputAddress}
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            placeholder="Input the wallet address to view"
            size="large"
            className={"w-[420px]"}
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
          {/* {links.map((link, index) => (
            <div key={index}>
              <a
                href={link.href}
                className="link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </div>
          ))} */}
        </div>
      </div>
    </div>
  );
}
