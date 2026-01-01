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
