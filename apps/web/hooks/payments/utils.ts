import { BalanceCheckParams } from "./types";

export function checkSufficientBalance({ availableBalance, requiredAmount, token }: BalanceCheckParams): {
    sufficient: boolean;
    message?: string;
} {
    const available = parseFloat(availableBalance);
    const required = parseFloat(requiredAmount);

    if (required > available) {
        return {
            sufficient: false,
            message: `Insufficient ${token} balance. Required: ${required} ${token}, Available: ${available.toFixed(token === "ETH" ? 4 : 2)} ${token}`
        };
    }

    return { sufficient: true };
}
