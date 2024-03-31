import { Flex } from "antd";
import { NFTAssetResultData } from "../nft-query/asset-result-data";
import { NftCard } from "./NftCard";

export function NftsDisplay({
  items,
  defaultShowImage = true,
  currentType,
  viewMode = true,
  moveItemHandler,
}: {
  items: NFTAssetResultData[];
  defaultShowImage?: boolean;
  currentType: string;
  viewMode: boolean;
  moveItemHandler: (item: NFTAssetResultData, from: string, to: string) => void;
}) {
  const nftCards = items.map((item: NFTAssetResultData) => {
    return (
      <NftCard
        key={item.address.toString()}
        item={item}
        defaultShowImage={defaultShowImage}
        currentType={currentType}
        viewMode={viewMode}
        moveItemHandler={moveItemHandler}
      />
    );
  });

  return (
    <Flex wrap="wrap" gap="small" className="">
      {nftCards}
    </Flex>
  );
}
