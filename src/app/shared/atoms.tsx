import { atomWithStorage } from "jotai/utils";
import { SettingsKeys } from "./../settings/settings-const";
import { atom } from "jotai";

export const birdEyeApiKeyAtom = atomWithStorage<string | null>(
  SettingsKeys.BIRD_EYE_API_KEY,
  null
);

export const heliusApiKeyAtom = atomWithStorage<string | null>(
  SettingsKeys.HELIUS_API_KEY,
  null
);

export const heliusApiEndpointUrlAtom = atom<string | null>((get) => {
  const heliusApiKey = get(heliusApiKeyAtom);
  if (heliusApiKey) {
    return `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
  } else {
    return null;
  }
});

// export const connectionAtom = atom<Connection | null>((get) => {
//   const heliusApiEndpointUrl = get(heliusApiEndpointUrlAtom);
//   if (heliusApiEndpointUrl) {
//     return new Connection(heliusApiEndpointUrl);
//   } else {
//     return null;
//   }
// });
