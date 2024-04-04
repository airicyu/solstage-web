import { NFTAssetResultData } from "./asset-result-data";
import axios from "axios";

const CACHE_STORE_KEY = "solflare-portfolio-nft-api-result-cache";

function getCacheItem(address: string): NFTAssetResultData[] | null {
  const apiResultRawCache = localStorage.getItem(CACHE_STORE_KEY);
  if (apiResultRawCache) {
    const cache = JSON.parse(apiResultRawCache);
    if (!Array.isArray(cache)) {
      localStorage.removeItem(CACHE_STORE_KEY);
    } else {
      const item = cache.find((item) => item.address === address);
      if (item) {
        if (Date.now() < item.ex) {
          return item.data as NFTAssetResultData[];
        } else {
          localStorage.setItem(
            CACHE_STORE_KEY,
            JSON.stringify(cache.filter((item) => item.address !== address))
          );
        }
      }
    }
  }
  return null;
}

function saveCacheItem(address: string, data: NFTAssetResultData[]) {
  const cacheItem = {
    address,
    data,
    ex: Date.now() + 1000 * 60 * 5,
  };

  const apiResultRawCache = localStorage.getItem(CACHE_STORE_KEY);

  let cache: any[] = [];

  if (apiResultRawCache) {
    cache = JSON.parse(apiResultRawCache);
    if (!Array.isArray(cache)) {
      cache = [];
    }
  }
  cache = [cacheItem, ...cache.filter((item) => item.data.address !== address)];
  cache.sort((a, b) => b.ex - a.ex);
  cache = cache.slice(0, 10);
  localStorage.setItem(CACHE_STORE_KEY, JSON.stringify(cache));
}

export async function queryOwnerNft(
  address: string
): Promise<NFTAssetResultData[]> {
  const cacheData = getCacheItem(address);

  if (cacheData) {
    return cacheData;
  }

  const { data: queryResponse } = await axios({
    url: `https://wallet-api.solflare.com/v2/portfolio/nfts/${address}?network=mainnet&currency=USD&listings=1`,
  });
  const sourceNftModels = (queryResponse as QueryResponse).nfts;

  const nftModels: NFTAssetResultData[] = sourceNftModels
    .map((nft) => {
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
        floorPrice:
          nft.currencyFloor.price !== null
            ? {
                currency: "USD",
                price: nft.currencyFloor.price,
              }
            : null,
      };
    })
    .filter((nft) => nft.group !== "scam");

  saveCacheItem(address, nftModels);
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
  currencyFloor: {
    price: number | null;
  };
};
