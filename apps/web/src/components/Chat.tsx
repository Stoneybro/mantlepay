"use client";
import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, Loader2, CheckCircle2, XCircle, Users, Clock, Send } from "lucide-react";
import { 
  useSingleTransfer, 
  useBatchTransfer, 
  useRecurringPayment 
} from "@/hooks/usePaymentTransaction";
import { Button } from "@/components/ui/button";

// Type definitions for tool inputs
type SingleTransferInput = {
  to: string;
  amount: string;
};

type BatchTransferInput = {
  recipients: string[];
  amounts: string[];
};

type RecurringPaymentInput = {
  name: string;
  recipients: string[];
  amounts: string[];
  interval: number;
  duration: number;
  transactionStartTime: number;
};

function Chat() {
  const [input, setInput] = useState("");
  
  // AI SDK hook
  const { messages, sendMessage, addToolResult, status, error } = useChat({
    // Auto-submit when all tool results are available
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  
  // Transaction hooks
  const singleTransfer = useSingleTransfer();
  const batchTransfer = useBatchTransfer();
  const recurringPayment = useRecurringPayment();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage({ text: input });
    setInput("");
  };

  // Helper to format addresses
  const formatAddress = (addr: string) => {
    if (addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Helper to format time
  const formatInterval = (seconds: number) => {
    if (seconds >= 86400) return `${seconds / 86400} day(s)`;
    if (seconds >= 3600) return `${seconds / 3600} hour(s)`;
    return `${seconds / 60} minute(s)`;
  };

  // Check if any transaction is pending
  const isTransactionPending = 
    singleTransfer.isPending || 
    batchTransfer.isPending || 
    recurringPayment.isPending;

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className='w-full h-full p-4 md:p-8 relative flex flex-col'>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pb-4 pr-2 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className='whitespace-pre-wrap break-words'>
              <span className="font-medium">
                {message.role === "user" ? "You: " : "Aidra: "}
              </span>
              <span className="text-foreground/90">
                {message.parts.map((part, i) => {
                  // Render text parts
                  if (part.type === "text") {
                    return <span key={`${message.id}-${i}`}>{part.text}</span>;
                  }
                  
                  // Render tool parts - Single Transfer
                  if (part.type === "tool-executeSingleTransfer") {
                    const callId = part.toolCallId;
                    
                    if ('state' in part) {
                      switch (part.state) {
                        case 'input-streaming':
                          return (
                            <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Preparing transfer...</span>
                            </div>
                          );
                          
                        case 'input-available':
                          const input = part.input as SingleTransferInput;
                          
                          return (
                            <div key={callId} className="my-4 p-4 border border-blue-500/50 bg-blue-500/10 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Send className="h-4 w-4 text-blue-600" />
                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                  Single Transfer Confirmation
                                </p>
                              </div>
                              
                              <div className="text-sm space-y-1 mb-4">
                                <p><strong>To:</strong> {formatAddress(input.to)}</p>
                                <p><strong>Amount:</strong> {input.amount} ETH</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const result = await singleTransfer.mutateAsync({
                                        to: input.to as `0x${string}`,
                                        amount: input.amount
                                      });
                                      
                                      addToolResult({
                                        tool: 'executeSingleTransfer',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                      });
                                    } catch (error: any) {
                                      addToolResult({
                                        tool: 'executeSingleTransfer',
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: error.message
                                      });
                                    }
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  {singleTransfer.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="mr-2 h-4 w-4" />
                                      Confirm
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addToolResult({
                                      tool: 'executeSingleTransfer',
                                      toolCallId: callId,
                                      state: 'output-error',
                                      errorText: 'User cancelled'
                                    });
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          );
                          
                        case 'output-available':
                          return (
                            <div key={callId} className="my-2 text-sm text-green-600 dark:text-green-400">
                              ✅ Transfer confirmed: {formatAddress(part.output as string)}
                            </div>
                          );
                          
                        case 'output-error':
                          return (
                            <div key={callId} className="my-2 text-sm text-red-600 dark:text-red-400">
                              ❌ Error: {part.errorText}
                            </div>
                          );
                      }
                    }
                  }
                  
                  // Render tool parts - Batch Transfer
                  if (part.type === "tool-executeBatchTransfer") {
                    const callId = part.toolCallId;
                    
                    if ('state' in part) {
                      switch (part.state) {
                        case 'input-streaming':
                          return (
                            <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Preparing batch transfer...</span>
                            </div>
                          );
                          
                        case 'input-available':
                          const batchInput = part.input as BatchTransferInput;
                          const totalAmount = batchInput.amounts.reduce((sum: number, amt: string) => 
                            sum + parseFloat(amt), 0
                          ).toFixed(4);
                          
                          return (
                            <div key={callId} className="my-4 p-4 border border-purple-500/50 bg-purple-500/10 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="h-4 w-4 text-purple-600" />
                                <p className="font-medium text-purple-900 dark:text-purple-100">
                                  Batch Transfer Confirmation
                                </p>
                              </div>
                              
                              <div className="text-sm space-y-1 mb-3">
                                <p><strong>Recipients:</strong> {batchInput.recipients.length}</p>
                                <p><strong>Total:</strong> {totalAmount} ETH</p>
                                <details className="mt-2">
                                  <summary className="cursor-pointer hover:text-foreground font-medium">
                                    View all recipients
                                  </summary>
                                  <div className="mt-2 space-y-1 pl-2">
                                    {batchInput.recipients.map((addr: string, idx: number) => (
                                      <p key={idx}>• {formatAddress(addr)}: {batchInput.amounts[idx]} ETH</p>
                                    ))}
                                  </div>
                                </details>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const result = await batchTransfer.mutateAsync({
                                        recipients: batchInput.recipients as `0x${string}`[],
                                        amounts: batchInput.amounts
                                      });
                                      
                                      addToolResult({
                                        tool: 'executeBatchTransfer',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                      });
                                    } catch (error: any) {
                                      addToolResult({
                                        tool: 'executeBatchTransfer',
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: error.message
                                      });
                                    }
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  {batchTransfer.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Users className="mr-2 h-4 w-4" />
                                      Confirm
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addToolResult({
                                      tool: 'executeBatchTransfer',
                                      toolCallId: callId,
                                      state: 'output-error',
                                      errorText: 'User cancelled'
                                    });
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          );
                          
                        case 'output-available':
                          return (
                            <div key={callId} className="my-2 text-sm text-green-600 dark:text-green-400">
                              ✅ Batch transfer confirmed: {formatAddress(part.output as string)}
                            </div>
                          );
                          
                        case 'output-error':
                          return (
                            <div key={callId} className="my-2 text-sm text-red-600 dark:text-red-400">
                              ❌ Error: {part.errorText}
                            </div>
                          );
                      }
                    }
                  }
                  
                  // Render tool parts - Recurring Payment
                  if (part.type === "tool-executeRecurringPayment") {
                    const callId = part.toolCallId;
                    
                    if ('state' in part) {
                      switch (part.state) {
                        case 'input-streaming':
                          return (
                            <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Preparing recurring payment...</span>
                            </div>
                          );
                          
                        case 'input-available':
                          const recurringInput = part.input as RecurringPaymentInput;
                          const totalPayments = Math.floor(recurringInput.duration / recurringInput.interval);
                          const totalPerRecipient = recurringInput.amounts.map((amt: string) => 
                            (parseFloat(amt) * totalPayments).toFixed(4)
                          );
                          const grandTotal = totalPerRecipient.reduce((sum: number, amt: string) => 
                            sum + parseFloat(amt), 0
                          ).toFixed(4);
                          
                          return (
                            <div key={callId} className="my-4 p-4 border border-orange-500/50 bg-orange-500/10 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <p className="font-medium text-orange-900 dark:text-orange-100">
                                  Recurring Payment Confirmation
                                </p>
                              </div>
                              
                              <div className="text-sm space-y-1 mb-3">
                                <p><strong>Name:</strong> {recurringInput.name}</p>
                                <p><strong>Recipients:</strong> {recurringInput.recipients.length}</p>
                                <p><strong>Amount per payment:</strong> {recurringInput.amounts[0]} ETH each</p>
                                <p><strong>Frequency:</strong> Every {formatInterval(recurringInput.interval)}</p>
                                <p><strong>Duration:</strong> {formatInterval(recurringInput.duration)}</p>
                                <p><strong>Total payments:</strong> {totalPayments}</p>
                                <p><strong>Total amount:</strong> {grandTotal} ETH</p>
                                <p><strong>Starts:</strong> {new Date(recurringInput.transactionStartTime * 1000).toLocaleString()}</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const result = await recurringPayment.mutateAsync({
                                        name: recurringInput.name,
                                        recipients: recurringInput.recipients as `0x${string}`[],
                                        amounts: recurringInput.amounts,
                                        interval: recurringInput.interval,
                                        duration: recurringInput.duration,
                                        transactionStartTime: recurringInput.transactionStartTime
                                      });
                                      
                                      addToolResult({
                                        tool: 'executeRecurringPayment',
                                        toolCallId: callId,
                                        output: result.receipt.transactionHash
                                      });
                                    } catch (error: any) {
                                      addToolResult({
                                        tool: 'executeRecurringPayment',
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: error.message
                                      });
                                    }
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  {recurringPayment.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="mr-2 h-4 w-4" />
                                      Confirm & Sign
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    addToolResult({
                                      tool: 'executeRecurringPayment',
                                      toolCallId: callId,
                                      state: 'output-error',
                                      errorText: 'User cancelled'
                                    });
                                  }}
                                  disabled={isTransactionPending}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          );
                          
                        case 'output-available':
                          return (
                            <div key={callId} className="my-2 text-sm text-green-600 dark:text-green-400">
                              ✅ Recurring payment created: {formatAddress(part.output as string)}
                            </div>
                          );
                          
                        case 'output-error':
                          return (
                            <div key={callId} className="my-2 text-sm text-red-600 dark:text-red-400">
                              ❌ Error: {part.errorText}
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

          {/* Global Transaction Status */}
          {isTransactionPending && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet signature...</span>
            </div>
          )}

          {/* API Status */}
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

      {/* Input Area */}
      <div className="w-full max-w-2xl mx-auto">
        <InputGroup>
          <InputGroupTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "Send 0.1 ETH to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"'
            disabled={isTransactionPending || isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={2}
          />
          <InputGroupAddon align={"block-end"}>
            <InputGroupButton
              variant='default'
              className='rounded-full'
              size='icon-xs'
              onClick={handleSubmit}
              disabled={isTransactionPending || isLoading}
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
        
        {/* Examples */}
      </div>
    </div>
  );
}

export default Chat;