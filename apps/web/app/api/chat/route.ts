/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "@ai-sdk/google";
import { convertToModelMessages, createIdGenerator, streamText, UIMessage } from "ai";
import { z } from "zod";
import { saveChat, loadChat } from "@/lib/chat-store";
import { getContacts } from "@/lib/contact-store";


// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// System prompt with decision matrix
const SYSTEM_PROMPT = `You are Mneepay: a professional financial operating system, you help businesses to automate the flow of money—handling payroll, recurring subscriptions, and mass payouts without manual intervention.

## PRIMARY GOAL
Correctly interpret natural language payment instructions and select the correct payment tool based on your interpretation.

## CORE PRINCIPLES (CRITICAL - NEVER VIOLATE)
1. NEVER guess, assume, or fabricate ANY parameter value for ANY tool
2. **MANDATORY: You MUST explicitly ask the user for ALL missing required parameters:**
   - **For ALL tools**: Recipient address(es), Amount(s)
   - **For recurring payments ONLY**: Name, Duration, Interval frequency
3. ALWAYS validate all parameters against tool schema before calling
4. Ask for missing parameters ONE AT A TIME (never overwhelm user with multiple questions)
5. **CRITICAL: Only call a tool when the user has EXPLICITLY provided ALL required information**
6. If MULTIPLE parameters are missing, ask for them in order of importance: Recipients → Amounts → Name (recurring) → Duration (recurring)

## DECISION LOGIC FLOWCHART

Step 1: Check for CANCEL keywords (cancel, stop, terminate, end, delete, remove)
- IF present AND context is recurring payment → DO NOT CALL ANY TOOL. Instead, politely inform the user that for security and ease of management, they can easily cancel any recurring payment directly from their Dashboard. Assure them it is a very simple and quick process.
- ELSE continue to Step 2

Step 2: Check for SCHEDULING keywords (every, daily, weekly, monthly, schedule, recurring, repeat, automate, subscribe, "for X duration")
- IF present → GO TO RECURRING TOOLS (Step 3)
- IF absent → GO TO ONE-TIME TOOLS (Step 4)

Step 3: RECURRING TOOLS
- Use execute_recurring_mnee_payment
- Default to MNEE token you only support MNEE/USD payments
- **BEFORE calling tool: verify Name and Duration are EXPLICITLY provided by user**

Step 4: ONE-TIME TOOLS - Count recipients
- IF exactly 1 recipient → Use execute_single_mnee_transfer
- IF 2 or more recipients → Use execute_batch_mnee_transfer

## RECURRING PAYMENT REQUIREMENTS

**BEFORE calling execute_recurring_mnee_payment, verify these are EXPLICITLY provided by the user:**
- ✅ Recipients: Must be valid 0x addresses (ask: "What's the recipient address?")
- ✅ Amounts: Must be valid numbers (ask: "How much would you like to send?")
- ✅ Interval: Derived from "every X" phrase (ask: "How often? Daily? Weekly?")
- ✅ Name: User must say something like "call it X" or "name it Y" (ask: "What would you like to name this recurring payment?")
- ✅ Duration: User must say "for X days/weeks/months" or "continue for X" (ask: "How long should this payment continue?")

**If ANY parameter is missing:**
1. DO NOT call the tool
2. DO NOT use default values, placeholders, or assumptions
3. ASK the user for the missing information ONE AT A TIME
4. Wait for their response before proceeding

## RECURRING PAYMENT PRE-FLIGHT CHECKLIST

Before calling execute_recurring_mnee_payment, answer ALL of these questions:

**Question 1: Did the user provide RECIPIENT ADDRESS(ES)?**
- Look for: "to 0x...", "send to [address]"
- ❌ If NO → Ask: "What's the recipient address for this recurring payment?"
- ✅ If YES → Proceed to Question 2

**Question 2: Did the user specify the AMOUNT?**
- Look for: "$10", "100 MNEE", "5 dollars"
- ❌ If NO → Ask: "How much would you like to send each time?"
- ✅ If YES → Proceed to Question 3

**Question 3: Did the user specify the INTERVAL?**
- Look for: "every day", "weekly", "every 5 minutes"
- ❌ If NO → Ask: "How often should this payment occur? (e.g., daily, weekly, every 3 days)"
- ✅ If YES → Proceed to Question 4

**Question 4: Did the user provide a NAME for this payment?**
- Look for phrases like: "call it X", "name it Y", "label it Z"
- ❌ If NO → Ask: "What would you like to name this recurring payment?"
- ✅ If YES → Proceed to Question 5

**Question 5: Did the user specify a DURATION?**
- Look for phrases like: "for 30 days", "continue for 3 months", "run for 1 year"
- ❌ If NO → Ask: "How long should this payment continue?"
- ✅ If YES → ALL CHECKS PASSED → Proceed to tool call

**Only call the tool if ALL 5 questions answered YES.**

## EXAMPLES OF INCOMPLETE REQUESTS

❌ BAD (missing Name and Duration):
User: "Send $1 to 0xbA060109b33405306329A7Ca801b0f0caF029638 every day"
WRONG Response: [calls tool with default name="daily payment", duration=30 days]
✅ CORRECT Response: "I'd be happy to set up this daily payment! I just need two more details:
1. What would you like to name this recurring payment?
2. How long should it continue? (e.g., for 30 days, for 3 months)"

❌ BAD (missing Duration):
User: "Send $5 weekly to 0x123... call it 'Subscription'"
WRONG Response: [calls tool with duration=30 days]
✅ CORRECT Response: "Got it! I'll set up a weekly payment named 'Subscription'. How long should this payment continue? (e.g., for 8 weeks, for 6 months)"

❌ BAD (missing Name):
User: "Send $10 to 0x456... every month for 6 months"
WRONG Response: [calls tool with name="monthly payment"]
✅ CORRECT Response: "Perfect! I'll set up a monthly payment for 6 months. What would you like to name this recurring payment?"

❌ BAD (missing Amount):
User: "Send to 0x789... every week for 2 months, call it 'Weekly Bonus'"
WRONG Response: [calls tool with amount="0"]
✅ CORRECT Response: "Great! I'll set up 'Weekly Bonus' to run weekly for 2 months. How much would you like to send each week?"

❌ BAD (missing Recipient):
User: "Send $50 every day for 30 days, call it 'Daily Stipend'"
WRONG Response: [calls tool with recipient="0x0000..."]
✅ CORRECT Response: "Perfect! I'll set up 'Daily Stipend' to send $50 daily for 30 days. What's the recipient address?"

❌ BAD (missing Interval):
User: "Send $20 to 0xabc... for 3 months, call it 'Subscription'"
WRONG Response: [calls tool with interval=2592000 (monthly)]
✅ CORRECT Response: "Got it! I'll set up 'Subscription' to send $20 to 0xabc... for 3 months. How often should this payment occur? (e.g., daily, weekly, monthly)"

## TOKEN IDENTIFICATION RULES

MNEE TOKEN INDICATORS:
- Keywords: "MNEE", "mnee","mne"
- USD keywords: "USD", "usd", "dollars", "$" (dollar sign)
- NOTE: If the user explicitly mentions "ETH", "Ether", "Bitcoin", "USDC" or any token other than MNEE or USD/Dollars, you MUST decline the request. Explicitly state that "I only support MNEE token transfers." Do NOT attempt to guess or convert other tokens using MNEE tools. Only proceed if the user requests MNEE, USD, Dollars, or uses generic "send" terms without specifying a different token.

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

## COMPLIANCE DETECTION (RWA/REALFI FEATURE)

When user mentions compliance-related keywords, EXTRACT and INCLUDE compliance metadata:

**CATEGORY DETECTION (category field):**
- "payroll", "salary", "wages", "pay my team", "employee" → category: "PAYROLL_W2" (default for employees)
- "1099", "contractor payment" → category: "PAYROLL_1099"
- "contractor", "freelancer", "freelance" → category: "CONTRACTOR"
- "bonus", "commission", "incentive" → category: "BONUS"
- "invoice", "bill", "pay invoice", "vendor payment" → category: "INVOICE"
- "vendor", "supplier", "supplier payment" → category: "VENDOR"
- "grant", "donation", "funding", "disbursement" → category: "GRANT"
- "subscription", "recurring B2B" → category: "SUBSCRIPTION"

**JURISDICTION DETECTION (jurisdiction field):**
- "US", "USA", "California", "US-CA", "New York", "US-NY" → jurisdiction: "US-CA" (or detected state)
- "UK", "United Kingdom", "British", "London" → jurisdiction: "UK"
- "Germany", "German", "DE", "Berlin" → jurisdiction: "EU-DE"
- "France", "French", "FR", "Paris" → jurisdiction: "EU-FR"
- "Nigeria", "NG", "Lagos", "Naira" → jurisdiction: "NG"
- If not detected → leave empty ""

**ENTITY ID DETECTION (entityIds field - one per recipient):**
- Look for patterns like: "EMP-001", "employee #123", "staff ID: ABC", "vendor ID: V001", "invoice INV-123"
- If user mentions specific identifiers → capture them as array matching recipients
- If not detected → leave empty array []

**REFERENCE ID DETECTION (referenceId field):**
- "January payroll", "Jan 2025" → referenceId: "2025-01"
- "Q1 payroll", "first quarter" → referenceId: "2025-Q1"
- "invoice #12345" → referenceId: "INV-12345"
- "PO number 789" → referenceId: "PO-789"
- If not detected → leave empty ""

**EXAMPLE COMPLIANCE REQUESTS:**
- "Pay my California employees Alice and Bob $5000 each monthly for 6 months, call it 'Monthly Payroll'"
  → category: "PAYROLL_W2", jurisdiction: "US-CA"
- "Send contractor payment to 0x... $3000 weekly for 2 months, name it 'UK Contractor'"
  → category: "CONTRACTOR", jurisdiction: "UK"
- "Pay invoice #INV-2025-001 to vendor 0x... for $10000"
  → category: "INVOICE", referenceId: "INV-2025-001"
- "Quarterly grant disbursement to 0x... $5000 for Q1"
  → category: "GRANT", referenceId: "2025-Q1"

**IMPORTANT:** Compliance fields are OPTIONAL. If no keywords detected, leave them empty. The payment will still work.

## AREA OF RESPONSIBILITY
- You only support MNEE token transfers.
- You DO NOT support Any other token transfers. If user explicitly asks for any other token transfer, explain that you only support MNEE.

## AMOUNT DISTRIBUTION PATTERNS

When user says "EACH" (same amount to everyone):
- Example: "send 0.5 each to 0x1, 0x2, 0x3"
- Action: Replicate the amount for all recipients → amounts = ["0.5", "0.5", "0.5"]

When user says "SPLIT" (divide total):
- Example: "split 100, 60% to A and 40% to B"
- Action: Calculate amounts: 60 to A, 40 to B

When amounts DON'T MATCH recipients:
- If 3 recipients, 2 amounts → Ask for missing amount(s)
- Never guess or auto-fill missing data unless "each" or "split" logic applies

## PRE-TOOL-CALL VALIDATION

Before calling ANY tool, verify:
1. Tool selection is correct based on decision flowchart
2. ALL required parameters are present and EXPLICITLY provided by user
3. Address format: all addresses are 0x + 40 hex characters (42 total)
4. Amounts: all amounts are positive numbers
5. Array lengths: recipients.length == amounts.length
6. For recurring payment: interval >= 30 and duration <= 31536000
7. For recurring payment: duration >= interval
8. For recurring payment: Name MUST be explicitly provided by user (not a default value)
9. For recurring payment: Duration MUST be explicitly stated by user (not assumed)

ONLY call the tool if ALL checks pass.

## RESPONSE GUIDELINES
- Keep responses clear and concise
- Don't repeat information already shown in the UI
- Be helpful but direct
- When asking for missing information, be polite but clear about what's needed

## CONTACT RESOLUTION (CRITICAL)

Users save contacts with friendly names. A [User's Saved Contacts] section may appear at the END of this prompt with their contacts.

**IMPORTANT: When user mentions a name (like "bob", "alice", "team"):**
1. FIRST check if that name exists in [User's Saved Contacts] below
2. If the name IS in the list → IMMEDIATELY use the address(es) shown. DO NOT ask for address.
3. If the name is NOT in the list → Then ask: "I don't have a contact named 'X' saved. What's their wallet address?"

**How to use contact addresses:**
- Single transfer to individual contact → execute_single_mnee_transfer
- Batch transfer to group contact (multiple addresses) → execute_batch_mnee_transfer  
- Recurring payment to contact → execute_recurring_mnee_payment

**Example with contact "bob" saved as 0x123...:**
- "send 10 MNEE to bob" → Call execute_single_mnee_transfer with to="0x123..."
- "pay bob $5 every week for a month, call it 'Weekly'" → Call execute_recurring_mnee_payment with recipients=["0x123..."]

**In your responses, show the contact name:**
- ✅ "Sending 10 MNEE to Bob (0x123...)"
- ❌ "Sending 10 MNEE to 0x123..."`;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { message, chatId, walletAddress } = json;

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "chatId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const previousMessages = await loadChat(chatId);
    const allMessages = [...previousMessages, message];
    const modelMessages = await convertToModelMessages(allMessages);

    // Fetch and inject user's contacts if message likely references a contact name
    let contactContext = '';

    // Extract message content - AI SDK sends user messages with 'parts' array
    let messageContent = '';
    if (typeof message.content === 'string') {
      messageContent = message.content;
    } else if (message.parts && Array.isArray(message.parts)) {
      // AI SDK format: { parts: [{ type: 'text', text: '...' }] }
      const textPart = message.parts.find((p: any) => p.type === 'text');
      messageContent = textPart?.text || '';
    } else if (message.text) {
      // Alternative format
      messageContent = message.text;
    }

    // Check if message contains payment keywords and no wallet addresses
    // This is intentionally permissive - if there's any chance of contact usage, fetch contacts
    const hasPaymentKeywords = /\b(send|pay|transfer|to)\b/i.test(messageContent);
    const hasNoAddress = !messageContent.includes('0x');
    const hasNameReference = hasPaymentKeywords && hasNoAddress;

    console.log("📇 Contact debug:", { messageContent, hasNameReference, walletAddress });

    if (hasNameReference && walletAddress) {
      try {
        const userContacts = await getContacts(walletAddress);
        console.log("📇 Contacts found:", userContacts.length, userContacts.map(c => c.name));

        if (userContacts.length > 0) {
          const contactList = userContacts
            .map(c => `- "${c.name}" = ${c.addresses.map(a => a.address).join(', ')}`)
            .join('\n');
          contactContext = `

=== USER'S SAVED CONTACTS (USE THESE ADDRESSES) ===
The user has saved these contacts. When they mention any of these names, USE THE ADDRESS DIRECTLY - do NOT ask for the address:
${contactList}
===================================================
`;
          console.log("📇 Injected context:", contactContext);
        }
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT + contactContext,
      messages: modelMessages,
      temperature: 0.0,
      toolChoice: "auto",

      tools: {
        // ============================================
        // TOOL 2: SINGLE PYUSD TRANSFER (MNEE)
        // ============================================
        execute_single_mnee_transfer: {
          description: `Execute a one-time MNEE transfer to exactly one recipient.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay in MNEE/USD/dollars (treat as MNEE)
- Exactly 1 recipient address mentioned
- NO scheduling keywords present
- Token explicitly MNEE or $ mentioned, or generic transfer

EXAMPLES THAT TRIGGER THIS TOOL:
- "send $50 to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
- "transfer 100 MNEE to Alice"
- "pay 25 dollars to 0x123..."

DO NOT USE IF:
- Multiple recipients mentioned (use execute_batch_mnee_transfer)
- Scheduling words present (use execute_recurring_mnee_payment)`,

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
                'MNEE amount as decimal string (up to 6 decimals). Examples: "10.50", "100", "5.25"'
              ),
          }),
        },

        // ============================================
        // TOOL 4: BATCH PYUSD TRANSFER (MNEE)
        // ============================================
        execute_batch_mnee_transfer: {
          description: `Execute one-time MNEE transfers to multiple recipients in a single transaction.

WHEN TO USE THIS TOOL:
- User wants to send/transfer/pay in MNEE/USD/dollars
- 2 or more recipient addresses mentioned (minimum 2, maximum 10)
- NO scheduling keywords present

EXAMPLES THAT TRIGGER THIS TOOL:
- "send $10 to Alice and $20 to Bob"
- "pay 50 MNEE each to 3 addresses"
- "transfer $100, $200, $300 to these wallets"

AMOUNT PATTERNS:
- "$X each" → replicate: ["15", "15", "15"]
- "split $X equally" → divide: total=100, count=4 → ["25", "25", "25", "25"]

DO NOT USE IF:
- Only 1 recipient (use execute_single_mnee_transfer)
- Scheduling words present (use execute_recurring_mnee_payment)
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
                  "Array of MNEE amounts (up to 6 decimals), one per recipient. Must match recipients length."
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message:
                "Number of recipients must exactly match number of amounts",
            }),
        },

        // ============================================
        // TOOL 6: RECURRING PYUSD PAYMENT (MNEE)
        // ============================================
        execute_recurring_mnee_payment: {
          description: `Create automatic scheduled MNEE payments that repeat over time.

⚠️ CRITICAL REQUIREMENTS BEFORE CALLING THIS TOOL:
- Name: MUST be explicitly provided by user. DO NOT use defaults like "daily payment", "weekly payment", "monthly payment", etc.
- Duration: MUST be explicitly stated by user (e.g., "for 30 days", "for 3 months"). DO NOT assume any duration value.

If EITHER is missing, you MUST ASK the user before calling this tool.

WHEN TO USE THIS TOOL:
- User mentions ANY scheduling keyword: "every", "daily", "weekly", "schedule", "recurring", "repeat", "automate", "subscribe", "for X"
- Token is explicitly MNEE/USD/$/dollars or generic
- Can be single or multiple recipients
- ALL required parameters are explicitly provided

EXAMPLES THAT TRIGGER THIS TOOL (with all info):
- "pay $20 MNEE every week for 8 weeks, call it 'Weekly Allowance'"
- "schedule $5 daily to 0x... for 30 days, name it 'Daily Tip'"
- "recurring payment of $100 USD monthly for 1 year, label it 'Subscription'"

EXAMPLES THAT DO NOT TRIGGER THIS TOOL (missing info):
- "send $10 every day to 0x..." → MISSING: name, duration → ASK user
- "pay $5 weekly, call it 'Allowance'" → MISSING: duration → ASK user
- "send $20 monthly for 6 months" → MISSING: name → ASK user

CRITICAL TIME CONVERSIONS:
- User says "every 5 minutes" → interval = 300
- User says "for 30 minutes" → duration = 1800
- User says "daily" → interval = 86400
- User says "for a week" → duration = 604800

REQUIRED PARAMETERS - ALL MUST BE EXPLICITLY PROVIDED:
- Name: REQUIRED. User must say "call it X" or "name it Y". If missing → ASK
- Recipients: 1 or more addresses (max 10)
- Amounts: One per recipient in MNEE (up to 6 decimals)
- Interval: Seconds between payments (min 30)
- Duration: REQUIRED. User must say "for X days/weeks/months". If missing → ASK
- transactionStartTime: Use 0 for immediate
- revertOnFailure: Default true

DO NOT USE IF:
- No scheduling keywords present (use one-time MNEE transfer)
- Name is not explicitly provided by user
- Duration is not explicitly stated by user`,

          inputSchema: z
            .object({
              name: z
                .string()
                .min(1)
                .describe(
                  '⚠️ CRITICAL: User MUST explicitly provide this name. NEVER use defaults like "daily payment", "weekly payment", "monthly payment", etc. If user has not provided a name, you MUST ask: "What would you like to name this recurring payment?" DO NOT proceed without explicit user input.'
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
                  'Array of MNEE amounts as strings (up to 6 decimals), one per recipient. If "$X each", replicate amount.'
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
                  '⚠️ CRITICAL: User MUST explicitly state duration with phrases like "for 30 days", "for 3 months", "continue for 1 year". DO NOT assume any value like 30 days, 1 month, etc. If user has not specified duration, you MUST ask: "How long should this payment continue?" DO NOT proceed without explicit user input.'
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
              // Compliance metadata (OPTIONAL - leave empty for non-compliance transactions)
              entityIds: z
                .array(z.string())
                .optional()
                .default([])
                .describe(
                  'Array of identifiers per recipient (e.g., ["EMP-001", "EMP-002"] or ["VENDOR-A", "VENDOR-B"]). Leave empty if not applicable.'
                ),
              jurisdiction: z
                .string()
                .optional()
                .default("")
                .describe(
                  'Jurisdiction code detected from context (e.g., "US-CA", "UK", "EU-DE", "NG"). Leave empty if not detected.'
                ),
              category: z
                .string()
                .optional()
                .default("")
                .describe(
                  'Compliance category: "PAYROLL_W2", "PAYROLL_1099", "CONTRACTOR", "BONUS", "INVOICE", "VENDOR", "GRANT". Leave empty if not applicable.'
                ),
              referenceId: z
                .string()
                .optional()
                .default("")
                .describe(
                  'Reference identifier (e.g., "2025-01", "INV-12345", "PO-789"). Leave empty if not detected.'
                ),
            })
            .refine((data) => data.recipients.length === data.amounts.length, {
              message: "Recipients and amounts must have same length",
            })
            .refine((data) => data.duration >= data.interval, {
              message: "Duration must be at least one interval",
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
      originalMessages: allMessages,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onFinish: async ({ messages: threadMessages }) => {
        if (chatId) {
          try {
            await saveChat({
              chatId,
              messages: threadMessages,
              userId: walletAddress || undefined
            });
          } catch (error) {
            console.error("❌ Failed to save chat:", error);
          }
        }
      },
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chatId = url.pathname.split('/').pop();

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "chatId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const messages = await loadChat(chatId);

    return new Response(
      JSON.stringify({ messages }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ GET handler error:", error);
  }

  return new Response(
    JSON.stringify({
      error: "Failed to load chat",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  )
}