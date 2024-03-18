import { NFTAssetResultData } from "./asset-result-data";
import axios from "axios";

export async function queryOwnerNft(
  address: string
): Promise<NFTAssetResultData[]> {
  const apiResultCache = localStorage.getItem(
    "solflare-portfolio-nft-api-result-cache"
  );
  if (apiResultCache) {
    const cache = JSON.parse(apiResultCache);
    if (cache.address === address && Date.now() < cache.ex) {
      return cache.data;
    } else {
      localStorage.removeItem("solflare-portfolio-nft-api-result-cache");
    }
  }

  const { data: queryResponse } = await axios({
    url: `https://wallet-api.solflare.com/v2/portfolio/nfts/${address}?network=mainnet&currency=USD&listings=1`,
  });
  const sourceNftModels = (queryResponse as QueryResponse).nfts;

  const nftModels: NFTAssetResultData[] = await Promise.all(
    sourceNftModels.map(async (nft) => {
      return {
        address: nft.id,
        name: nft.name,
        compressed: nft.compressed,
        symbol: nft.symbol,
        group: nft.group ?? nft.groupSingle ?? null,
        groupName: nft.groupName ?? null,
        imageUrl: nft.image ?? null,
        fallbackImageUrl: nft.image ?? null,
        attributes: nft.attributes,
      };
    })
  );

  localStorage.setItem(
    "solflare-portfolio-nft-api-result-cache",
    JSON.stringify({
      address,
      data: nftModels,
      ex: Date.now() + 1000 * 60 * 5,
    })
  );
  return nftModels;
}

type QueryResponse = {
  nfts: NFTModel[];
};

type NFTModel = {
  id: string;
  name: string;
  symbol: string;
  image: string;
  externalUrl: string;
  attributes: {
    traitType: string;
    value: string;
  }[];
  compressed: boolean;
  group: string | null;
  groupSingle: string | null;
  groupName: string | null;
};
