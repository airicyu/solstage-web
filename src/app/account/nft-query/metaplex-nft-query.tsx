import { Connection, PublicKey } from "@solana/web3.js";
import { Attribute, NFTAssetResultData } from "./asset-result-data";
import { Metadata, Metaplex, Nft, Sft } from "@metaplex-foundation/js";

export async function queryOwnerNft(
  connection: Connection,
  address: string
): Promise<NFTAssetResultData[]> {
  const metaplex = new Metaplex(connection);
  const metaplexNfts: (Metadata | Nft | Sft)[] = await metaplex
    .nfts()
    .findAllByOwner({
      owner: new PublicKey(address),
    });

  const nftModels: NFTAssetResultData[] = await Promise.all(
    metaplexNfts.map(async (nft) => {
      const metadata = await fetch(nft.uri).then((res) => res.json());
      const imageUrl = metadata.image as string;

      return {
        address: nft.address.toString(),
        name: nft.name,
        compressed: !!nft.compression?.compressed,
        symbol: nft.symbol,
        group: nft.collection?.address.toString() ?? null,
        groupName: nft.collection?.address.toString() ?? null,
        imageUrl: imageUrl ?? nft.json?.image ?? null,
        fallbackImageUrl: imageUrl ?? nft.json?.image ?? null,
        attributes: [] as Attribute[],
      };
    })
  );

  return nftModels;
}
