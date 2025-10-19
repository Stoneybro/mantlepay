import { formatEther } from "viem";

/**
 * Formats a BigInt ETH value to a human-readable string with 4 decimal places.
 * Standardizes ETH display across the app for balances and transactions.
 */
export function formatNumber(number: bigint): string {
  return parseFloat(Number(formatEther(number)).toFixed(4)).toString();
}

/**
 * Shortens a blockchain address for display purposes.
 * Defaults to 6 chars start / 4 chars end, improving UI readability.
 */
export function truncateAddress(address: string, start = 6, end = 6): string {
  if (!address) return "";
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Formats a UNIX timestamp (seconds) to a localized date string.
 * Provides consistent human-readable date display in the UI.
 */
export function formatDate(date: bigint): string {
  return new Date(Number(date) * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
