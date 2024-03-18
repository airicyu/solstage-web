import { useAtom } from "jotai";
import { ReactNode, createContext } from "react";
import { birdEyeApiKeyAtom, heliusApiKeyAtom } from "../shared/atoms";

export interface SettingsContextType {
  birdEyeApiKey: string | null;
  setBirdEyeApiKey: (birdEyeApiKey: string | null) => void;
  heliusApiKey: string | null;
  setHeliusApiKey: (heliusApiKey: string | null) => void;
}

export const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [birdEyeApiKey, setBirdEyeApiKey] = useAtom(birdEyeApiKeyAtom);
  const [heliusApiKey, setHeliusApiKey] = useAtom(heliusApiKeyAtom);

  const value: SettingsContextType = {
    birdEyeApiKey,
    setBirdEyeApiKey,
    heliusApiKey,
    setHeliusApiKey,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
