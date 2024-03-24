import { PublicKey } from "@solana/web3.js";

export const programId = new PublicKey(
  "STAGYb3HZJW8CV1QEbhyc8WkLuJt44RtWHDpRgHe2pX"
);

export type SolstageProgram = {
  version: "0.1.0";
  name: "solstage_program";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "filterSource";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: "setFilter";
      accounts: [
        {
          name: "signer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "filterSource";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "signature";
          type: {
            array: ["u8", 32];
          };
        },
        {
          name: "url";
          type: "string";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "filterSource";
      type: {
        kind: "struct";
        fields: [
          {
            name: "signature";
            type: {
              array: ["u8", 32];
            };
          },
          {
            name: "url";
            type: "string";
          }
        ];
      };
    }
  ];
};

export const IDL: SolstageProgram = {
  version: "0.1.0",
  name: "solstage_program",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "filterSource",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: "setFilter",
      accounts: [
        {
          name: "signer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "filterSource",
          isMut: true,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "signature",
          type: {
            array: ["u8", 32],
          },
        },
        {
          name: "url",
          type: "string",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "filterSource",
      type: {
        kind: "struct",
        fields: [
          {
            name: "signature",
            type: {
              array: ["u8", 32],
            },
          },
          {
            name: "url",
            type: "string",
          },
        ],
      },
    },
  ],
};
