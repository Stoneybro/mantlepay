import { formatEther } from "viem";

export const formatInterval = (seconds: number) => {
    if (seconds >= 86400) return `${seconds / 86400} day(s)`;
    if (seconds >= 3600) return `${seconds / 3600} hour(s)`;
    if (seconds >= 60) return `${seconds / 60} minute(s)`;
    return `${seconds} second(s)`;
};

export const formatStartTime = (timestamp: number) => {
    if (timestamp === 0) return "Immediately";
    return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Shortens a blockchain address for display purposes.
 * Defaults to 6 chars start / 4 chars end, improving UI readability.
 */
export function truncateAddress(address: string, start = 6, end = 6): string {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Formats a BigInt ETH value to a human-readable string with 4 decimal places.
 * Standardizes ETH display across the app for balances and transactions.
 */
export function formatNumber(number: bigint): string {
  return parseFloat(Number(formatEther(number)).toFixed(4)).toString();
}