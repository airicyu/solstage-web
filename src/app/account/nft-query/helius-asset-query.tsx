import axios from "axios";
import { Attribute, NFTAssetResultData } from "./asset-result-data";
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

export function parseNftAssetResultData(json: any): NFTAssetResultData {
  let address: string = "";
  let compressed: boolean = false;
  let group: string | null = null;
  let groupName: string | null = null;
  let name: string = "";
  let symbol: string | null = null;
  let attributes: Attribute[] = [];
  let imageUrl: string | null = null;
  let fallbackImageUrl: string | null = null;

  address = json["id"] ?? "";
  compressed = !!json["compression"]?.["compressed"];

  if (json["grouping"]?.[0]?.["group_key"] === "collection") {
    group = json["grouping"][0]["group_value"] ?? null;
    groupName = group;
  }

  const content = json["content"];
  if (content) {
    name = content["metadata"]?.["name"] ?? "";
    symbol = content["metadata"]?.["symbol"] ?? "";

    try {
      if (Array.isArray(content["metadata"]?.["attributes"])) {
        attributes = content["metadata"]["attributes"].map((item) => {
          return {
            traitType: item["trait_type"],
            value: item["value"],
          };
        });
      }
    } catch (e) {
      // print(e);
    }
  }

  const imageUrls: string[] = [];
  if (content != null && Array.isArray(content["files"])) {
    const firstImageFile = content["files"].find(
      (e) => e["mime"] != null && e["mime"].startsWith("image/")
    );

    if (firstImageFile != null && firstImageFile["cdn_uri"] != null) {
      imageUrls.push(firstImageFile["cdn_uri"]);
    }

    if (firstImageFile != null && firstImageFile["uri"] != null) {
      imageUrls.push(firstImageFile["uri"]);
    }
  }

  if (content["links"]?.["image"] != null) {
    imageUrls.push(content["links"]?.["image"]);
  }

  imageUrl = imageUrls[0] ?? null;
  fallbackImageUrl = imageUrls.length >= 2 ? imageUrls[1] : imageUrl;

  return {
    address,
    name,
    compressed,
    symbol,
    group,
    groupName,
    imageUrl,
    fallbackImageUrl,
    attributes,
    floorPrice: null,
  };
}
