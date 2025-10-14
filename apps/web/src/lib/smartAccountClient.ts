import { createSmartAccountClient } from "permissionless";
import { http } from "viem";
import { baseSepolia } from "viem/chains";
import { pimlicoClient, pimlicoBundlerUrl } from "./pimlico";
import { CustomSmartAccount } from "./customSmartAccount";

// Build a Smart Account client around your custom account
export async function getSmartAccountClient(
  customSmartAccount: CustomSmartAccount
) {
  return createSmartAccountClient({
    account: customSmartAccount,          
    chain: baseSepolia,                   
    bundlerTransport: http(pimlicoBundlerUrl), 
    paymaster: pimlicoClient,             // optional paymaster for sponsored txs
    userOperation: {
      // fetch fast gas price for userOps
      estimateFeesPerGas: async () =>
        (await pimlicoClient.getUserOperationGasPrice()).fast,
    },
  });
}
