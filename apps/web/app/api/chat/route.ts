/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// System prompt with decision matrix
const SYSTEM_PROMPT = `You are Aidra: an ERC-4337 interactive smart wallet agent and execution layer for on-chain payments.

## PRIMARY GOAL
Correctly interpret natural language payment instructions and select the correct payment tool based on your interpretation.

## CORE PRINCIPLES (CRITICAL - NEVER VIOLATE)
1. NEVER guess, assume, or fabricate any parameter value
2. ALWAYS ask for missing required parameters before tool call
3. ALWAYS validate all parameters against tool schema before calling
4. Ask ONE clarifying question at a time (never overwhelm user)
5. Only call tool when ALL required parameters are validated and present

## DECISION LOGIC FLOWCHART

Step 1: Check for CANCEL keywords (cancel, stop, terminate, end, delete, remove)
- IF present AND context is recurring payment → Use cancelRecurringPayment tool
- ELSE continue to Step 2

Step 2: Check for SCHEDULING keywords (every, daily, weekly, monthly, schedule, recurring, repeat, automate, subscribe, "for X duration")
- IF present → GO TO RECURRING TOOLS (Step 3)
- IF absent → GO TO ONE-TIME TOOLS (Step 4)

Step 3: RECURRING TOOLS - Check token type
- IF token is PYUSD/USD/$/dollars → Use executeRecurringPyusdPayment
- IF token is ETH/eth/ether OR no token specified → Use executeRecurringEthPayment

Step 4: ONE-TIME TOOLS - Count recipients
- IF exactly 1 recipient → GO TO SINGLE TRANSFER (Step 5)
- IF 2 or more recipients → GO TO BATCH TRANSFER (Step 6)

Step 5: SINGLE TRANSFER - Check token type
- IF token is PYUSD/USD/$/dollars → Use executeSinglePyusdTransfer
- IF token is ETH/eth/ether OR no token specified → Use executeSingleEthTransfer

Step 6: BATCH TRANSFER - Check token type
- IF token is PYUSD/USD/$/dollars → Use executeBatchPyusdTransfer
- IF token is ETH/eth/ether OR no token specified → Use executeBatchEthTransfer

## TOKEN IDENTIFICATION RULES

ETH TOKEN INDICATORS:
- Keywords: "ETH", "eth", "ether", "ethereum", "Ξ"
- DEFAULT: If no token is mentioned, assume ETH

PYUSD TOKEN INDICATORS:
- Keywords: "PYUSD", "pyusd", "PayPal USD"
- USD keywords: "USD", "usd", "dollars", "$" (dollar sign)

## TIME CONVERSION REFERENCE (for recurring payments)

Convert natural language to seconds:
- 30 seconds = 30
- 1 minute = 60
- 5 minutes = 300
- 10 minutes = 600
- 30 minutes = 1800
- 1 hour = 3600
- 1 day = 86400
- 1 week = 604800
- 1 month = 2592000 (assume 30 days)
- 1 year = 31536000 (assume 365 days)

CONSTRAINTS:
- MINIMUM interval: 30 seconds
- MAXIMUM duration: 31536000 seconds (1 year)
- Duration must be >= interval

## AMOUNT DISTRIBUTION PATTERNS

When user says "EACH" (same amount to everyone):
- Example: "send 0.5 ETH each to 0x1, 0x2, 0x3"
- Action: Replicate the amount for all recipients → amounts = ["0.5", "0.5", "0.5"]

When user says "SPLIT EQUALLY" (divide total):
- Example: "split 1 ETH equally to 0x1, 0x2, 0x3, 0x4"
- Action: Divide total by number of recipients → 1 / 4 = 0.25 each

When amounts DON'T MATCH recipients:
- If 3 recipients, 2 amounts → Ask for missing amount(s)
- Never guess or auto-fill missing data

## PRE-TOOL-CALL VALIDATION

Before calling ANY tool, verify:
1. Tool selection is correct based on decision flowchart
2. ALL required parameters are present
3. Address format: all addresses are 0x + 40 hex characters (42 total)
4. Amounts: all amounts are positive numbers
5. Array lengths: recipients.length == amounts.length
6. For recurring: interval >= 30 and duration <= 31536000
7. For recurring: duration >= interval

ONLY call the tool if ALL checks pass.

## RESPONSE GUIDELINES
- Keep responses clear and concise
- Don't repeat information already shown in the UI
- Be helpful but direct`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      temperature: 0.1,
      toolChoice: "auto",

      tools: {
        // ============================================
        // TOOL 1: SINGLE ETH TRANSFER
        // ============================================
        executeSingleEthTransfer: {
          description: `Execute a one-time ETH transfer to exactly one recipient.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay ETH
- Exactly 1 recipient address mentioned
- NO scheduling keywords present (no "every", "recurring", "daily", etc.)
- Token is ETH or not specified

EXAMPLES THAT TRIGGER THIS TOOL:
- "send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
- "transfer 1.5 eth to Alice"
- "pay 0.5 to 0x123..."

DO NOT USE IF:
- Multiple recipients mentioned (use executeBatchEthTransfer)
- Scheduling words present (use executeRecurringEthPayment)
- Token is PYUSD/USD/$ (use executeSinglePyusdTransfer)`,

          inputSchema: z.object({
            to: z
              .string()
              .min(42)
              .max(42)
              .regex(/^0x[a-fA-F0-9]{40}$/)
              .describe(
                "Ethereum address starting with 0x, exactly 42 characters. Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
              ),
            amount: z
              .string()
              .regex(/^\d+(\.\d+)?$/)
              .describe(
                'ETH amount as decimal string. Examples: "0.1", "1.5", "0.001". No "ETH" suffix.'
              ),
          }),
        },

        // ============================================
        // TOOL 2: SINGLE PYUSD TRANSFER
        // ============================================
        executeSinglePyusdTransfer: {
          description: `Execute a one-time PYUSD transfer to exactly one recipient.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay in PYUSD/USD/dollars
- Exactly 1 recipient address mentioned
- NO scheduling keywords present
- Token explicitly PYUSD or $ mentioned

EXAMPLES THAT TRIGGER THIS TOOL:
- "send $50 to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
- "transfer 100 PYUSD to Alice"
- "pay 25 dollars to 0x123..."

DO NOT USE IF:
- Multiple recipients mentioned (use executeBatchPyusdTransfer)
- Scheduling words present (use executeRecurringPyusdPayment)
- Token is ETH (use executeSingleEthTransfer)`,

          inputSchema: z.object({
            to: z
              .string()
              .min(42)
              .max(42)
              .regex(/^0x[a-fA-F0-9]{40}$/)
              .describe(
                "Ethereum address starting with 0x, exactly 42 characters"
              ),
            amount: z
              .string()
              .regex(/^\d+(\.\d{1,6})?$/)
              .describe(
                'PYUSD amount as decimal string (up to 6 decimals). Examples: "10.50", "100", "5.25"'
              ),
          }),
        },

        // ============================================
        // TOOL 3: BATCH ETH TRANSFER
        // ============================================
        executeBatchEthTransfer: {
          description: `Execute one-time ETH transfers to multiple recipients in a single transaction.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay ETH
- 2 or more recipient addresses mentioned (minimum 2, maximum 10)
- NO scheduling keywords present
- Token is ETH or not specified

EXAMPLES THAT TRIGGER THIS TOOL:
- "send 0.1 ETH to Alice and 0.2 to Bob"
- "transfer to 0x123 and 0x456"
- "pay 0.5 each to these 3 wallets"
- "send 0.1, 0.2, 0.3 to three addresses"

AMOUNT PATTERNS:
- "X each" → use same amount for all: ["0.5", "0.5", "0.5"]
- "split X equally" → divide total by count: total=1, count=4 → ["0.25", "0.25", "0.25", "0.25"]
- Different amounts → match in order given

DO NOT USE IF:
- Only 1 recipient (use executeSingleEthTransfer)
- Scheduling words present (use executeRecurringEthPayment)
- Token is PYUSD/USD/$ (use executeBatchPyusdTransfer)
- More than 10 recipients (reject with error message)`,

          inputSchema: z
            .object({
              recipients: z
                .array(
                  z
                    .string()
                    .min(42)
                    .max(42)
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                )
                .min(2)
                .max(10)
                .describe(
                  'Array of 2-10 Ethereum addresses. Example: ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5", "0xAbc..."]'
                ),
              amounts: z
                .array(z.string().regex(/^\d+(\.\d+)?$/))
                .min(2)
                .max(10)
                .describe(
                  'Array of ETH amounts as strings, one per recipient. Must match recipients length. Example: ["0.1", "0.2"]'
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message:
                "Number of recipients must exactly match number of amounts",
            }),
        },

        // ============================================
        // TOOL 4: BATCH PYUSD TRANSFER
        // ============================================
        executeBatchPyusdTransfer: {
          description: `Execute one-time PYUSD transfers to multiple recipients in a single transaction.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay in PYUSD/USD/dollars
- 2 or more recipient addresses mentioned (minimum 2, maximum 10)
- NO scheduling keywords present
- Token explicitly PYUSD or $ mentioned

EXAMPLES THAT TRIGGER THIS TOOL:
- "send $10 to Alice and $20 to Bob"
- "pay 50 PYUSD each to 3 addresses"
- "transfer $100, $200, $300 to these wallets"

AMOUNT PATTERNS:
- "$X each" → replicate: ["15", "15", "15"]
- "split $X equally" → divide: total=100, count=4 → ["25", "25", "25", "25"]

DO NOT USE IF:
- Only 1 recipient (use executeSinglePyusdTransfer)
- Scheduling words present (use executeRecurringPyusdPayment)
- Token is ETH (use executeBatchEthTransfer)
- More than 10 recipients (reject)`,

          inputSchema: z
            .object({
              recipients: z
                .array(
                  z
                    .string()
                    .min(42)
                    .max(42)
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                )
                .min(2)
                .max(10)
                .describe("Array of 2-10 Ethereum addresses"),
              amounts: z
                .array(z.string().regex(/^\d+(\.\d{1,6})?$/))
                .min(2)
                .max(10)
                .describe(
                  "Array of PYUSD amounts (up to 6 decimals), one per recipient. Must match recipients length."
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message:
                "Number of recipients must exactly match number of amounts",
            }),
        },

        // ============================================
        // TOOL 5: RECURRING ETH PAYMENT
        // ============================================
        executeRecurringEthPayment: {
          description: `Create automatic scheduled ETH payments that repeat over time.

WHEN TO USE THIS TOOL:
- User mentions ANY scheduling keyword: "every", "daily", "weekly", "monthly", "schedule", "recurring", "repeat", "automate", "subscribe", "for X duration"
- Token is ETH or not specified
- Can be single or multiple recipients

EXAMPLES THAT TRIGGER THIS TOOL:
- "send 0.1 ETH every day for 30 days"
- "pay 0.0001 each to these addresses every 5 minutes for 30 minutes"
- "recurring payment of 1 ETH daily"
- "schedule 0.5 ETH weekly to 0x..."

CRITICAL TIME CONVERSIONS:
- User says "every 5 minutes" → interval = 300
- User says "for 30 minutes" → duration = 1800
- User says "daily" → interval = 86400
- User says "for a week" → duration = 604800

REQUIRED PARAMETERS TO EXTRACT:
- Name: If not provided, generate from pattern like "ETH payment every [interval]"
- Recipients: 1 or more addresses (max 10)
- Amounts: One per recipient. If "X each", replicate amount
- Interval: Time between payments in seconds (min 30)
- Duration: Total schedule length in seconds (max 31536000)
- transactionStartTime: Use 0 for immediate start
- revertOnFailure: Default to true (recommended)

DO NOT USE IF:
- No scheduling keywords present (use one-time transfer tools)
- Token is PYUSD/USD/$ (use executeRecurringPyusdPayment)`,

          inputSchema: z
            .object({
              name: z
                .string()
                .min(1)
                .default("Recurring ETH Payment")
                .describe(
                  'User-friendly name for this schedule. Examples: "Daily team payment", "Weekly allowance"'
                ),
              recipients: z
                .array(
                  z
                    .string()
                    .min(42)
                    .max(42)
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                )
                .min(1)
                .max(10)
                .describe("Array of 1-10 Ethereum addresses"),
              amounts: z
                .array(z.string().regex(/^\d+(\.\d+)?$/))
                .min(1)
                .max(10)
                .describe(
                  'Array of ETH amounts as strings, one per recipient. If user says "X each", use same amount for all.'
                ),
              interval: z
                .number()
                .int()
                .min(30)
                .describe(
                  "Seconds between each payment. MUST BE >= 30. Use time conversion reference."
                ),
              duration: z
                .number()
                .int()
                .positive()
                .max(31536000)
                .describe(
                  "Total schedule duration in seconds. MUST BE >= interval and <= 31536000 (1 year)."
                ),
              transactionStartTime: z
                .number()
                .int()
                .nonnegative()
                .default(0)
                .describe(
                  "Unix timestamp in seconds. Use 0 for immediate start. For future start, convert date to Unix timestamp."
                ),
              revertOnFailure: z
                .boolean()
                .default(true)
                .optional()
                .describe(
                  "If true, stop all future payments on any failure. If false, skip failed payments and continue. Default true."
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message: "Recipients and amounts arrays must have same length",
            })
            .refine((data) => data.duration >= data.interval, {
              message: "Duration must be at least one interval period",
            }),
        },

        // ============================================
        // TOOL 6: RECURRING PYUSD PAYMENT
        // ============================================
        executeRecurringPyusdPayment: {
          description: `Create automatic scheduled PYUSD payments that repeat over time.

WHEN TO USE THIS TOOL:
- User mentions ANY scheduling keyword: "every", "daily", "weekly", "schedule", "recurring", "repeat", "automate", "subscribe", "for X"
- Token is explicitly PYUSD/USD/$/dollars
- Can be single or multiple recipients

EXAMPLES THAT TRIGGER THIS TOOL:
- "pay $20 PYUSD every week for 8 weeks"
- "schedule $5 daily to 0x..."
- "recurring payment of $100 USD monthly"
- "send $10 each to these addresses every day for 30 days"

CRITICAL TIME CONVERSIONS:
Same as ETH recurring tool

REQUIRED PARAMETERS TO EXTRACT:
- Name: If not provided, generate like "PYUSD payment every [interval]"
- Recipients: 1 or more addresses (max 10)
- Amounts: One per recipient in PYUSD (up to 6 decimals)
- Interval: Seconds between payments (min 30)
- Duration: Total duration in seconds (max 31536000)
- transactionStartTime: Use 0 for immediate
- revertOnFailure: Default true

DO NOT USE IF:
- No scheduling keywords present (use one-time PYUSD transfer)
- Token is ETH (use executeRecurringEthPayment)`,

          inputSchema: z
            .object({
              name: z
                .string()
                .min(1)
                .default("Recurring PYUSD Payment")
                .describe(
                  'User-friendly name for this PYUSD schedule. Example: "Monthly subscription", "Weekly allowance"'
                ),
              recipients: z
                .array(
                  z
                    .string()
                    .min(42)
                    .max(42)
                    .regex(/^0x[a-fA-F0-9]{40}$/)
                )
                .min(1)
                .max(10)
                .describe("Array of 1-10 Ethereum addresses"),
              amounts: z
                .array(z.string().regex(/^\d+(\.\d{1,6})?$/))
                .min(1)
                .max(10)
                .describe(
                  'Array of PYUSD amounts as strings (up to 6 decimals), one per recipient. If "$X each", replicate amount.'
                ),
              interval: z
                .number()
                .int()
                .min(30)
                .describe("Seconds between payments. MUST BE >= 30."),
              duration: z
                .number()
                .int()
                .positive()
                .max(31536000)
                .describe(
                  "Total duration in seconds. MUST BE >= interval and <= 31536000."
                ),
              transactionStartTime: z
                .number()
                .int()
                .nonnegative()
                .default(0)
                .describe(
                  "Unix timestamp in seconds. Use 0 for immediate start."
                ),
              revertOnFailure: z
                .boolean()
                .default(true)
                .optional()
                .describe(
                  "Stop all on failure (true) or skip and continue (false). Default true."
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message: "Recipients and amounts must have same length",
            })
            .refine((data) => data.duration >= data.interval, {
              message: "Duration must be at least one interval",
            }),
        },

        // ============================================
        // TOOL 7: CANCEL RECURRING PAYMENT
        // ============================================
        cancelRecurringPayment: {
          description: `Cancel an existing active recurring payment intent.

WHEN TO USE THIS TOOL:
- User says: "cancel", "stop", "terminate", "end", "delete", "remove"
- Context clearly indicates they want to stop a recurring payment
- NOT for one-time payments (those execute immediately and can't be cancelled)

EXAMPLES THAT TRIGGER THIS TOOL:
- "cancel my recurring payment"
- "stop the weekly payment to Alice"
- "terminate intent 0x123..."
- "end all my recurring payments"

REQUIRED PARAMETER:
- intentId: A bytes32 hex string starting with 0x, 66 characters total (0x + 64 hex chars)

IF USER DOESN'T PROVIDE intentId:
- Ask: "Which recurring payment would you like to cancel? Please provide the intent ID (0x...), or I can list all your active recurring payments."
- If they say "all", warn them and confirm before proceeding

DO NOT USE IF:
- User wants to cancel a one-time payment (explain it executes immediately)
- User wants to modify (suggest cancel + create new)`,

          inputSchema: z.object({
            intentId: z
              .string()
              .length(66)
              .regex(/^0x[a-fA-F0-9]{64}$/)
              .describe(
                "Intent ID as bytes32 hex string, must be exactly 66 characters starting with 0x. Example: 0x1234567890abcdef..."
              ),
          }),
        },
      },

      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        console.log("🔍 Step finished:", {
          text: text?.substring(0, 100),
          toolCallsCount: toolCalls.length,
          toolResultsCount: toolResults.length,
          finishReason,
          toolNames: toolCalls.map((tc) => tc.toolName),
        });
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error("❌ Stream error:", error);

        if (error?.constructor?.name === "NoSuchToolError") {
          console.error("NoSuchToolError: Model tried to call unknown tool");
          return "The AI tried to call an unknown tool. Please try rephrasing your request.";
        }

        if (error?.constructor?.name === "InvalidToolInputError") {
          console.error(
            "InvalidToolInputError: Model provided invalid tool inputs"
          );
          return "The AI provided invalid parameters. Please try rephrasing your request.";
        }

        if (error instanceof Error) {
          if (
            error.message.includes("API key") ||
            error.message.includes("401")
          ) {
            return "Authentication error. Please check API configuration.";
          }
          if (
            error.message.includes("rate limit") ||
            error.message.includes("429")
          ) {
            return "Too many requests. Please wait a moment.";
          }
          if (
            error.message.includes("timeout") ||
            error.message.includes("ETIMEDOUT")
          ) {
            return "Request timed out. Please try again.";
          }
          if (error.message.includes("model")) {
            return "Model error. The AI service is temporarily unavailable.";
          }

          return `Error: ${error.message}`;
        }

        return "An unexpected error occurred. Please try again.";
      },
    });
  } catch (error) {
    console.error("❌ POST handler error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: "ok",
      service: "Aidra Payment Assistant API",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
