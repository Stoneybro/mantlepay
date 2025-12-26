/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import Image from "next/image";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { ArrowUpIcon, Loader2, XCircle } from "lucide-react";
import { FaCheck, FaTimes, FaUsers, FaDollarSign } from "react-icons/fa";
import { 
  useSingleTransfer,
  useSingleTokenTransfer,
  useBatchTransfer,
  useBatchTokenTransfer,
  useRecurringPayment,
  useRecurringTokenPayment,
  useCancelIntent
} from "@/hooks/usePaymentTransaction";
import { Button } from "@/components/ui/button";
import { BsArrowRepeat, BsArrowUpRight } from "react-icons/bs";
import { FaUsersGear } from "react-icons/fa6";
import { Card, CardAction, CardFooter, CardHeader } from "./ui/card";
import { fetchWalletBalance } from "@/utils/helpers";
import { useQuery } from "@tanstack/react-query";

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
  revertOnFailure?: boolean;
};

type CancelIntentInput = {
  intentId: string;
};

function Chat(walletAddress:{walletAddress:string}) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [input, setInput] = useState("");

    const { data: wallet } = useQuery({
    queryKey: ["walletBalance", walletAddress],
    queryFn: () => fetchWalletBalance(walletAddress.walletAddress as `0x${string}`),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    enabled: !!walletAddress,
  });

  
  // AI SDK hook
  const { messages, sendMessage, addToolResult, status, error } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
  
  // Transaction hooks
  const singleEthTransfer = useSingleTransfer(wallet?.availableEthBalance);
  const singlePyusdTransfer = useSingleTokenTransfer(wallet?.availablePyusdBalance);
  const batchEthTransfer = useBatchTransfer(wallet?.availableEthBalance);
  const batchPyusdTransfer = useBatchTokenTransfer(wallet?.availablePyusdBalance);
  const recurringEthPayment = useRecurringPayment(wallet?.availableEthBalance);
  const recurringPyusdPayment = useRecurringTokenPayment(wallet?.availablePyusdBalance);
  const cancelIntent = useCancelIntent();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage({ text: input });
    setInput("");
    setShowOverlay(false);
  };

  // Helper to format time
  const formatInterval = (seconds: number) => {
    if (seconds >= 86400) return `${seconds / 86400} day(s)`;
    if (seconds >= 3600) return `${seconds / 3600} hour(s)`;
    if (seconds >= 60) return `${seconds / 60} minute(s)`;
    return `${seconds} second(s)`;
  };

  // Format start time
  const formatStartTime = (timestamp: number) => {
    if (timestamp === 0) return "Immediately";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Check if any transaction is pending
  const isTransactionPending = 
    singleEthTransfer.isPending || 
    singlePyusdTransfer.isPending ||
    batchEthTransfer.isPending || 
    batchPyusdTransfer.isPending ||
    recurringEthPayment.isPending ||
    recurringPyusdPayment.isPending ||
    cancelIntent.isPending;
    
  const isLoading = status === 'submitted' || status === 'streaming';

  // Render tool confirmation UI
  const renderToolUI = (part: any, callId: string) => {
    // ============================================
    // TOOL 1: SINGLE ETH TRANSFER
    // ============================================
    if (part.type === "tool-executeSingleEthTransfer") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing ETH transfer...</span>
              </div>
            );
            
          case 'input-available':
            const input = part.input as SingleTransferInput;
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BsArrowUpRight />
                  <p className="font-medium">Single ETH Transfer</p>
                </div>
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>To:</strong> {input.to}</p>
                  <p><strong>Amount:</strong> {input.amount} ETH</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await singleEthTransfer.mutateAsync({
                          to: input.to as `0x${string}`,
                          amount: input.amount
                        });
                        
                        addToolResult({
                          tool: 'executeSingleEthTransfer',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeSingleEthTransfer',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {singleEthTransfer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeSingleEthTransfer',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> ETH transfer confirmed</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 flex items-center gap-1 text-sm ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 2: SINGLE PYUSD TRANSFER
    // ============================================
    if (part.type === "tool-executeSinglePyusdTransfer") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing PYUSD transfer...</span>
              </div>
            );
            
          case 'input-available':
            const input = part.input as SingleTransferInput;
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FaDollarSign />
                  <p className="font-medium">Single PYUSD Transfer</p>
                </div>
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>To:</strong> {input.to}</p>
                  <p><strong>Amount:</strong> ${input.amount} PYUSD</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await singlePyusdTransfer.mutateAsync({
                          to: input.to as `0x${string}`,
                          amount: input.amount
                        });
                        
                        addToolResult({
                          tool: 'executeSinglePyusdTransfer',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeSinglePyusdTransfer',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {singlePyusdTransfer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeSinglePyusdTransfer',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> PYUSD transfer confirmed</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 flex items-center gap-1 text-sm ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 3: BATCH ETH TRANSFER
    // ============================================
    if (part.type === "tool-executeBatchEthTransfer") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing batch ETH transfer...</span>
              </div>
            );
            
          case 'input-available':
            const batchInput = part.input as BatchTransferInput;
            const totalAmount = batchInput.amounts.reduce((sum: number, amt: string) => 
              sum + parseFloat(amt), 0
            ).toFixed(4);
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FaUsers />
                  <p className="font-medium">Batch ETH Transfer</p>
                </div>
                
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>Recipients:</strong> {batchInput.recipients.length}</p>
                  <p><strong>Total:</strong> {totalAmount} ETH</p>
                  <div className="mt-2 space-y-1 pl-2 max-h-40 overflow-y-auto">
                    {batchInput.recipients.map((addr: string, idx: number) => (
                      <p key={idx} className="text-xs">• {addr}: {batchInput.amounts[idx]} ETH</p>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await batchEthTransfer.mutateAsync({
                          recipients: batchInput.recipients as `0x${string}`[],
                          amounts: batchInput.amounts
                        });
                        
                        addToolResult({
                          tool: 'executeBatchEthTransfer',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeBatchEthTransfer',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {batchEthTransfer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeBatchEthTransfer',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> Batch ETH transfer confirmed</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 4: BATCH PYUSD TRANSFER
    // ============================================
    if (part.type === "tool-executeBatchPyusdTransfer") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing batch PYUSD transfer...</span>
              </div>
            );
            
          case 'input-available':
            const batchInput = part.input as BatchTransferInput;
            const totalAmount = batchInput.amounts.reduce((sum: number, amt: string) => 
              sum + parseFloat(amt), 0
            ).toFixed(2);
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <FaUsers />
                  <p className="font-medium">Batch PYUSD Transfer</p>
                </div>
                
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>Recipients:</strong> {batchInput.recipients.length}</p>
                  <p><strong>Total:</strong> ${totalAmount} PYUSD</p>
                  <div className="mt-2 space-y-1 pl-2 max-h-40 overflow-y-auto">
                    {batchInput.recipients.map((addr: string, idx: number) => (
                      <p key={idx} className="text-xs">• {addr}: ${batchInput.amounts[idx]} PYUSD</p>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await batchPyusdTransfer.mutateAsync({
                          recipients: batchInput.recipients as `0x${string}`[],
                          amounts: batchInput.amounts
                        });
                        
                        addToolResult({
                          tool: 'executeBatchPyusdTransfer',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeBatchPyusdTransfer',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {batchPyusdTransfer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeBatchPyusdTransfer',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> Batch PYUSD transfer confirmed</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 5: RECURRING ETH PAYMENT
    // ============================================
    if (part.type === "tool-executeRecurringEthPayment") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing recurring ETH payment...</span>
              </div>
            );
            
          case 'input-available':
            const recurringInput = part.input as RecurringPaymentInput;
            const totalPayments = Math.floor(recurringInput.duration / recurringInput.interval);
            const amountPerPayment = recurringInput.amounts.reduce((sum: number, amt: string) => 
              sum + parseFloat(amt), 0
            );
            const grandTotal = (amountPerPayment * totalPayments).toFixed(4);
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BsArrowRepeat />
                  <p className="font-medium">Recurring ETH Payment</p>
                </div>
                
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>Name:</strong> {recurringInput.name}</p>
                  <p><strong>Recipients:</strong> {recurringInput.recipients.length}</p>
                  <p><strong>Amount per payment:</strong> {amountPerPayment.toFixed(4)} ETH</p>
                  <p><strong>Frequency:</strong> Every {formatInterval(recurringInput.interval)}</p>
                  <p><strong>Duration:</strong> {formatInterval(recurringInput.duration)}</p>
                  <p><strong>Total payments:</strong> {totalPayments}</p>
                  <p><strong>Total commitment:</strong> {grandTotal} ETH</p>
                  <p><strong>Starts:</strong> {formatStartTime(recurringInput.transactionStartTime)}</p>
                  <p><strong>Failure handling:</strong> {recurringInput.revertOnFailure ? "Stop on failure" : "Skip failures"}</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await recurringEthPayment.mutateAsync({
                          name: recurringInput.name,
                          recipients: recurringInput.recipients as `0x${string}`[],
                          amounts: recurringInput.amounts,
                          interval: recurringInput.interval,
                          duration: recurringInput.duration,
                          transactionStartTime: recurringInput.transactionStartTime,
                          revertOnFailure: recurringInput.revertOnFailure
                        });
                        
                        addToolResult({
                          tool: 'executeRecurringEthPayment',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeRecurringEthPayment',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {recurringEthPayment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Create Intent'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeRecurringEthPayment',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> Recurring ETH payment created</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 6: RECURRING PYUSD PAYMENT
    // ============================================
    if (part.type === "tool-executeRecurringPyusdPayment") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing recurring PYUSD payment...</span>
              </div>
            );
            
          case 'input-available':
            const recurringInput = part.input as RecurringPaymentInput;
            const totalPayments = Math.floor(recurringInput.duration / recurringInput.interval);
            const amountPerPayment = recurringInput.amounts.reduce((sum: number, amt: string) => 
              sum + parseFloat(amt), 0
            );
            const grandTotal = (amountPerPayment * totalPayments).toFixed(2);
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <BsArrowRepeat />
                  <p className="font-medium">Recurring PYUSD Payment</p>
                </div>
                
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>Name:</strong> {recurringInput.name}</p>
                  <p><strong>Recipients:</strong> {recurringInput.recipients.length}</p>
                  <p><strong>Amount per payment:</strong> ${amountPerPayment.toFixed(2)} PYUSD</p>
                  <p><strong>Frequency:</strong> Every {formatInterval(recurringInput.interval)}</p>
                  <p><strong>Duration:</strong> {formatInterval(recurringInput.duration)}</p>
                  <p><strong>Total payments:</strong> {totalPayments}</p>
                  <p><strong>Total commitment:</strong> ${grandTotal} PYUSD</p>
                  <p><strong>Starts:</strong> {formatStartTime(recurringInput.transactionStartTime)}</p>
                  <p><strong>Failure handling:</strong> {recurringInput.revertOnFailure ? "Stop on failure" : "Skip failures"}</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={async () => {
                      try {
                        const result = await recurringPyusdPayment.mutateAsync({
                          name: recurringInput.name,
                          recipients: recurringInput.recipients as `0x${string}`[],
                          amounts: recurringInput.amounts,
                          interval: recurringInput.interval,
                          duration: recurringInput.duration,
                          transactionStartTime: recurringInput.transactionStartTime,
                          revertOnFailure: recurringInput.revertOnFailure
                        });
                        
                        addToolResult({
                          tool: 'executeRecurringPyusdPayment',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'executeRecurringPyusdPayment',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {recurringPyusdPayment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Create Intent'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'executeRecurringPyusdPayment',
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
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> Recurring PYUSD payment created</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    // ============================================
    // TOOL 7: CANCEL RECURRING PAYMENT
    // ============================================
    if (part.type === "tool-cancelRecurringPayment") {
      if ('state' in part) {
        switch (part.state) {
          case 'input-streaming':
            return (
              <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Preparing to cancel intent...</span>
              </div>
            );
            
          case 'input-available':
            const cancelInput = part.input as CancelIntentInput;
            
            return (
              <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5" />
                  <p className="font-medium">Cancel Recurring Payment</p>
                </div>
                
                <div className="text-sm space-y-1 mb-4">
                  <p><strong>Intent ID:</strong></p>
                  <p className="text-xs break-all font-mono bg-muted p-2 rounded">{cancelInput.intentId}</p>
                  <p className=" mt-2">⚠️ This action cannot be undone. The recurring payment will stop immediately.</p>
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      try {
                        const result = await cancelIntent.mutateAsync({
                          intentId: cancelInput.intentId as `0x${string}`
                        });
                        
                        addToolResult({
                          tool: 'cancelRecurringPayment',
                          toolCallId: callId,
                          output: result.receipt.transactionHash
                        });
                      } catch (error: any) {
                        addToolResult({
                          tool: 'cancelRecurringPayment',
                          toolCallId: callId,
                          state: 'output-error',
                          errorText: error.message
                        });
                      }
                    }}
                    disabled={isTransactionPending}
                  >
                    {cancelIntent.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      addToolResult({
                        tool: 'cancelRecurringPayment',
                        toolCallId: callId,
                        state: 'output-error',
                        errorText: 'User cancelled'
                      });
                    }}
                    disabled={isTransactionPending}
                  >
                    Keep Intent
                  </Button>
                </div>
              </div>
            );
            
          case 'output-available':
            return (
              <div key={callId} className="my-2 text-sm flex flex-col">
                <div className="flex items-center gap-1"><FaCheck /> Recurring payment cancelled successfully</div>
                <div>Hash: <a href={`https://eth-sepolia.blockscout.com/tx/${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
              </div>
            );
            
          case 'output-error':
            return (
              <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                <FaTimes /> Error: {part.errorText}
              </div>
            );
        }
      }
    }

    return null;
  };

  return (
    <div className='w-full h-full p-4 md:p-8 relative flex flex-col justify-center'>
      {/* TEMPLATES OVERLAY */}
      {showOverlay && (
        <div className="absolute w-full h-full top-0 left-0 flex flex-col gap-16 py-4 mx-auto md:gap-6 md:py-6">
          <Image src={"/Aidra.svg"} className="items-center self-center" width={100} height={100} alt="Aidra logo"/>
          <div className="text-2xl font-semibold text-center">Aidra smart wallet ready</div>
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 px-16 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-16 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <BsArrowUpRight />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Single Payment
                </div>
                <div className="text-muted-foreground">
                  Send one payment to one recipient
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <FaUsers />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Payment
                </div>
                <div className="text-muted-foreground">
                  Send one transaction to multiple recipients
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <BsArrowRepeat />
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Single Recurring Payment
                </div>
                <div className="text-muted-foreground">
                  Automate repeated transfers to one address
                </div>
              </CardFooter>
            </Card>
            
            <Card className="@container/card" onClick={() => setShowOverlay(false)}>
              <CardHeader>
                <CardAction>
                  <FaUsersGear/>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Batch Recurring Payment
                </div>
                <div className="text-muted-foreground text-xs">
                  Schedule recurring payments for teams or groups
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto pb-4 pr-2 mb-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`break-words ${message.role === "user" ? "ml-auto" : ""} bg-accent px-4 py-2 rounded w-fit`}
            >
              <span className="font-medium">
                {message.role === "user" ? "" : "Aidra: "}
              </span>
              <span className="text-foreground/90">
                {message.parts.map((part, i) => {
                  // Render text parts
                  if (part.type === "text") {
                    return <span key={`${message.id}-${i}`}>{part.text}</span>;
                  }
                  
                  // Render tool UI for all 7 tools
                  const toolCallId = 'toolCallId' in part ? part.toolCallId : '';
                  return renderToolUI(part, toolCallId);
                })}
              </span>
            </div>
          ))}

          {/* Global Transaction Status */}
          {isTransactionPending && (
            <div className="flex items-center gap-2 text-sm animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for wallet signature...</span>
            </div>
          )}

          {/* API Status */}
          {status === 'error' && error && (
            <div className="flex items-center gap-2 text-sm ">
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

      {/* INPUT AREA */}
      <div className="w-full max-w-2xl mx-auto sticky bottom-4 z-10">
        <InputGroup className="bg-white rounded-lg">
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
      </div>
    </div>
  );
}

export default Chat;