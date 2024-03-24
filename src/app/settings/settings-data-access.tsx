import { useAtom } from "jotai";
import { ReactNode, createContext, useContext } from "react";
import { heliusRpcEndpointAtom } from "../shared/atoms";

export interface SettingsContextType {
  heliusRpcEndpoint: string | null;
  setHeliusRpcEndpoint: (heliusRpcEndpoint: string | null) => void;
}

export const SettingsContext = createContext<SettingsContextType>(
  {} as SettingsContextType
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [heliusApiKey, setHeliusRpcEndpoint] = useAtom(heliusRpcEndpointAtom);

  const value: SettingsContextType = {
    heliusRpcEndpoint: heliusApiKey,
    setHeliusRpcEndpoint,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
