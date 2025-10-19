// lib/blockscout.ts
import type { Address } from "viem";

const BLOCKSCOUT_API = "https://base-sepolia.blockscout.com/api";
export interface BlockscoutTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed?: string;
  isError: string;          // "0" = success, "1" = failed
  txreceipt_status?: string;
  input: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
  type?:string;
  transactionHash?: string;
}


export interface BlockscoutLog {
  address: string;           // Contract address that emitted the log
  blockNumber: string;       // e.g. "6274823"
  timeStamp: string;         // Unix timestamp in seconds
  data: string;              // Hex-encoded event data
  topics: string[];          // Array of up to 4 topic hashes
  transactionHash: string;   // Transaction containing the event
  transactionIndex: string;  // Position in block
  blockHash: string;         // Hash of block containing the log
  logIndex: string;          // Position within transaction logs
  gasPrice?: string;         // sometimes included
  gasUsed?: string;          // sometimes included
}
export interface BlockscoutInternalTransaction {
  blockNumber: string;
  callType: string;
  contractAddress: string;
  errCode: string | null;
  timeStamp: string;
  from: string;
  gas: string;
  gasUsed: string;
  index:string;
    input: string;
      isError: string;
  transactionHash: string;
  type:string;
  to: string;
  value: string;
  traceId: string;

  
}

/**
 * Fetch normal transactions for an address
 * /api?module=account&action=txlist
 */
export async function getAccountTransactions(params: {
  address: Address;
  page?: number;
  limit?: number;
  startblock?: number;
  endblock?: number;
  sort?: "asc" | "desc";
}) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlist");
  url.searchParams.set("address", params.address);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("offset", String(params.limit ?? 50));
  url.searchParams.set("sort", params.sort ?? "desc");
  if (params.startblock) url.searchParams.set("startblock", String(params.startblock));
  if (params.endblock) url.searchParams.set("endblock", String(params.endblock));

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const data = await res.json();
  return data.result ?? [];
}

/**
 * Fetch internal transactions (contract calls)
 * /api?module=account&action=txlistinternal
 */
export async function getInternalTransactions(params: {
  address: Address;
  page?: number;
  limit?: number;
  startblock?: number;
  endblock?: number;
}) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "txlistinternal");
  url.searchParams.set("address", params.address);
  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("offset", String(params.limit ?? 50));
  url.searchParams.set("sort", "desc");
  if (params.startblock) url.searchParams.set("startblock", String(params.startblock));
  if (params.endblock) url.searchParams.set("endblock", String(params.endblock));

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch internal transactions");
  const data = await res.json();
  return data.result ?? [];
}

/**
 * Fetch event logs for an address or topic
 * /api?module=logs&action=getLogs
 */
export async function getLogs(params: {
  address: Address;
  fromBlock?: number;
  toBlock?: number;
  topic0?: string;
  topic1?: string;
}) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "logs");
  url.searchParams.set("action", "getLogs");
  url.searchParams.set("address", params.address);
  if (params.fromBlock) url.searchParams.set("fromBlock", String(params.fromBlock));
  if (params.toBlock) url.searchParams.set("toBlock", String(params.toBlock));
  if (params.topic0) url.searchParams.set("topic0", params.topic0);
  if (params.topic1) url.searchParams.set("topic1", params.topic1);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch logs");
  const data = await res.json();
  return data.result ?? [];
}

/**
 * Fetch transaction details (includes logs)
 * /api?module=transaction&action=gettxinfo
 */
export async function getTransaction(txHash: string) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "transaction");
  url.searchParams.set("action", "gettxinfo");
  url.searchParams.set("txhash", txHash);

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch transaction");
  const data = await res.json();
  return data.result ?? null;
}

/**
 * Fetch verified contract source code
 * /api?module=contract&action=getsourcecode
 */
export async function getContractSource(address: Address) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "contract");
  url.searchParams.set("action", "getsourcecode");
  url.searchParams.set("address", address);

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result ?? null;
}

/**
 * Example: fetch UserOperation logs by topic filter
 * Filters EntryPoint for UserOperationEvent
 */
export async function getUserOpExecutionLogs(params: {
  entryPointAddress: Address;
  accountAddress: Address;
}) {
  const url = new URL(BLOCKSCOUT_API);
  url.searchParams.set("module", "logs");
  url.searchParams.set("action", "getLogs");
  url.searchParams.set("address", params.entryPointAddress);
  url.searchParams.set(
    "topic0",
    "0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f"
  );

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch userOp logs");
  const data = await res.json();

  if (!params.accountAddress) return data.result ?? [];

  const filtered = (data.result ?? []).filter((log: any) =>
    log.topics.some((t: string) =>
      t.toLowerCase().includes(params.accountAddress.slice(2).toLowerCase())
    )
  );
  return filtered;
}
