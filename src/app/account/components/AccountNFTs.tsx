import {
  AppstoreOutlined,
  StopOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { PublicKey } from "@solana/web3.js";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, Tag } from "antd";
import { useState, useMemo, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../../cluster/cluster-data-access";
import { useUploadFilter } from "../../filter/upload-filter-util";
import { useProgram } from "../../program/program-utils";
import { bytesToHexString, hashSha256 } from "../../utils/hash";
import { useGetWalletNfts } from "../account-data-access";
import { Filter, moveItemGetUpdateFilter } from "../account-utils";
import { NFTAssetResultData } from "../nft-query/asset-result-data";
import { NftsDisplay } from "./NftsDisplay";
import { useWallet } from "@solana/wallet-adapter-react";
import "./AccountNFTs.css";

export function AccountNFTs({ address }: { address: PublicKey }) {
  // const [showAll, setShowAll] = useState(false);
  const showAll = true;
  const query = useGetWalletNfts({ address });
  const client = useQueryClient();
  const { getFilterInfo, setFilter } = useProgram();
  const { hasStoageAccount } = useUploadFilter();
  const [filterState, setFilterState] = useState<FilterState>({
    url: undefined,
    hash: undefined,
    filter: null,
    refreshFilterFlag: true,
  });
  const { uploadFilter } = useUploadFilter();
  const { cluster } = useCluster();
  const wallet = useWallet();

  const needInit = useMemo(() => {
    return !hasStoageAccount;
  }, [hasStoageAccount]);

  const viewMode =
    !address || !wallet.publicKey || !address.equals(wallet.publicKey);

  /**
   * load filter url & hash from filter info
   */
  useEffect(() => {
    if (!getFilterInfo || !getFilterInfo.isSuccess) {
      return;
    }

    console.log(
      "load filter url & hash from filter info",
      getFilterInfo?.data?.hash
    );

    const refreshFilterFlag =
      filterState.refreshFilterFlag ||
      filterState.url !== getFilterInfo.data?.url ||
      filterState.hash !== getFilterInfo.data?.hash;

    setFilterState((prev) => {
      return {
        ...prev,
        hash: getFilterInfo.data?.hash,
        url: getFilterInfo.data?.url,
        refreshFilterFlag,
      };
    });
  }, [
    filterState.hash,
    filterState.refreshFilterFlag,
    filterState.url,
    getFilterInfo,
    getFilterInfo?.data,
  ]);

  /**
   * check filter hash and update Filter obj
   */
  useEffect(() => {
    (async () => {
      console.log("check filter hash and update Filter obj", filterState.hash);
      if (!filterState.url) {
        return;
      }

      if (!filterState.refreshFilterFlag) {
        return;
      }

      const filterText = await (
        await fetch(filterState.url, { cache: "no-cache" })
      ).text();

      if (!filterText) {
        return null;
      }

      console.log("filterText: ", filterText);
      console.log("hash bytes: ", await hashSha256(filterText));
      console.log("hash", bytesToHexString(await hashSha256(filterText)));
      if (bytesToHexString(await hashSha256(filterText)) !== filterState.hash) {
        console.error("filter hash mismatch");
        // setFilterState((prev) => {
        //   return { ...prev, filter: null };
        // });
      }
      const filter = JSON.parse(filterText);
      console.log("set filter obj:", filter);
      setFilterState((prev) => {
        return { ...prev, filter, refreshFilterFlag: false };
      });
    })();
  }, [filterState.hash, filterState.refreshFilterFlag, filterState.url]);

  const refreshFilter = useCallback(async () => {
    await client.invalidateQueries({
      queryKey: ["get-filter-info", { cluster }],
    });
    await getFilterInfo?.refetch();
    console.log("getFilterInfo?.refetch()");
    setFilterState((prev) => {
      return { ...prev, refreshFilterFlag: true };
    });
  }, [client, cluster, getFilterInfo]);

  /**
   * handler to upload and update filter, will pass to NftsDisplay items to call
   */
  const moveItemHandler = useCallback(
    async (item: NFTAssetResultData, from: string, to: string) => {
      console.log(moveItemHandler);
      if (needInit) {
        toast.error("Need to initialize filter account first!");
        return;
      }
      console.log("moveItemHandler", item, from, to);
      console.log("filterState.filter", filterState.filter);
      const updateFIlter = moveItemGetUpdateFilter(
        item,
        from,
        to,
        filterState.filter ?? { stage: [], backstage: [], loadFilters: [] }
      );

      const filterContent = JSON.stringify(updateFIlter);

      const hash = bytesToHexString(await hashSha256(filterContent));

      const loadingToastHandler = toast.loading("Updating filter...");
      try {
        const uploadUrl = await uploadFilter(filterContent);
        console.log(
          "const uploadUrl = await uploadFilter(filterContent);",
          uploadUrl
        );
        if (uploadUrl) {
          if (
            uploadUrl !== filterState.url ||
            (filterState.hash !== "" && filterState.hash !== hash)
          ) {
            await setFilter?.mutateAsync({ url: uploadUrl, hash: "" });
          }

          await refreshFilter();
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to update filter");
      } finally {
        toast.dismiss(loadingToastHandler);
      }
    },
    [
      filterState.filter,
      filterState.hash,
      filterState.url,
      needInit,
      refreshFilter,
      setFilter,
      uploadFilter,
    ]
  );

  /**
   * build whitelist filter object for `stage``
   */
  const stageWhitelistFilter = useMemo(() => {
    const whitelistFilter = {
      items: {},
    };
    if (filterState.filter) {
      filterState.filter.stage
        .filter((item) => item.startsWith("a,"))
        .map((item) => item.split(",")[1])
        .forEach((item) => {
          whitelistFilter.items[item] = true;
        });
    }
    console.log("whitelistFilter:", whitelistFilter);
    return whitelistFilter;
  }, [filterState.filter]);

  /**
   * build whitelist filter object for `backstage`
   */
  const backstageWhitelistFilter = useMemo(() => {
    const whitelistFilter = {
      items: {},
    };
    if (filterState.filter) {
      filterState.filter.backstage
        .filter((item) => item.startsWith("a,"))
        .map((item) => item.split(",")[1])
        .forEach((item) => {
          whitelistFilter.items[item] = true;
        });
    }
    console.log("whitelistFilter:", whitelistFilter);
    return whitelistFilter;
  }, [filterState.filter]);

  /**
   * build query items sorted by floor price
   */
  const queryItems = useMemo(() => {
    return query.data?.slice().sort((a, b) => {
      if (a.floorPrice !== null && b.floorPrice === null) {
        return -1;
      } else if (a.floorPrice === null && b.floorPrice !== null) {
        return 1;
      } else if (a.floorPrice !== null && b.floorPrice !== null) {
        return b.floorPrice.price - a.floorPrice.price;
      } else {
        return 0;
      }
    });
  }, [query.data]);

  /**
   * build stage items
   */
  const stageItems = useMemo(() => {
    const result =
      queryItems?.filter((item) => {
        return item?.group && stageWhitelistFilter.items[item.address];
      }) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [queryItems, showAll, stageWhitelistFilter.items]);

  /**
   * build backstage items
   */
  const backstageItems = useMemo(() => {
    const result =
      queryItems?.filter((item) => {
        return item?.group && backstageWhitelistFilter.items[item.address];
      }) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [queryItems, showAll, backstageWhitelistFilter.items]);

  /**
   * build junkbox items
   */
  const junkBoxItems = useMemo(() => {
    const result =
      queryItems?.filter(
        (item) =>
          item?.group &&
          !stageWhitelistFilter.items[item.address] &&
          !backstageWhitelistFilter.items[item.address]
      ) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [
    backstageWhitelistFilter.items,
    queryItems,
    showAll,
    stageWhitelistFilter.items,
  ]);

  /**
   * display stage items
   */
  const stageDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div className="my-4">
          {stageItems.length === 0 ? (
            <div className="text-center">
              <Tag className="text-xl">No NFTs on Stage.</Tag>
            </div>
          ) : (
            <div>
              <NftsDisplay
                items={stageItems}
                currentType="stage"
                viewMode={viewMode}
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [moveItemHandler, query.isSuccess, stageItems, viewMode]);

  /**
   * display backstage items
   */
  const backstageDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div className="my-4">
          {backstageItems.length === 0 ? (
            <div className="text-center">
              <Tag className="text-xl">No NFTs on Backstage.</Tag>
            </div>
          ) : (
            <div>
              <NftsDisplay
                items={backstageItems}
                currentType="backstage"
                viewMode={viewMode}
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [query.isSuccess, backstageItems, viewMode, moveItemHandler]);

  /**
   * display junkbox items
   */
  const junkboxDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div className="my-4">
          {junkBoxItems.length === 0 ? (
            <div className="text-center">
              <Tag className="text-xl">No NFTs in Junkbox.</Tag>
            </div>
          ) : (
            <div>
              <NftsDisplay
                items={junkBoxItems}
                defaultShowImage={true}
                currentType="junkbox"
                viewMode={viewMode}
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [junkBoxItems, moveItemHandler, query.isSuccess, viewMode]);

  if (query.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }

  return (
    <>
      <div className="space-y-2">
        <div className="justify-between">
          <div className="flex justify-between">
            <h2 className="text-2xl font-bold">NFTs</h2>
            <div className="space-x-2">
              {query.isLoading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={refreshFilter}
                >
                  <IconRefresh size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        {query.isError && (
          <pre className="alert alert-error">
            Error: {query.error?.message.toString()}
          </pre>
        )}

        <div className="w-[90vw]">
          <Tabs
            defaultActiveKey="1"
            type="card"
            size="large"
            items={[
              {
                label: (
                  <>
                    <div className="text-2xl">
                      <HeartOutlined /> Stage
                    </div>
                  </>
                ),
                key: "stage",
                children: stageDisplay,
              },
              {
                label: (
                  <>
                    <div className="text-2xl">
                      <AppstoreOutlined /> Backstage
                    </div>
                  </>
                ),
                key: "backstage",
                children: backstageDisplay,
              },
              {
                label: (
                  <>
                    <div className="text-2xl">
                      <StopOutlined /> Junkbox
                    </div>
                  </>
                ),
                key: "junkbox",
                children: junkboxDisplay,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}

type FilterState = {
  url?: string;
  hash?: string;
  filter: Filter | null;
  refreshFilterFlag: boolean;
};
