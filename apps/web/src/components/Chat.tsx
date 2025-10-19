"use client";
import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { 
  ArrowUpIcon, 
  CirclePlus, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Users,
  Clock,
  Send
} from "lucide-react";
import { 
  useSingleTransfer, 
  useBatchTransfer, 
  useRecurringPayment,
  PaymentType 
} from "@/hooks/usePaymentTransaction";
import { Button } from "@/components/ui/button";

type PendingTransaction = {
  toolCallId: string;
  type: PaymentType;
  params: any;
};

function Chat() {
  const [input, setInput] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
  
  // AI SDK 5.0 - useChat with no config uses default /api/chat endpoint
  const { messages, sendMessage, status, error } = useChat();

  const singleTransfer = useSingleTransfer();
  const batchTransfer = useBatchTransfer();
  const recurringPayment = useRecurringPayment();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    if (!hasInteracted) setHasInteracted(true);
    
    // AI SDK 5.0 - sendMessage requires object with text property
    sendMessage({ text: input });
    setInput("");
  };

  // Detect tool calls that need transaction execution
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      lastMessage.parts.forEach((part) => {
        // AI SDK 5.0 - tool parts have type: `tool-${toolName}` format
        if (part.type.startsWith('tool-')) {
          const toolName = part.type.slice(5); // Remove 'tool-' prefix
          
          // Only process tools in 'input-available' state (ready to execute)
          if ('state' in part && part.state === 'input-available') {
            // part.input is already the correct type, no need to parse
            const args = part.input;
            
            // Check if it's an execution tool
            if (toolName === "executeSingleTransfer") {
              setPendingTx({
                toolCallId: part.toolCallId,
                type: 'single',
                params: args,
              });
            } else if (toolName === "executeBatchTransfer") {
              setPendingTx({
                toolCallId: part.toolCallId,
                type: 'batch',
                params: args,
              });
            } else if (toolName === "executeRecurringPayment") {
              setPendingTx({
                toolCallId: part.toolCallId,
                type: 'recurring',
                params: args,
              });
            }
          }
        }
      });
    }
  }, [messages]);

  // Execute the appropriate transaction
  const handleConfirm = async () => {
    if (!pendingTx) return;

    // AI SDK 5.0 - sendMessage requires object with text property
    sendMessage({ text: "Yes, please proceed with the transaction." });

    const executeTransaction = async () => {
      switch (pendingTx.type) {
        case 'single':
          return singleTransfer.mutateAsync(pendingTx.params);
        case 'batch':
          return batchTransfer.mutateAsync(pendingTx.params);
        case 'recurring':
          return recurringPayment.mutateAsync(pendingTx.params);
      }
    };

    try {
      const receipt = await executeTransaction();
      sendMessage({ 
        text: `Transaction successful! Hash: ${receipt.receipt.transactionHash}` 
      });
      setPendingTx(null);
    } catch (error: any) {
      sendMessage({ 
        text: `Transaction failed: ${error.message}` 
      });
      setPendingTx(null);
    }
  };

  const handleCancel = () => {
    // AI SDK 5.0 - sendMessage requires object with text property
    sendMessage({ text: "Cancel the transaction." });
    setPendingTx(null);
  };

  const isPending = singleTransfer.isPending || batchTransfer.isPending || recurringPayment.isPending;
  const isSuccess = singleTransfer.isSuccess || batchTransfer.isSuccess || recurringPayment.isSuccess;
  const isError = singleTransfer.isError || batchTransfer.isError || recurringPayment.isError;

  // Helper to format addresses
  const formatAddress = (addr: string) => {
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get icon based on transaction type
  const getTransactionIcon = (type?: PaymentType) => {
    switch (type) {
      case 'single': return <Send className="h-4 w-4" />;
      case 'batch': return <Users className="h-4 w-4" />;
      case 'recurring': return <Clock className="h-4 w-4" />;
      default: return null;
    }
  };

  // AI SDK 5.0 - use status instead of isLoading
  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className='w-full h-full p-4 md:p-8 relative flex flex-col justify-center'>
      <div className="flex-1 overflow-y-auto pb-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className='whitespace-pre-wrap break-words'>
              <span className="font-medium">
                {message.role === "user" ? "You: " : "Aidra: "}
              </span>
              <span className="text-foreground/90">
                {message.parts.map((part, i) => {
                  // Handle text parts
                  if (part.type === "text") {
                    return <span key={`${message.id}-${i}`}>{part.text}</span>;
                  }
                  
                  // AI SDK 5.0 - handle tool parts (type: `tool-${toolName}`)
                  if (part.type.startsWith('tool-')) {
                    const toolName = part.type.slice(5); // Remove 'tool-' prefix
                    
                    // Check if part has state property (type guard)
                    if ('state' in part) {
                      // Tool is being called or input is streaming
                      if (part.state === 'input-streaming' || part.state === 'input-available') {
                        return (
                          <div key={`${message.id}-${i}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing {toolName}...</span>
                          </div>
                        );
                      }
                      
                      // Tool has completed with output
                      if (part.state === 'output-available') {
                        const result = typeof part.output === 'string' 
                          ? part.output 
                          : JSON.stringify(part.output, null, 2);
                        
                        return (
                          <div key={`${message.id}-${i}`} className="text-xs text-muted-foreground bg-muted p-2 rounded my-2">
                            <pre className="whitespace-pre-wrap">{result}</pre>
                          </div>
                        );
                      }
                      
                      // Tool execution failed
                      if (part.state === 'output-error') {
                        return (
                          <div key={`${message.id}-${i}`} className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded my-2">
                            <span>Tool error: {part.errorText}</span>
                          </div>
                        );
                      }
                    }
                  }
                  
                  return null;
                })}
              </span>
            </div>
          ))}

          {/* Transaction status indicators */}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing transaction... Please sign in your wallet.</span>
            </div>
          )}

          {isSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Transaction confirmed!</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Transaction failed. Please try again.</span>
            </div>
          )}

          {/* Show API errors */}
          {status === 'error' && error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Error: {error.message}</span>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Aidra is thinking...</span>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced confirmation dialog with transaction type */}
      {pendingTx && (
        <div className="mb-4 p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {getTransactionIcon(pendingTx.type)}
            <p className="font-medium">
              ⚠️ {pendingTx.type === 'single' ? 'Single Transfer' : 
                   pendingTx.type === 'batch' ? 'Batch Transfer' : 
                   'Recurring Payment'} Confirmation
            </p>
          </div>
          
          {/* Show transaction details based on type */}
          <div className="text-sm text-muted-foreground mb-4 space-y-1">
            {pendingTx.type === 'single' && (
              <>
                <p>• To: {formatAddress(pendingTx.params.to)}</p>
                <p>• Amount: {pendingTx.params.amount} ETH</p>
              </>
            )}
            
            {pendingTx.type === 'batch' && (
              <>
                <p>• Recipients: {pendingTx.params.recipients.length}</p>
                <p>• Total: {pendingTx.params.recipients.reduce((sum: number, _: any, i: number) => 
                  sum + parseFloat(pendingTx.params.amounts[i]), 0).toFixed(4)} ETH</p>
                <details className="mt-2">
                  <summary className="cursor-pointer hover:text-foreground">View all recipients</summary>
                  <div className="mt-2 space-y-1 pl-2">
                    {pendingTx.params.recipients.map((addr: string, i: number) => (
                      <p key={i}>• {formatAddress(addr)}: {pendingTx.params.amounts[i]} ETH</p>
                    ))}
                  </div>
                </details>
              </>
            )}
            
            {pendingTx.type === 'recurring' && (
              <>
                <p>• Recipients: {pendingTx.params.recipients.length}</p>
                <p>• Amount per payment: {pendingTx.params.amounts[0]} ETH</p>
                <p>• Frequency: Every {pendingTx.params.interval / 86400} day(s)</p>
                <p>• Duration: {pendingTx.params.duration / 86400} day(s)</p>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Please review the details above and confirm to proceed.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleConfirm} 
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {getTransactionIcon(pendingTx.type)}
                  <span className="ml-2">Confirm & Sign</span>
                </>
              )}
            </Button>
            <Button 
              onClick={handleCancel} 
              variant="outline"
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div
        className={`w-full max-w-2xl bg-white dark:bg-background mx-auto transition-all duration-500 ease-in-out sticky
          ${hasInteracted
            ? 'bottom-4 translate-y-0'
            : 'bottom-[50vh] translate-y-1/2'}
        `}
      >
        <InputGroup>
          <InputGroupTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Ask, Search or Chat...'
            disabled={isPending || isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <InputGroupAddon align={"block-end"}>
            <InputGroupButton
              variant='outline'
              className='rounded-full'
              size='icon-xs'
            >
              <CirclePlus />
            </InputGroupButton>
            <InputGroupButton
              variant='default'
              className='rounded-full ml-auto'
              size='icon-xs'
              onClick={handleSubmit}
              disabled={isPending || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpIcon />
              )}
              <span className='sr-only'>Send</span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </div>
  );
}

export default Chat;