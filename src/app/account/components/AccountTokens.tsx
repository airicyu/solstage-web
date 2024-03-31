import { PublicKey } from "@solana/web3.js";
import { IconRefresh } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ExplorerLink } from "../../cluster/cluster-ui";
import { ellipsify } from "../../ui/ui-layout";
import { useGetTokenAccounts } from "../account-data-access";

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
