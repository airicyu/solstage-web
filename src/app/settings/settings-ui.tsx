import { useCallback } from "react";
import { Input, Typography } from "antd";
import { useSettings } from "./settings-data-access";

export const SettingsPage = () => {
  const { heliusRpcEndpoint, setHeliusRpcEndpoint } = useSettings();

  const onChangeInput = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      setterFunction: (value: string) => void
    ) => {
      const value = event.target.value;
      setterFunction(value);
    },
    []
  );

  return (
    <div>
      <div
        className="mx-auto py-6 sm:px-6 lg:px-8 text-center"
        style={{ width: 1200 }}
      >
        <div className="py-3">
          <Typography.Title level={5}>Helius RPC endpoint</Typography.Title>

          <Input
            style={{ width: 400 }}
            defaultValue={heliusRpcEndpoint ?? ""}
            onChange={(e) => {
              onChangeInput(e, setHeliusRpcEndpoint);
            }}
          />
        </div>
      </div>
    </div>
  );
};
