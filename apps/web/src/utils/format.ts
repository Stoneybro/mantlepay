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

/**
 * Formats a timestamp (bigint or number in seconds) to a relative time string.
 * Shows "Just now", "5m ago", "2h ago", "3d ago", or full date for older timestamps.
 */
export function formatTimestamp(timestamp: bigint | number): string {
  // Convert bigint to number if needed
  const timestampNum = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  
  const date = new Date(timestampNum * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats wei value to human-readable ETH string without exponential notation.
 * Handles very small values (like PYUSD with 6 decimals) appropriately.
 * @param wei Wei amount as bigint
 * @param decimals Token decimals (default 18 for ETH)
 * @returns Formatted string with appropriate precision
 */
export function formatEth(wei: bigint, decimals: number = 18): string {
  if (wei === 0n) return "0";
  
  // Convert to decimal string manually to avoid exponential notation
  const weiStr = wei.toString();
  const isNegative = weiStr.startsWith('-');
  const absWeiStr = isNegative ? weiStr.slice(1) : weiStr;
  
  // Pad with zeros if needed
  const paddedWei = absWeiStr.padStart(decimals + 1, '0');
  
  // Split into integer and decimal parts
  const integerPart = paddedWei.slice(0, -decimals) || '0';
  const decimalPart = paddedWei.slice(-decimals);
  
  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimalPart.replace(/0+$/, '');
  
  // Format the result
  let result = integerPart;
  if (trimmedDecimal) {
    // Limit decimal places for readability
    const maxDecimals = Number(integerPart) > 0 ? 4 : 8;
    const limitedDecimal = trimmedDecimal.slice(0, maxDecimals);
    result = `${integerPart}.${limitedDecimal}`;
  }
  
  return isNegative ? `-${result}` : result;
}

/**
 * Smart token amount formatter that handles different token decimals.
 * Automatically detects token type and formats accordingly.
 */
export function formatTokenAmount(amount: bigint, token: string): string {
  const tokenLower = token?.toLowerCase();
  
  // PYUSD uses 6 decimals
  if (tokenLower === 'pyusd' || tokenLower === '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9') {
    return formatEth(amount, 6);
  }
  
  // Default to 18 decimals for ETH and unknown tokens
  return formatEth(amount, 18);
}