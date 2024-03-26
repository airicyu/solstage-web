import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppModal, ellipsify } from "../ui/ui-layout";
import { useCluster } from "../cluster/cluster-data-access";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useGetWalletNfts,
  useRequestAirdrop,
  useTransferSol,
} from "./account-data-access";
import { NFTAssetResultData } from "./nft-query/asset-result-data";
import {
  AppstoreOutlined,
  SketchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { useProgram } from "../program/program-data-access";
import { bytesToHexString, hashSha256 } from "../utils/hash";
import { BN } from "bn.js";
import toast from "react-hot-toast";
import { Button, Card, Flex, Tabs, Tooltip } from "antd";
import { useUploadFilter } from "../filter/upload-filter";

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address });

  return (
    <div>
      <h1
        className="text-5xl font-bold cursor-pointer"
        onClick={() => query.refetch()}
      >
        {query.data ? <BalanceSol balance={query.data} /> : "..."} SOL
      </h1>
    </div>
  );
}
export function AccountChecker() {
  const { publicKey } = useWallet();
  if (!publicKey) {
    return null;
  }
  return <AccountBalanceCheck address={publicKey} />;
}
export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster();
  const mutation = useRequestAirdrop({ address });
  const query = useGetBalance({ address });

  if (query.isLoading) {
    return null;
  }
  if (query.isError || !query.data) {
    return (
      <div className="alert alert-warning text-warning-content/80 rounded-none flex justify-center">
        <span>
          You are connected to <strong>{cluster.name}</strong> but your account
          is not found on this cluster.
        </span>
        <button
          className="btn btn-xs btn-neutral"
          onClick={() =>
            mutation.mutateAsync(1).catch((err) => console.log(err))
          }
        >
          Request Airdrop
        </button>
      </div>
    );
  }
  return null;
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const wallet = useWallet();
  // const { cluster } = useCluster();
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const { initialize, getFilterAccount } = useProgram();
  const { storageAcc, hasStoageAccount, initAccount } = useUploadFilter();
  // const { connection } = useConnection();
  const [isLoadingInit, setIsLoadingInit] = useState(false);

  const needInit = useMemo(() => {
    if (getFilterAccount?.isLoading) {
      return false;
    }
    return !getFilterAccount?.data?.value || storageAcc === undefined;
  }, [getFilterAccount?.data?.value, getFilterAccount?.isLoading, storageAcc]);

  return (
    <div>
      <ModalAirdrop
        hide={() => setShowAirdropModal(false)}
        address={address}
        show={showAirdropModal}
      />
      <ModalReceive
        address={address}
        show={showReceiveModal}
        hide={() => setShowReceiveModal(false)}
      />
      <ModalSend
        address={address}
        show={showSendModal}
        hide={() => setShowSendModal(false)}
      />
      <div className="space-x-2">
        {needInit && (
          <Button
            className="btn btn-xs lg:btn-md btn-outline"
            type="default"
            onClick={async () => {
              if (!wallet.publicKey) {
                toast.error(
                  "Wallet not connected! Please connect wallet first."
                );
                return;
              }
              if (getFilterAccount?.isLoading) {
                toast.error(
                  "Filter account is loading! Please wait some seconds and try again."
                );
                return;
              }
              setIsLoadingInit(true);
              try {
                if (hasStoageAccount === undefined) {
                  toast.error(
                    "Storage account is loading! Please wait some seconds and try again."
                  );
                  return;
                }
                console.log("storageAcc", hasStoageAccount, storageAcc);
                if (hasStoageAccount === false) {
                  await initAccount();
                }

                if (!getFilterAccount?.data?.value) {
                  console.log("need inital filter account");
                }
                const loadingToastHandler = toast.loading(
                  "Initializing account on chain..."
                );
                try {
                  await initialize?.mutateAsync();
                } catch (e) {
                  console.error(e);
                  toast.error("Failed to initialize account on chain");
                } finally {
                  toast.dismiss(loadingToastHandler);
                }
              } catch (e) {
                console.error(e);
                toast.error("Failed to initialize account");
              } finally {
                setIsLoadingInit(false);
              }
            }}
            loading={isLoadingInit}
          >
            Initialize Account
          </Button>
        )}
        {/* <button
          disabled={cluster.network?.includes("mainnet")}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowAirdropModal(true)}
        >
          Airdrop
        </button>
        <button
          disabled={wallet.publicKey?.toString() !== address.toString()}
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowSendModal(true)}
        >
          Send
        </button>
        <button
          className="btn btn-xs lg:btn-md btn-outline"
          onClick={() => setShowReceiveModal(true)}
        >
          Receive
        </button> */}
      </div>
    </div>
  );
}

