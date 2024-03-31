import { useContext } from "react";
import { UploadFilterContext } from "./upload-filter";

export const useUploadFilter = () => useContext(UploadFilterContext);
