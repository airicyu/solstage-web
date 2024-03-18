import { useCallback } from "react";
import { Input, Typography } from "antd";
import { useSettings } from "./settings-utils";

export const SettingsPage = () => {
  const { birdEyeApiKey, setBirdEyeApiKey, heliusApiKey, setHeliusApiKey } =
    useSettings();

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
          <Typography.Title level={5}>Helius API key</Typography.Title>

          <Input
            style={{ width: 400 }}
            defaultValue={heliusApiKey ?? ""}
            onChange={(e) => {
              onChangeInput(e, setHeliusApiKey);
            }}
          />
        </div>

        <div className="py-3">
          <Typography.Title level={5}>Birdeye API key</Typography.Title>

          <Input
            style={{ width: 400 }}
            defaultValue={birdEyeApiKey ?? ""}
            onChange={(e) => {
              onChangeInput(e, setBirdEyeApiKey);
            }}
          />
        </div>
      </div>
    </div>
  );
};
