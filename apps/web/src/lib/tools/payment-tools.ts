import { tool } from 'ai';
import { z } from 'zod';
import { isAddress, parseEther } from 'viem';

/**
 * @notice SHARED PARSING UTILITIES
 * @dev These utilities are used by all the tools to parse the input from the user
 */
interface ParsedPayment {
    recipients: `0x${string}`[];
    amounts: string[];
}

function parseAddresses(text: string): `0x${string}`[] {
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const addresses = text.match(addressPattern) || [];
    if (addresses.length === 0) throw new Error('No valid addresses found');
    return addresses as `0x${string}`[];
}
function parseAmounts(text: string): string[] {
    const amounts: string[] = [];
    const amountMatches = text.match(/(\d+\.?\d*)\s*(eth|ether)?/gi);

    if (!amountMatches) {
        throw new Error('Could not find any amounts in the message');
    }

    amountMatches.forEach(match => {
        const amountMatch = match.match(/(\d+\.?\d*)/);
        if (amountMatch) amounts.push(amountMatch[1]);
    });

    return amounts;
}
function parseTimeExpression(expression: string): { duration: number; interval: number } {
    const intervals: Record<string, number> = {
        'second': 1,
        'minute': 60,
        'hour': 3600,
        'day': 86400,
        'week': 604800,
        'month': 2592000,
    };

    const intervalMatch = expression.match(/every\s+(\d+)?\s*(second|minute|hour|day|week|month)s?/i);
    const interval = intervalMatch
        ? (parseInt(intervalMatch[1] || '1') * intervals[intervalMatch[2].toLowerCase()])
        : 86400;

    const durationMatch = expression.match(/for\s+(?:a\s+)?(\d+)?\s*(second|minute|hour|day|week|month)s?/i);
    const duration = durationMatch
        ? (parseInt(durationMatch[1] || '1') * intervals[durationMatch[2].toLowerCase()])
        : interval * 7;

    return { duration, interval };
}
function validatePaymentParams(recipients: string[], amounts: string[]): void {
    // Validate addresses
    const invalidAddresses = recipients.filter(addr => !isAddress(addr));
    if (invalidAddresses.length > 0) {
        throw new Error(`Invalid addresses: ${invalidAddresses.join(', ')}`);
    }

    // Validate amounts are positive numbers
    amounts.forEach(amount => {
        const parsed = parseFloat(amount);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error(`Invalid amount: ${amount}`);
        }
    });
}


/**
 * @notice PAYMENT TYPE DETECTION
 * @dev This function is used to determine the type of payment to be created
 */
type PaymentType = 'single' | 'batch' | 'recurring';

function detectPaymentType(text: string): PaymentType {
    const lowerText = text.toLowerCase();

    // Check for recurring indicators
    const recurringKeywords = ['recurring', 'every', 'daily', 'weekly', 'monthly', 'repeat'];
    if (recurringKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'recurring';
    }

    // Check for batch indicators
    const addresses = parseAddresses(text);
    if (addresses.length > 1) {
        return 'batch';
    }

    return 'single';
}

/**
 * @notice UNIFIED PARSING TOOL
 * @dev This tool is used to parse the user input and determine the type of payment to be created, it aggregates all the parsing utilities into a single tool
 */

export const parsePaymentTool = tool({
    description: `Parse natural language into structured payment parameters. 
  Handles three types of payments:
  1. Single transfer: "Send 0.1 ETH to 0xABC..."
  2. Batch transfer: "Send 0.1 ETH to 0xABC... and 0.2 ETH to 0xDEF..."
  3. Recurring payment: "Send 0.1 ETH every day for a week to 0xABC..."
  
  Use this tool FIRST whenever the user wants to send/transfer crypto.`,

    inputSchema: z.object({
        userInput: z.string().describe('The user\'s natural language description of the payment'),
    }),

    execute: async ({ userInput }) => {
        try {
            // Detect payment type
            const paymentType = detectPaymentType(userInput);

            // Parse common elements
            const addresses = parseAddresses(userInput);
            const amounts = parseAmounts(userInput);

            // Handle amount distribution
            let finalAmounts = [...amounts];
            if (amounts.length === 1 && addresses.length > 1) {
                // Same amount for all recipients
                finalAmounts = Array(addresses.length).fill(amounts[0]);
            }

            // Validate basic params
            validatePaymentParams(addresses, finalAmounts);

            // Build response based on type
            switch (paymentType) {
                case 'single': {
                    if (addresses.length > 1) {
                        throw new Error('Single transfer detected but multiple addresses found. Did you mean batch transfer?');
                    }

                    return {
                        parsed: true,
                        paymentType: 'single',
                        parameters: {
                            to: addresses[0],
                            amount: finalAmounts[0],
                        },
                        needsConfirmation: true,
                    };
                }

                case 'batch': {
                    if (addresses.length !== finalAmounts.length) {
                        throw new Error(`Found ${addresses.length} addresses but ${finalAmounts.length} amounts. Please specify an amount for each recipient.`);
                    }

                    const totalAmount = finalAmounts.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4);

                    return {
                        parsed: true,
                        paymentType: 'batch',
                        parameters: {
                            recipients: addresses,
                            amounts: finalAmounts,
                            totalAmount,
                        },
                        needsConfirmation: true,
                    };
                }

                case 'recurring': {
                    const { duration, interval } = parseTimeExpression(userInput);
                    const transactionStartTime = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour

                    const totalPayments = Math.floor(duration / interval);
                    const totalPerRecipient = finalAmounts.map(amt =>
                        (parseFloat(amt) * totalPayments).toFixed(4)
                    );
                    const grandTotal = totalPerRecipient.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4);

                    return {
                        parsed: true,
                        paymentType: 'recurring',
                        parameters: {
                            name: `Recurring Payment - ${new Date().toLocaleDateString()}`,
                            recipients: addresses,
                            amounts: finalAmounts,
                            duration,
                            interval,
                            transactionStartTime,
                            revertOnFailure: true,
                            // Computed values
                            totalPayments,
                            totalPerRecipient,
                            grandTotal,
                        },
                        needsConfirmation: true,
                    };
                }
            }
        } catch (error) {
            return {
                parsed: false,
                error: error instanceof Error ? error.message : 'Failed to parse input',
                needsClarification: true,
            };
        }
    },
});

