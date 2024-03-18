import { PublicKey } from "@solana/web3.js";

export const programId = new PublicKey(
  "2tTPEdegKhcWD6h22PTFxZfbaK2P6KEZ1Va2SZV29Vrn"
);

export type Basic = {
  version: "0.1.0";
  name: "basic";
  instructions: [
    {
      name: "greet";
      accounts: [];
      args: [];
    }
  ];
};

export const IDL: Basic = {
  version: "0.1.0",
  name: "basic",
  instructions: [
    {
      name: "greet",
      accounts: [],
      args: [],
    },
  ],
};
