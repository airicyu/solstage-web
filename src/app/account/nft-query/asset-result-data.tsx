export type Attribute = {
  traitType: string;
  value: any;
};

export type NFTAssetResultData = {
  address: string;
  name: string;
  compressed: boolean;
  symbol: string | null;
  group: string | null;
  groupName: string | null;
  imageUrl: string | null;
  fallbackImageUrl: string | null;
  attributes: Attribute[];
};

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
  };
}
