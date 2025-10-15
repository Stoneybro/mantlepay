import { createSmartAccountClient } from "permissionless";
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { pimlicoClient, pimlicoBundlerUrl, publicClient } from "./pimlico";
import { CustomSmartAccount } from "./customSmartAccount";

// Build a Smart Account client around your custom account
export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,          
    chain: baseSepolia,
    client: publicClient,  // Use public RPC for state reads
    bundlerTransport: http(pimlicoBundlerUrl), 
    paymaster: pimlicoClient,
  });
}
