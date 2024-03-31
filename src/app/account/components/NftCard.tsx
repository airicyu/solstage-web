import {
  SketchOutlined,
  AppstoreOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Card, Tooltip, Button } from "antd";
import { useState, useCallback, useMemo } from "react";
import { NFTAssetResultData } from "../nft-query/asset-result-data";

export function NftCard({
  item,
  defaultShowImage = true,
  currentType,
  viewMode = true,
  moveItemHandler,
}: {
  item: NFTAssetResultData;
  defaultShowImage?: boolean;
  currentType: string;
  viewMode: boolean;
  moveItemHandler: (item: NFTAssetResultData, from: string, to: string) => void;
}) {
  const [showImage, setShowImage] = useState(defaultShowImage);
  const flipShowImage = useCallback(() => {
    if (!defaultShowImage) {
      setShowImage((prev) => !prev);
    }
  }, [defaultShowImage]);

  const buttonPanel = useMemo(() => {
    if (viewMode) {
      return null;
    } else {
      return (
        <>
          <hr />
          <>
            {currentType !== "stage" && (
              <Button
                onClick={() => {
                  moveItemHandler(item, currentType, "stage");
                }}
              >
                <SketchOutlined />
              </Button>
            )}
            {currentType !== "backstage" && (
              <Button
                onClick={() => {
                  moveItemHandler(item, currentType, "backstage");
                }}
              >
                <AppstoreOutlined />
              </Button>
            )}
            {currentType !== "junkbox" && (
              <Button
                onClick={() => {
                  moveItemHandler(item, currentType, "junkbox");
                }}
              >
                <StopOutlined />
              </Button>
            )}
          </>
        </>
      );
    }
  }, [currentType, item, moveItemHandler, viewMode]);

  return (
    <Card
      key={item.address.toString()}
      title={
        <div className="">
          {(item.group && (
            <a target="_blank" href={`https://solscan.io/token/${item.group}`}>
              {item.groupName}
            </a>
          )) ||
            item.groupName}
        </div>
      }
      style={{ width: 250 }}
    >
      <Tooltip
        title={
          <>
            <div>
              attributes:
              <ul>
                {item.attributes.map((attr) => (
                  <li key={attr.traitType}>
                    {" - "}
                    {attr.traitType}: {attr.value}
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
        trigger="click"
      >
        <div className="">
          <a target="_blank" href={`https://solscan.io/token/${item.address}`}>
            {item.name}
          </a>
        </div>
        <div
          className={
            "w-[205px] h-[205px] " +
            (showImage ? "" : "border-dashed border-2 border-grey-600")
          }
          onClick={flipShowImage}
        >
          <div className="w-[205px] h-[205px] ">
            {showImage && item.imageUrl ? (
              <img
                src={item.imageUrl}
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>
        </div>
      </Tooltip>
      <div>
        {item.floorPrice && (
          <div>
            floor price: ${Math.round(item.floorPrice.price * 1000) / 1000}
          </div>
        )}
      </div>
      {buttonPanel}
    </Card>
  );
}
