/* eslint-disable @typescript-eslint/no-explicit-any */
import { google } from "@ai-sdk/google";
import { convertToModelMessages, createIdGenerator, streamText } from "ai";
import { z } from "zod";
import { saveChat, loadChat } from "@/lib/chat-store";
import { getContacts } from "@/lib/contact-store";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// System prompt with dual-mode logic: Template v.s. Natural Language
const SYSTEM_PROMPT = `You are MantlePay: a compliance-aware financial operating system. You execute payment instructions.

## CORE LOGIC: DUAL MODE PROCESSING
You must determine if the user is using a **TEMPLATE TRIGGER** or **NATURAL LANGUAGE**.

### MODE 1: TEMPLATE TRIGGER (Highest Priority)
If the user message starts with "TEMPLATE_TRIGGER |", use STRICT parsing mode.
Input format: \`TEMPLATE_TRIGGER | TYPE: [type] | NAME: [name] | ...\`

**Parsing Rules for Templates:**
1. **TRUST THE DATA**: Do not question valid parameters provided in the template key-values.
2. **IGNORE NATURAL LANGUAGE NUANCES**: The template is the source of truth.
3. **MAPPING**:
   - \`TYPE: RECURRING\` -> \`execute_recurring_mp_token_payment\`
   - \`TYPE: BATCH_RECURRING\` -> \`execute_recurring_mp_token_payment\`
   - \`TYPE: SINGLE\` -> \`execute_single_mp_token_transfer\`
   - \`TYPE: BATCH\` -> \`execute_batch_mp_token_transfer\`
4. **COMPLIANCE JSON**: 
        - If \`COMPLIANCE: { ... }\` is present, you **MUST** parse it.
        - Map \`entityIds\`, \`jurisdictions\`, \`categories\` arrays directly to the tool.
        - Map \`referenceId\` key from the JSON to the tool's \`referenceId\` argument.
5. **START_TIME**: If \`START: [timestamp]\` is present, use it for \`transactionStartTime\`.

### MODE 2: NATURAL LANGUAGE (Fallback)
If valid template syntax is NOT found, use the standard verification logic.

**CORE PRINCIPLES (Natural Language):**
1. **NEVER guess** parameters.
2. **MANDATORY**: You MUST explicitly ask for ALL missing required parameters (Recipients, Amount, Name, Duration, Interval).
3. **CONTACTS**: Check the [User's Saved Contacts] list below. If a name matches, use it. If not, ASK.

## DECISION LOGIC (Natural Language)
1. Check for CANCEL keywords (cancel, stop) -> Do not call tool.
2. Check for SCHEDULING keywords (every, recurring) -> RECURRING TOOL
   - **REQUIRED**: Name (user must provide), Duration ("for X time"), Interval ("every X").
3. Check for MULTIPLE RECIPIENTS -> BATCH TOOL
4. Single recipient -> SINGLE TOOL

## RECURRING PAYMENT RULES
- **Name**: MUST be explicitly provided by user.
- **Duration**: MUST be explicitly provided (e.g., "for 1 year").
- **Interval**: Derived from "every day/week/month".

## TOKEN SUPPORT
- **ONLY**: MNT, USD, Dollars, $ -> Treated as MNT.
- **REJECT**: ETH, BTC, USDC, etc.

## COMPLIANCE DETECTION (Natural Language & Template)
- **Category**: payroll, bonus, invoice, grant, etc.
- **Jurisdiction**: US-CA, UK, NG, etc.
- **Entity ID**: EMP-001, INV-123.
- **Reference ID**: Any invoice or PO number context.
- If these are present in the template's \`COMPLIANCE\` block or detected in text, pass them to the tool.

## CONTACT RESOLUTION
[User's Saved Contacts] are appended below.
- If user says "Alice" and Alice is in the list -> Use her address.
- If "Alice" has saved compliance data (entityId, jurisdiction) -> **AUTO-FILL** those fields in the tool.
`;

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
    let messageContent = '';

    if (typeof message.content === 'string') {
      messageContent = message.content;
    } else if (message.parts && Array.isArray(message.parts)) {
      const textPart = message.parts.find((p: any) => p.type === 'text');
      messageContent = textPart?.text || '';
    } else if (message.text) {
      messageContent = message.text;
    }

    // Check for contact usage triggers
    const hasPaymentKeywords = /\b(send|pay|transfer|to)\b/i.test(messageContent) || messageContent.includes("TEMPLATE_TRIGGER");
    const hasNameReference = hasPaymentKeywords; // Relaxed check for template mode

    if (hasNameReference && walletAddress) {
      try {
        const userContacts = await getContacts(walletAddress);
        if (userContacts.length > 0) {
          const contactList = userContacts
            .map(c => {
              const addrDetails = c.addresses.map(a => {
                let addrLine = a.address;
                const complianceParts: string[] = [];
                if (a.entityId) complianceParts.push(`entityId="${a.entityId}"`);
                if (a.jurisdiction) complianceParts.push(`jurisdiction="${a.jurisdiction}"`);
                if (a.category) complianceParts.push(`category="${a.category}"`);
                if (complianceParts.length > 0) {
                  addrLine += ` (${complianceParts.join(', ')})`;
                }
                return addrLine;
              }).join(', ');
              return `- "${c.name}" = ${addrDetails}`;
            })
            .join('\n');
          contactContext = `
\n=== USER'S SAVED CONTACTS ===
Use these addresses and compliance data when names match:
${contactList}
=============================\n`;
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
        execute_single_mp_token_transfer: {
          description: `Execute a one-time MNT transfer to exactly one recipient.`,
          inputSchema: z.object({
            to: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
            amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
            // Compliance optional
            entityIds: z.array(z.string()).optional().default([]),
            jurisdictions: z.array(z.string()).optional().default([]),
            categories: z.array(z.string()).optional().default([]),
            referenceId: z.string().optional().default(""),
          }),
        },
        execute_batch_mp_token_transfer: {
          description: `Execute one-time MNT transfers to multiple recipients.`,
          inputSchema: z.object({
            recipients: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(2).max(10),
            amounts: z.array(z.string().regex(/^\d+(\.\d{1,6})?$/)).min(2).max(10),
            // Compliance optional
            entityIds: z.array(z.string()).optional().default([]),
            jurisdictions: z.array(z.string()).optional().default([]),
            categories: z.array(z.string()).optional().default([]),
            referenceId: z.string().optional().default(""),
          }),
        },
        execute_recurring_mp_token_payment: {
          description: `Create scheduled MNT payments (subscriptions/payroll).`,
          inputSchema: z.object({
            name: z.string().min(1).describe("Required name of payment"),
            recipients: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1).max(10),
            amounts: z.array(z.string().regex(/^\d+(\.\d{1,6})?$/)).min(1),
            interval: z.number().int().min(30).describe("Seconds between payments"),
            duration: z.number().int().positive().max(315360000).describe("Total duration in seconds"), // Increased max duration
            transactionStartTime: z.number().int().nonnegative().default(0).describe("Unix timestamp for start time. 0 = now"),
            revertOnFailure: z.boolean().default(true),

            // Compliance
            entityIds: z.array(z.string()).optional().default([]),
            jurisdictions: z.array(z.string()).optional().default([]),
            categories: z.array(z.string()).optional().default([]),
            referenceId: z.string().optional().default(""),
          }),
        },
      },
      onStepFinish({ text, toolCalls, toolResults, finishReason }) {
        console.log("🔍 Step finished:", {
          text: text?.substring(0, 100),
          toolCalls: toolCalls.map(t => t.toolName),
          finishReason
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
        return "An unexpected error occurred. Please try again.";
      }
    });

  } catch (error) {
    console.error("❌ POST handler error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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