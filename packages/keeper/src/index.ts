
import { createPublicClient, createWalletClient, http, parseAbi, parseAbiItem } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mantleSepoliaTestnet } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://rpc.sepolia.mantle.xyz';


if (!process.env.PRIVATE_KEY) {
    console.error('❌ Error: PRIVATE_KEY is missing in .env file');
    console.error('   Please create a .env file in packages/keeper/ with PRIVATE_KEY=0x...');
    process.exit(1);
}

let privateKey = process.env.PRIVATE_KEY.trim();

// Auto-fix missing 0x prefix
if (!privateKey.startsWith('0x')) {
    privateKey = `0x${privateKey}`;
    console.log('ℹ️  Added missing "0x" prefix to private key.');
}

// Basic validation for hex string length (64 chars + 2 for 0x = 66)
if (privateKey.length !== 66) {
    console.error(`❌ Error: Invalid private key length (${privateKey.length}).`);
    console.error('   Expected 66 characters (including 0x prefix).');
    console.error('   Ensure there are no extra spaces or newline characters.');
    process.exit(1);
}

const PRIVATE_KEY = privateKey as `0x${string}`;

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
    chain: mantleSepoliaTestnet,
    transport: http(RPC_URL)
});

const walletClient = createWalletClient({
    account,
    chain: mantleSepoliaTestnet,
    transport: http(RPC_URL)
});

// MpIntentRegistry Address (Mantle Sepolia)
const REGISTRY_ADDRESS = '0x5D16F29E70e90ac48C7F4fb2c1145911a774eFbF';

// Minimal ABI for automation
const ABI = parseAbi([
    'function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory performData)',
    'function performUpkeep(bytes calldata performData) external'
]);

async function main() {
    console.log(`🚀 Starting Keeper Service...`);
    console.log(`   Wallet: ${account.address}`);
    console.log(`   Registry: ${REGISTRY_ADDRESS}`);
    console.log(`   RPC: ${RPC_URL}`);

    // Poll every 60 seconds
    setInterval(checkAndExecute, 60000);

    // Run immediately on start
    await checkAndExecute();
}

async function checkAndExecute() {
    try {
        console.log(`[${new Date().toLocaleTimeString()}] Checking for pending intents...`);

        const [upkeepNeeded, performData] = await publicClient.readContract({
            address: REGISTRY_ADDRESS,
            abi: ABI,
            functionName: 'checkUpkeep',
            args: ['0x'] // Empty bytes for checkData
        });

        if (upkeepNeeded) {
            console.log(`✅ Upkeep needed! Executing transaction...`);

            const hash = await walletClient.writeContract({
                address: REGISTRY_ADDRESS,
                abi: ABI,
                functionName: 'performUpkeep',
                args: [performData]
            });

            console.log(`🎉 Transaction sent: ${hash}`);
            console.log(`   Waiting for confirmation...`);

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);
            } else {
                console.error(`❌ Transaction failed!`);
            }

        } else {
            console.log(`zzz No upkeep needed.`);
        }

    } catch (error) {
        console.error('❌ Error in keeper loop:', error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