/**
 * @notice SINGLE PAYMENT TOOL
 * @dev this tool is used to execute a single ETH transfer to one recipient
 */

export const singleTransferTool = tool({
    description: 'Execute a single ETH transfer to one recipient. Use after user confirms the parsed single transfer details.',

    inputSchema: z.object({
        to: z.string().describe('Recipient Ethereum address'),
        amount: z.string().describe('Amount in ETH (e.g., "0.1")'),
    }),

    execute: async ({ to, amount }) => {
        // Validate one more time
        if (!isAddress(to)) {
            throw new Error(`Invalid recipient address: ${to}`);
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            throw new Error(`Invalid amount: ${amount}`);
        }

        return {
            status: 'ready_to_execute',
            type: 'single',
            details: {
                to,
                amount,
                value: parseEther(amount),
            },
            message: 'Single transfer ready. Waiting for transaction execution...',
        };
    },
});

/**
 * @notice BATCH PAYMENT TOOL
 * @dev this tool is used to execute a batch ETH transfer to multiple recipients
 */

export const batchTransferTool = tool({
    description: 'Execute a batch ETH transfer to multiple recipients in a single transaction. Use after user confirms the parsed batch transfer details.',

    inputSchema: z.object({
        recipients: z.array(z.string()).describe('Array of recipient Ethereum addresses'),
        amounts: z.array(z.string()).describe('Array of amounts in ETH, one for each recipient'),
    }),

    execute: async ({ recipients, amounts }) => {
        // Validate
        validatePaymentParams(recipients, amounts);

        if (recipients.length !== amounts.length) {
            throw new Error('Number of recipients must match number of amounts');
        }

        const totalAmount = amounts.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4);
        const valuesInWei = amounts.map(amt => parseEther(amt));

        return {
            status: 'ready_to_execute',
            type: 'batch',
            details: {
                recipients,
                amounts,
                values: valuesInWei,
                totalAmount,
                transactionCount: recipients.length,
            },
            message: 'Batch transfer ready. Waiting for transaction execution...',
        };
    },
});

/**
 * @notice RECURRING PAYMENT TOOL
 * @dev this tool is used to execute a recurring ETH transfer to multiple recipients
 */

export const recurringPaymentTool = tool({
  description: 'Create a recurring payment schedule. Use after user confirms the parsed recurring payment details.',
  
  inputSchema: z.object({
    name: z.string().describe('Name for this recurring payment'),
    recipients: z.array(z.string()).describe('Array of recipient addresses'),
    amounts: z.array(z.string()).describe('Array of amounts in ETH'),
    duration: z.number().describe('Total duration in seconds'),
    interval: z.number().describe('Interval between payments in seconds'),
    transactionStartTime: z.number().describe('Unix timestamp for first payment'),
    revertOnFailure: z.boolean().optional().default(true),
  }),
  
  execute: async (params) => {
    // Validate
    validatePaymentParams(params.recipients, params.amounts);

    if (params.recipients.length !== params.amounts.length) {
      throw new Error('Number of recipients must match number of amounts');
    }

    const totalPayments = Math.floor(params.duration / params.interval);
    const totalPerRecipient = params.amounts.map(amt => 
      (parseFloat(amt) * totalPayments).toFixed(4)
    );
    const grandTotal = totalPerRecipient.reduce((sum, amt) => sum + parseFloat(amt), 0).toFixed(4);

    return {
      status: 'ready_to_execute',
      type: 'recurring',
      details: {
        ...params,
        totalPayments,
        totalPerRecipient,
        grandTotal,
        startDate: new Date(params.transactionStartTime * 1000).toLocaleString(),
      },
      message: 'Recurring payment schedule ready. Waiting for transaction execution...',
    };
  },
});

/**
 * @notice EXPORT TOOL SET
 */
export const paymentToolSet = {
  parsePayment: parsePaymentTool,
  executeSingleTransfer: singleTransferTool,
  executeBatchTransfer: batchTransferTool,
  executeRecurringPayment: recurringPaymentTool,
};
