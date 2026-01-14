import type { PrivyClientConfig } from "@privy-io/react-auth";
import { mantleTestnet } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  defaultChain: mantleTestnet,
  supportedChains: [mantleTestnet],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#38CCCD",
    theme: "light",
    landingHeader: "MantlePay",
    walletChainType: "ethereum-only",
    walletList: ["detected_wallets"],
  },
};