export function NftCard({
  item,
  defaultShowImage = true,
  currentType,
  moveItemHandler,
}: {
  item: NFTAssetResultData;
  defaultShowImage?: boolean;
  currentType: string;
  moveItemHandler: (item: NFTAssetResultData, from: string, to: string) => void;
}) {
  const [showImage, setShowImage] = useState(defaultShowImage);
  const flipShowImage = useCallback(() => {
    if (!defaultShowImage) {
      setShowImage((prev) => !prev);
    }
  }, [defaultShowImage]);

  return (
    <Card
      key={item.address.toString()}
      title={
        <div className="">
          {(item.group && (
            <a target="_blank" href={`https://solscan.io/token/${item.group}`}>
              {item.groupName}
            </a>
          )) ||
            item.groupName}
        </div>
      }
      style={{ width: 250 }}
    >
      <Tooltip
        title={
          <>
            <div>
              attributes:
              <ul>
                {item.attributes.map((attr) => (
                  <li key={attr.traitType}>
                    {" - "}
                    {attr.traitType}: {attr.value}
                  </li>
                ))}
              </ul>
            </div>
          </>
        }
        trigger="click"
      >
        <div className="">
          <a target="_blank" href={`https://solscan.io/token/${item.address}`}>
            {item.name}
          </a>
        </div>
        <div
          className={
            "w-[205px] h-[205px] " +
            (showImage ? "" : "border-dashed border-2 border-grey-600")
          }
          onClick={flipShowImage}
        >
          <div className="w-[205px] h-[205px] ">
            {showImage && item.imageUrl ? (
              <img
                src={item.imageUrl}
                style={{
                  width: 200,
                  height: 200,
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>
        </div>
      </Tooltip>
      <hr />
      <>
        {currentType !== "stage" && (
          <Button
            onClick={() => {
              moveItemHandler(item, currentType, "stage");
            }}
          >
            <SketchOutlined />
          </Button>
        )}
        {currentType !== "backstage" && (
          <Button
            onClick={() => {
              moveItemHandler(item, currentType, "backstage");
            }}
          >
            <AppstoreOutlined />
          </Button>
        )}
        {currentType !== "junkbox" && (
          <Button
            onClick={() => {
              moveItemHandler(item, currentType, "junkbox");
            }}
          >
            <StopOutlined />
          </Button>
        )}
      </>
    </Card>
  );
}

export function NftsDisplay({
  items,
  defaultShowImage = true,
  currentType,
  moveItemHandler,
}: {
  items: NFTAssetResultData[];
  defaultShowImage?: boolean;
  currentType: string;
  moveItemHandler: (item: NFTAssetResultData, from: string, to: string) => void;
}) {
  const nftCards = items.map((item: NFTAssetResultData) => {
    return (
      <NftCard
        key={item.address.toString()}
        item={item}
        defaultShowImage={defaultShowImage}
        currentType={currentType}
        moveItemHandler={moveItemHandler}
      />
    );
  });

  return (
    <Flex wrap="wrap" gap="small" className="">
      {nftCards}
    </Flex>
  );

  return (
    <table className="table border-4 rounded-lg border-separate border-base-300 w-[80vw]">
      <thead>
        <tr>
          <th>Collection</th>
          <th>Mint</th>
          <th>Name</th>
          <th className="text-right">Image</th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item: NFTAssetResultData) => (
          <tr key={item.address.toString()}>
            <td>
              <div className="flex space-x-2">
                <span className="font-mono">
                  {item.group ? (
                    <ExplorerLink
                      label={
                        item.groupName ?? (item.group && ellipsify(item.group))
                      }
                      path={`account/${item.group}`}
                    />
                  ) : (
                    "Unknown"
                  )}
                </span>
              </div>
            </td>
            <td>
              <div className="flex space-x-2">
                <span className="font-mono">
                  <ExplorerLink
                    label={ellipsify(item.address)}
                    path={`account/${item.address}`}
                  />
                </span>
              </div>
            </td>
            <td>
              <div className="flex space-x-2">
                <span className="font-mono">
                  {item.name ?? item.address.toString()}
                </span>
              </div>
            </td>
            <td className="text-right">
              <span className="font-mono">
                {defaultShowImage && item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    style={{
                      width: 200,
                      height: 200,
                      objectFit: "contain",
                    }}
                  />
                ) : null}
              </span>
            </td>
          </tr>
        ))}

        {/* {(query.data?.length ?? 0) > 5 && (
          <tr>
            <td colSpan={4} className="text-center">
              <button
                className="btn btn-xs btn-outline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show Less" : "Show All"}
              </button>
            </td>
          </tr>
        )} */}
      </tbody>
    </table>
  );
}

