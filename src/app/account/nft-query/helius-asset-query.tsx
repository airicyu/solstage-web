import axios from "axios";
import {
  NFTAssetResultData,
  parseNftAssetResultData,
} from "./asset-result-data";
import { sleep } from "../../utils/sleep";

export async function queryOwnerNft(
  heliusApiEndpointUrl: string,
  address: string
): Promise<NFTAssetResultData[]> {
  let page = 1;
  const items: NFTAssetResultData[] = [];

  for (;;) {
    let queryItems: NFTAssetResultData[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        queryItems = await queryOwnerNftPage(
          heliusApiEndpointUrl,
          address,
          page
        );
        if (queryItems) {
          break;
        }
      } catch (e) {
        await sleep(1000 * i);
      }
    }
    if (queryItems) {
      items.push(...queryItems);
    }
    await sleep(1000);
    if (queryItems.length < QUERY_PAGE_SIZE) {
      break;
    }
    page++;
    if (page >= 10) {
      break;
    }
  }
  return items;
}

const QUERY_PAGE_SIZE = 100;

export async function queryOwnerNftPage(
  heliusApiEndpointUrl: string,
  address: string,
  page: number
): Promise<NFTAssetResultData[]> {
  const response = await axios.request({
    url: heliusApiEndpointUrl,
    method: "POST",
    data: {
      jsonrpc: "2.0",
      id: "0",
      method: "getAssetsByOwner",
      params: {
        ownerAddress: address,
        options: {
          showUnverifiedCollections: false,
          showCollectionMetadata: false,
          showFungible: false,
          showNativeBalance: false,
          showInscription: false,
          showZeroBalance: false,
        },
        page: page,
        limit: QUERY_PAGE_SIZE,
        //sortBy: { sortBy: "id", sortDirection: "asc" },
      },
    },
  });
  return (
    response.data.result.items.map((e) => parseNftAssetResultData(e)) ?? []
  );
}
