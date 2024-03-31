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
  floorPrice: {
    currency: string;
    price: number;
  } | null;
};