export type Filter = {
  stage: string[];
  backstage: string[];
  loadFilters: string[];
};

type FilterState = {
  url?: string;
  hash?: string;
  filter: Filter | null;
};

export function AccountNFTs({ address }: { address: PublicKey }) {
  // const [showAll, setShowAll] = useState(false);
  const showAll = true;
  const query = useGetWalletNfts({ address });
  const client = useQueryClient();
  const { getFilterAccount, setFilter } = useProgram();
  const { storageAcc } = useUploadFilter();
  const [filterState, setFilterState] = useState<FilterState>({
    url: undefined,
    hash: undefined,
    filter: null,
  });
  const { uploadFilter, uploadRefreshFlag, setUploadRefreshFlag } =
    useUploadFilter();
  const { cluster } = useCluster();

  const needInit = useMemo(() => {
    if (getFilterAccount?.isLoading) {
      return false;
    }
    return !getFilterAccount?.data?.value || storageAcc === null;
  }, [getFilterAccount?.data?.value, getFilterAccount?.isLoading, storageAcc]);

  /**
   * when re-upload filter, refresh filter account
   */
  useEffect(() => {
    if (uploadRefreshFlag) {
      setUploadRefreshFlag(false);
      client.invalidateQueries({
        queryKey: ["get-filter-account", { cluster: "devnet" }],
      });
      getFilterAccount?.refetch();
    }
  }, [client, getFilterAccount, setUploadRefreshFlag, uploadRefreshFlag]);

  /**
   * load filter url & hash from filter account
   */
  useEffect(() => {
    if (!getFilterAccount?.data?.value) {
      return;
    }
    const filterHash = bytesToHexString(
      Array.from(getFilterAccount.data.value.data as Buffer).slice(8, 8 + 32)
    );
    if (!filterHash) {
      return;
    }

    const urlBytesLenth = new BN(
      Array.from(getFilterAccount?.data.value.data as Buffer).slice(
        8 + 32,
        8 + 32 + 4
      ),
      "le"
    ).toNumber();
    if (!urlBytesLenth) {
      return;
    }

    const filterUrl = Buffer.from(
      Array.from(getFilterAccount?.data.value.data as Buffer).slice(
        8 + 32 + 4,
        8 + 32 + 4 + urlBytesLenth
      )
    ).toString();

    setFilterState((prev) => {
      return { ...prev, hash: filterHash, url: filterUrl };
    });
  }, [getFilterAccount?.data?.value]);

  /**
   * check filter hash and update Filter
   */
  useEffect(() => {
    (async () => {
      if (!filterState.url) {
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
      console.log("filter:", filter);
      setFilterState((prev) => {
        return { ...prev, filter };
      });
    })();
  }, [filterState.hash, filterState.url, getFilterAccount?.data?.value]);

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

  const stageItems = useMemo(() => {
    const result =
      query.data?.filter((item) => {
        return item?.group && stageWhitelistFilter.items[item.address];
      }) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [query.data, showAll, stageWhitelistFilter.items]);

  const backstageItems = useMemo(() => {
    // console.log(query.data);
    const result =
      query.data?.filter((item) => {
        if ((item.group ?? "")?.startsWith("2i")) {
          console.log(item.group);
        }
        return item?.group && backstageWhitelistFilter.items[item.address];
      }) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [query.data, showAll, backstageWhitelistFilter.items]);

  const junkBoxItems = useMemo(() => {
    const result =
      query.data?.filter(
        (item) =>
          item?.group &&
          !stageWhitelistFilter.items[item.address] &&
          !backstageWhitelistFilter.items[item.address]
      ) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [
    backstageWhitelistFilter.items,
    query.data,
    showAll,
    stageWhitelistFilter.items,
  ]);

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

      const hash = await hashSha256(filterContent);

      const loadingToastHandler = toast.loading("Updating filter...");
      try {
        const uploadUrl = await uploadFilter(filterContent);
        if (uploadUrl && !filterState.url) {
          await setFilter?.mutateAsync({ url: uploadUrl, hash });
          await client.invalidateQueries({
            queryKey: ["get-filter-account", { cluster }],
          });
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to update filter");
      } finally {
        toast.dismiss(loadingToastHandler);
      }
    },
    [
      client,
      cluster,
      filterState.filter,
      filterState.url,
      needInit,
      setFilter,
      uploadFilter,
    ]
  );

  const stageDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div>
          {stageItems.length === 0 ? (
            <div>No Stage NFTs found.</div>
          ) : (
            <div>
              <NftsDisplay
                items={stageItems}
                currentType="stage"
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [moveItemHandler, query.isSuccess, stageItems]);

  const backstageDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div>
          {backstageItems.length === 0 ? (
            <div>No Stage NFTs found.</div>
          ) : (
            <div>
              <NftsDisplay
                items={backstageItems}
                currentType="backstage"
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [query.isSuccess, backstageItems, moveItemHandler]);

  const junkboxDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div>
          {junkBoxItems.length === 0 ? (
            <div>No Junk NFTs found.</div>
          ) : (
            <div>
              <NftsDisplay
                items={junkBoxItems}
                defaultShowImage={true}
                currentType="junkbox"
                moveItemHandler={moveItemHandler}
              />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [junkBoxItems, moveItemHandler, query.isSuccess]);

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
                  onClick={async () => {
                    await query.refetch();
                    await client.invalidateQueries({
                      queryKey: ["getTokenAccountBalance"],
                    });
                  }}
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
                    <SketchOutlined /> STAGE
                  </>
                ),
                key: "stage",
                children: stageDisplay,
              },
              {
                label: (
                  <>
                    <AppstoreOutlined /> BACKSTAGE
                  </>
                ),
                key: "backstage",
                children: backstageDisplay,
              },
              // {
              //   label: (
              //     <>
              //       <GiftOutlined /> GIFT
              //     </>
              //   ),
              //   key: "gift",
              //   children: <>Up coming!</>,
              // },
              {
                label: (
                  <>
                    <StopOutlined /> JUNKBOX
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

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const query = useGetTokenAccounts({ address });
  const client = useQueryClient();
  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ["getTokenAccountBalance"],
                  });
                }}
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
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Public Key</th>
                  <th>Mint</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {items?.map(({ account, pubkey }) => (
                  <tr key={pubkey.toString()}>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(pubkey.toString())}
                            path={`account/${pubkey.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <span className="font-mono">
                        {account.data.parsed.info.tokenAmount.uiAmount}
                      </span>
                    </td>
                  </tr>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? "Show Less" : "Show All"}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const query = useGetSignatures({ address });
  const [showAll, setShowAll] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => query.refetch()}
            >
              <IconRefresh size={16} />
            </button>
          )}
        </div>
      </div>
      {query.isError && (
        <pre className="alert alert-error">
          Error: {query.error?.message.toString()}
        </pre>
      )}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : (
            <table className="table border-4 rounded-lg border-separate border-base-300">
              <thead>
                <tr>
                  <th>Signature</th>
                  <th className="text-right">Slot</th>
                  <th>Block Time</th>
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.signature}>
                    <th className="font-mono">
                      <ExplorerLink
                        path={`tx/${item.signature}`}
                        label={ellipsify(item.signature, 8)}
                      />
                    </th>
                    <td className="font-mono text-right">
                      <ExplorerLink
                        path={`block/${item.slot}`}
                        label={item.slot.toString()}
                      />
                    </td>
                    <td>
                      {new Date((item.blockTime ?? 0) * 1000).toISOString()}
                    </td>
                    <td className="text-right">
                      {item.err ? (
                        <div
                          className="badge badge-error"
                          title={JSON.stringify(item.err)}
                        >
                          Failed
                        </div>
                      ) : (
                        <div className="badge badge-success">Success</div>
                      )}
                    </td>
                  </tr>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={() => setShowAll(!showAll)}
                      >
                        {showAll ? "Show Less" : "Show All"}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function BalanceSol({ balance }: { balance: number }) {
  return (
    <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>
  );
}

function ModalReceive({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  return (
    <AppModal title="Receive" hide={hide} show={show}>
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  );
}

function ModalAirdrop({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const mutation = useRequestAirdrop({ address });
  const [amount, setAmount] = useState("2");

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount)).then(() => hide())}
    >
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}

function ModalSend({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const wallet = useWallet();
  const mutation = useTransferSol({ address });
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("1");

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>;
  }

  return (
    <AppModal
      hide={hide}
      show={show}
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation
          .mutateAsync({
            destination: new PublicKey(destination),
            amount: parseFloat(amount),
          })
          .then(() => hide());
      }}
    >
      <input
        disabled={mutation.isPending}
        type="text"
        placeholder="Destination"
        className="input input-bordered w-full"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />
      <input
        disabled={mutation.isPending}
        type="number"
        step="any"
        min="1"
        placeholder="Amount"
        className="input input-bordered w-full"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
    </AppModal>
  );
}

function moveItemGetUpdateFilter(
  item: NFTAssetResultData,
  from: string,
  to: string,
  filter: Filter
): Filter {
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
}
