import { google } from '@ai-sdk/google';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Enhanced system prompt optimized for Gemini
const SYSTEM_PROMPT = `You are Aidra, a payment execution assistant. 

YOUR PRIMARY FUNCTION: Call the appropriate payment tool based on user requests.

TOOL SELECTION RULES:

1. executeSingleTransfer
   - Use when: ONE recipient address
   - Trigger words: "send to", "transfer to", "pay"
   - Example: "send 0.1 ETH to 0x123..."

2. executeBatchTransfer
   - Use when: MULTIPLE recipients, ONE-TIME payment
   - Trigger words: "send to [address] and [address]", "multiple recipients"
   - Example: "send 0.1 to 0x123 and 0.2 to 0x456"

3. executeRecurringPayment
   - Use when: REPEATED payments with time schedule
   - Trigger words: "every", "recurring", "daily", "weekly", "schedule", "repeated"
   - Example: "send 0.1 every 5 minutes for 30 minutes"

TIME CONVERSIONS (use these exact values):
• 1 minute = 60 seconds
• 5 minutes = 300 seconds
• 30 minutes = 1800 seconds
• 1 hour = 3600 seconds
• 1 day = 86400 seconds
• 1 week = 604800 seconds
• 30 days = 2592000 seconds

IMPORTANT:
- For transactionStartTime: Always use Math.floor(Date.now() / 1000)
- For "0.0001 eth each": Use same amount for all recipients in amounts array
- When user says "every X for Y": interval=X (in seconds), duration=Y (in seconds)

RESPONSE GUIDELINES:
- After calling tool: "Please review the details above."
- After success: "✅ Transaction successful! Hash: {hash}"
- Keep responses minimal - the UI shows all details.`;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Check if the last user message contains payment keywords
    const lastMessage = messages[messages.length - 1];
    
    // UIMessage can have different structures, handle both text and parts
    let messageText = '';
    if (lastMessage) {
      if ('parts' in lastMessage && Array.isArray(lastMessage.parts)) {
        // Extract text from parts
        messageText = lastMessage.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ')
          .toLowerCase();
      } else if ('content' in lastMessage && typeof lastMessage.content === 'string') {
        messageText = lastMessage.content.toLowerCase();
      }
    }
    
    const isPaymentRequest = 
      messageText.includes('send') ||
      messageText.includes('transfer') ||
      messageText.includes('pay') ||
      messageText.includes('recurring') ||
      messageText.includes('every') ||
      messageText.includes('0x');

    console.log('💡 Payment request detected:', isPaymentRequest, 'Message:', messageText.substring(0, 100));

    const result = streamText({
      model: google('gemini-2.0-flash-exp'), // Use Gemini 2.0 Flash
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      
      // Gemini works better with lower temperature for tool calling
      temperature: 0.1,
      
      // Force tool calling for payment-related messages
      toolChoice: isPaymentRequest ? 'required' : 'auto',
      
      tools: {
        // ============================================
        // 1. SINGLE TRANSFER TOOL
        // ============================================
        executeSingleTransfer: {
          description: `Execute a single ETH transfer to one recipient. 
          
Use this tool when:
- User wants to send ETH to ONE address
- User says "send", "transfer", "pay" to a single address
- You have: recipient address + amount

Examples that should trigger this tool:
- "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
- "Transfer 1 ETH to that address"
- "Pay 0.5 to Alice"

ALWAYS use this tool for single-recipient payments.`,
          
          inputSchema: z.object({
            to: z.string()
              .min(1, 'Recipient address is required')
              .describe('The recipient Ethereum address. Must start with 0x and be 42 characters. Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'),
            amount: z.string()
              .min(1, 'Amount is required')
              .describe('The amount of ETH to send as a string. Examples: "0.1", "1", "0.001". Do not include "ETH" suffix.'),
          }),
        },

        // ============================================
        // 2. BATCH TRANSFER TOOL
        // ============================================
        executeBatchTransfer: {
          description: `Execute a batch ETH transfer to multiple recipients in ONE transaction.
          
Use this tool when:
- User wants to send ETH to MULTIPLE addresses
- User says "send to Alice and Bob", "transfer to these addresses"
- You have: multiple recipient addresses + amounts

Examples that should trigger this tool:
- "Send 0.1 ETH to Alice and 0.2 to Bob"
- "Transfer to these 3 addresses: ..."
- "Pay 0.5 each to these wallets"

ALWAYS use this tool for multi-recipient payments.`,
          
          inputSchema: z.object({
            recipients: z.array(
              z.string()
                .min(1)
                .describe('Ethereum address starting with 0x')
            )
              .min(2, 'Batch transfer requires at least 2 recipients')
              .describe('Array of recipient Ethereum addresses. Example: ["0x123...", "0x456..."]'),
            amounts: z.array(
              z.string()
                .min(1)
                .describe('ETH amount as string')
            )
              .describe('Array of ETH amounts as strings, one for each recipient. Example: ["0.1", "0.2"]. Must match recipients length.'),
          }).refine((data) => data.recipients.length === data.amounts.length, {
            message: 'Number of recipients must match number of amounts',
          }),
        },

        // ============================================
        // 3. RECURRING PAYMENT TOOL
        // ============================================
        executeRecurringPayment: {
          description: `CREATE A RECURRING PAYMENT SCHEDULE. This tool sets up automatic payments that execute repeatedly.

WHEN TO USE THIS TOOL:
- User says "every", "recurring", "schedule", "repeated"
- User specifies a time interval (every 5 mins, daily, weekly)
- User mentions duration (for 30 mins, for a week)

EXAMPLES THAT TRIGGER THIS TOOL:
"send 0.1 ETH every day for a week"
"pay 0.0001 each to [addresses] every 5mins for 30mins"
"recurring payment of 1 ETH daily"
"schedule 0.5 ETH weekly"

YOU MUST CALL THIS TOOL when user wants repeated payments over time.`,
          
          inputSchema: z.object({
            name: z.string()
              .min(1)
              .default('Recurring Payment')
              .describe('Short name for this schedule. Examples: "Daily Payment", "Weekly Allowance". Default to "Recurring Payment" if not specified.'),
            recipients: z.array(
              z.string()
                .min(42)
                .max(42)
                .describe('Ethereum address starting with 0x, exactly 42 characters')
            )
              .min(1)
              .describe('Array of recipient Ethereum addresses. Can be 1 or more addresses.'),
            amounts: z.array(
              z.string()
                .describe('ETH amount as string, e.g. "0.0001"')
            )
              .describe('Array of ETH amounts, one per recipient. If user says "0.0001 each", use same amount for all recipients.'),
            interval: z.number()
              .int()
              .positive()
              .describe('Seconds between each payment. CONVERSIONS: 5 mins=300, 30 mins=1800, 1 hour=3600, 1 day=86400, 1 week=604800'),
            duration: z.number()
              .int()
              .positive()
              .describe('Total schedule duration in seconds. CONVERSIONS: 30 mins=1800, 1 hour=3600, 1 day=86400, 1 week=604800, 30 days=2592000'),
            transactionStartTime: z.number()
              .int()
              .nonnegative()
              .default(Math.floor(Date.now() / 1000))
              .describe('Unix timestamp (seconds) for first payment. Use Math.floor(Date.now()/1000) for immediate start.'),
          }).refine((data) => data.recipients.length === data.amounts.length, {
            message: 'Recipients and amounts must have same length',
          }).refine((data) => data.duration >= data.interval, {
            message: 'Duration must be at least one interval',
          }),
        },
      },
      
      // Debug callback to see what's happening at each step
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        console.log('🔍 Step finished:', {
          text: text?.substring(0, 100),
          toolCallsCount: toolCalls.length,
          toolResultsCount: toolResults.length,
          finishReason,
          toolNames: toolCalls.map(tc => tc.toolName),
        });
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('❌ Stream error:', error);
        
        // Handle specific AI SDK errors
        if (error?.constructor?.name === 'NoSuchToolError') {
          console.error('NoSuchToolError: Model tried to call unknown tool');
          return 'The AI tried to call an unknown tool. Please try rephrasing your request.';
        }
        
        if (error?.constructor?.name === 'InvalidToolInputError') {
          console.error('InvalidToolInputError: Model provided invalid tool inputs');
          return 'The AI provided invalid parameters. Please try rephrasing your request.';
        }
        
        // Provide user-friendly error messages
        if (error instanceof Error) {
          // API/Auth errors
          if (error.message.includes('API key') || error.message.includes('401')) {
            return 'Authentication error. Please check API configuration.';
          }
          // Rate limit errors
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            return 'Too many requests. Please wait a moment.';
          }
          // Timeout errors
          if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
            return 'Request timed out. Please try again.';
          }
          // Model errors
          if (error.message.includes('model')) {
            return 'Model error. The AI service is temporarily unavailable.';
          }
          
          // Return the actual error for other cases
          return `Error: ${error.message}`;
        }
        
        return 'An unexpected error occurred. Please try again.';
      },
    });
  } catch (error) {
    console.error('❌ POST handler error:', error);
    
    // Return a proper error response
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'ok',
      service: 'Aidra Payment Assistant API',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}