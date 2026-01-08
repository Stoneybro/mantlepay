import type { PrivyClientConfig } from "@privy-io/react-auth";
import { sepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  defaultChain: sepolia,
  supportedChains: [sepolia],
  loginMethods: ["email", "google", "github"],
  appearance: {
    accentColor: "#38CCCD",
    theme: "light",
    landingHeader: "Aidra",
    walletChainType: "ethereum-only",
    walletList: ["detected_wallets"],
  },
};
