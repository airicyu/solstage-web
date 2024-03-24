import { atomWithStorage } from "jotai/utils";
import { SettingsKeys } from "./../settings/settings-const";
import { atom } from "jotai";

export const heliusRpcEndpointAtom = atomWithStorage<string | null>(
  SettingsKeys.HELIUS_RPC_ENDPOINT,
  null
);

export const heliusRpcEndpointUrlAtom = atom<string | null>((get) => {
  const heliusRpcEndpoint = get(heliusRpcEndpointAtom);
  return heliusRpcEndpoint ?? null;
});
