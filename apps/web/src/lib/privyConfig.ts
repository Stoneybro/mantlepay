import type { PrivyClientConfig } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum:{
      createOnLogin:"users-without-wallets",
    }
  },
  defaultChain:baseSepolia,
  supportedChains: [baseSepolia],
  loginMethods: [ "email", "google","github","wallet"],
  appearance: {
    accentColor: "#38CCCD",
    theme: "light",
    landingHeader: "Dapp-Auth",
    walletChainType: "ethereum-only",
    walletList: ["detected_wallets"],
  },
};
