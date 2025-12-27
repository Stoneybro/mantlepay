// Shared utility functions for tool components

/**
 * Format a time interval in seconds to human-readable format
 */
export const formatInterval = (seconds: number): string => {
    if (seconds >= 86400) return `${seconds / 86400} day(s)`;
    if (seconds >= 3600) return `${seconds / 3600} hour(s)`;
    if (seconds >= 60) return `${seconds / 60} minute(s)`;
    return `${seconds} second(s)`;
};

/**
 * Format a Unix timestamp to human-readable start time
 */
export const formatStartTime = (timestamp: number): string => {
    if (timestamp === 0) return "Immediately";
    return new Date(timestamp * 1000).toLocaleString();
};
