import { useProgram } from "./program-data-access";
import { bytesToHexString, hashSha256 } from "../utils/hash";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input, Tag } from "antd";
import { useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";

export function ProgramCreate() {
  const wallet = useWallet();
  const { initialize, setFilter, getFilterAccount } = useProgram();
  const [filterState, setFilterState] = useState<{
    url?: string;
    hashBytes?: number[];
    hash?: string;
    content?: string;
  }>({});
  const [inputUrl, setInputUrl] = useState("");

  useEffect(() => {
    const filterAccountData = getFilterAccount?.data?.value?.data;
    if (!filterAccountData) {
      return;
    }
    const filterHashBytes = Array.from(filterAccountData as Buffer).slice(
      8,
      8 + 32
    );

    const filterHash = bytesToHexString(filterHashBytes);
    if (!filterHash) {
      return;
    }

    const urlBytesLenth = new BN(
      Array.from(filterAccountData as Buffer).slice(8 + 32, 8 + 32 + 4),
      "le"
    ).toNumber();
    if (!urlBytesLenth) {
      return;
    }

    const filterUrl = Buffer.from(
      Array.from(filterAccountData as Buffer).slice(
        8 + 32 + 4,
        8 + 32 + 4 + urlBytesLenth
      )
    ).toString();

    setFilterState((prev) => {
      return {
        ...prev,
        hashBytes: filterHashBytes,
        hash: filterHash,
        url: filterUrl,
      };
    });
  }, [getFilterAccount?.data, getFilterAccount?.data?.value]);

  useEffect(() => {
    (async () => {
      let filterContent = "";
      if (filterState.url) {
        try {
          filterContent = await (
            await fetch(filterState.url, { cache: "no-cache" })
          ).text();
        } catch (e) {
          console.error(e);
        }
        setFilterState((prev) => {
          return {
            ...prev,
            content: filterContent,
          };
        });
      }
    })();
  });

  return (
    <>
      <div className="my-6">
        <button
          className="btn btn-xs lg:btn-md btn-primary"
          onClick={() => {
            if (!wallet.publicKey) {
              return;
            }

            initialize?.mutateAsync();
          }}
          disabled={!!initialize?.isPending}
        >
          Run Initialize {!!initialize?.isPending && "..."}
        </button>
      </div>

      <hr />

      <div className="my-6 ">
        <h2 className="text-4xl">On chain state:</h2>
        <div className="my-6 text-left">
          <div className="my-2">
            Filter URL: <Tag>{filterState.url}</Tag>
          </div>
          <div className="my-2">
            Filter hash: <Tag>{filterState.hash}</Tag>
          </div>
          <div className="my-2">
            Filter hash bytes:{" "}
            <Tag>{JSON.stringify(filterState.hashBytes)}</Tag>
          </div>
        </div>
      </div>

      <hr />

      <div className="my-6 ">
        <h2 className="text-4xl">Off chain filter content:</h2>
        <div className="my-6 text-left">
          <pre className="w-[800px] overflow-auto">{filterState.content}</pre>
        </div>
      </div>

      <hr />

      <div className="my-6">
        <h2 className="text-4xl">Set Filter URL</h2>

        <div className="my-6 text-left">
          <div className="my-2">
            New filter URL:{" "}
            <Input
              defaultValue={inputUrl}
              placeholder="Put the new URL here"
              onChange={(e) => {
                setInputUrl(e.target.value);
              }}
            />
          </div>

          <div className="my-2">
            <button
              className="btn btn-xs lg:btn-md btn-primary"
              onClick={async () => {
                if (!wallet.publicKey) {
                  return;
                }

                const url = inputUrl;

                const content = await (
                  await fetch(url, { cache: "no-cache" })
                ).text();
                const hash = await hashSha256(content);

                setFilter?.mutateAsync({ url, hash });
              }}
              disabled={!!setFilter?.isPending}
            >
              Set filter {!!setFilter?.isPending && "..."}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
