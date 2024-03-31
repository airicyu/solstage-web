import { NFTAssetResultData } from "./nft-query/asset-result-data";

export type Filter = {
  stage: string[];
  backstage: string[];
  loadFilters: string[];
};

export type FilterState = {
  url?: string;
  hash?: string;
  filter: Filter | null;
};

export const moveItemGetUpdateFilter = (
  item: NFTAssetResultData,
  from: string,
  to: string,
  filter: Filter
): Filter => {
  const itemAddressKey = "a," + item.address;
  const draftFilter: Filter = JSON.parse(JSON.stringify(filter));
  if (to === "junkbox") {
    if (from === "stage") {
      draftFilter.stage = draftFilter.stage.filter(
        (item) => item !== itemAddressKey
      );
    } else if (from === "backstage") {
      draftFilter.backstage = draftFilter.backstage.filter(
        (item) => item !== itemAddressKey
      );
    }
  } else if (to === "stage") {
    if (!draftFilter.stage.find((item) => item === itemAddressKey)) {
      draftFilter.stage.push(itemAddressKey);
    }
    if (from === "backstage") {
      draftFilter.backstage = draftFilter.backstage.filter(
        (item) => item !== itemAddressKey
      );
    }
  } else if (to === "backstage") {
    if (!draftFilter.backstage.find((item) => item === itemAddressKey)) {
      draftFilter.backstage.push(itemAddressKey);
    }
    if (from === "stage") {
      draftFilter.stage = draftFilter.stage.filter(
        (item) => item !== itemAddressKey
      );
    }
  }
  return draftFilter;
};
