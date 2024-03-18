import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import account from "@coral-xyz/anchor/dist/cjs/program/namespace/account";
import { NFTAssetResultData } from "./nft-query/asset-result-data";
import { Card, Flex, Tabs, Tooltip } from "antd";

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
  const { cluster } = useCluster();
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

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
        <button
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
        </button>
      </div>
    </div>
  );
}

export function NftsDisplay({
  items,
  showImage = true,
}: {
  items: NFTAssetResultData[];
  showImage?: boolean;
}) {
  const nftCards = items.map((item: NFTAssetResultData) => {
    return (
      <Card
        key={item.address.toString()}
        title={
          <div className="">
            <a
              target="_blank"
              href={`https://solscan.io/token/${item.address}`}
            >
              {item.name}
            </a>
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
          <div
            className={
              "w-[205px] h-[205px] " +
              (showImage ? "" : "border-dashed border-2 border-grey-600")
            }
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
      </Card>
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

export function AccountNFTs({ address }: { address: PublicKey }) {
  // const [showAll, setShowAll] = useState(false);
  const showAll = true;
  const query = useGetWalletNfts({ address });
  const client = useQueryClient();

  const whitelistFilter = {
    collections: {
      J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w: 1,
      "5f2PvbmKd9pRLjKdMr8nrK8fNisLi7irjB6X5gopnKpB": 1,
    },
  };

  const stageItems = useMemo(() => {
    // console.log(query.data);
    const result =
      query.data?.filter((item) => {
        if ((item.group ?? "")?.startsWith("2i")) {
          console.log(item.group);
        }
        return item?.group && whitelistFilter.collections[item.group];
      }) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [query.data, showAll, whitelistFilter.collections]);

  const junkBoxItems = useMemo(() => {
    const result =
      query.data?.filter(
        (item) => item?.group && !whitelistFilter.collections[item.group]
      ) ?? [];
    if (showAll) return result;
    return result.slice(0, 5);
  }, [query.data, showAll, whitelistFilter.collections]);

  const stageDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div>
          {stageItems.length === 0 ? (
            <div>No Stage NFTs found.</div>
          ) : (
            <div>
              <NftsDisplay items={stageItems} />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [query.isSuccess, stageItems]);

  const junkboxDisplay = useMemo(() => {
    if (query.isSuccess) {
      return (
        <div>
          {stageItems.length === 0 ? (
            <div>No Junk NFTs found.</div>
          ) : (
            <div>
              <NftsDisplay items={junkBoxItems} showImage={false} />
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }, [junkBoxItems, query.isSuccess, stageItems.length]);

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
                label: `Stage`,
                key: "stage",
                children: stageDisplay,
              },
              {
                label: `Junkbox`,
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
