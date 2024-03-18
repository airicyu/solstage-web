import { useContext } from "react";
import { SettingsContext } from "./settings-data-access";

export function useSettings() {
  return useContext(SettingsContext);
}
