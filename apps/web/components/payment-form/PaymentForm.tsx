"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRecurringTokenPayment } from "@/hooks/payments/useRecurringTokenPayment";
import { useSingleTokenTransfer } from "@/hooks/payments/useSingleTokenTransfer";
import { useBatchTokenTransfer } from "@/hooks/payments/useBatchTokenTransfer";
import { toast } from "sonner";

interface PaymentFormProps {
    walletAddress?: `0x${string}`;
    availableBalance?: string;
}

type PaymentType = "single" | "batch" | "recurring";
type PayrollCategory = "none" | "W2" | "CONTRACTOR" | "BONUS";

export function PaymentForm({ walletAddress, availableBalance }: PaymentFormProps) {
    const [paymentType, setPaymentType] = useState<PaymentType>("single");

    // Single payment state
    const [singleRecipient, setSingleRecipient] = useState("");
    const [singleAmount, setSingleAmount] = useState("");

    // Batch payment state
    const [batchRecipients, setBatchRecipients] = useState([{ address: "", amount: "" }]);

    // Recurring payment state
    const [recurringName, setRecurringName] = useState("");
    const [recurringRecipients, setRecurringRecipients] = useState([{ address: "", amount: "" }]);
    const [recurringInterval, setRecurringInterval] = useState("86400"); // daily default
    const [recurringDuration, setRecurringDuration] = useState("");

    // Payroll metadata
    const [payrollCategory, setPayrollCategory] = useState<PayrollCategory>("none");
    const [jurisdiction, setJurisdiction] = useState("none");
    const [employeeId, setEmployeeId] = useState("");
    const [periodId, setPeriodId] = useState("");

    // Mutations
    const singleMutation = useSingleTokenTransfer(availableBalance);
    const batchMutation = useBatchTokenTransfer(availableBalance);
    const recurringMutation = useRecurringTokenPayment(availableBalance);

    const isProcessing = singleMutation.isPending || batchMutation.isPending || recurringMutation.isPending;

    const addRecipient = (type: "batch" | "recurring") => {
        if (type === "batch") {
            setBatchRecipients([...batchRecipients, { address: "", amount: "" }]);
        } else {
            setRecurringRecipients([...recurringRecipients, { address: "", amount: "" }]);
        }
    };

    const removeRecipient = (type: "batch" | "recurring", index: number) => {
        if (type === "batch") {
            setBatchRecipients(batchRecipients.filter((_, i) => i !== index));
        } else {
            setRecurringRecipients(recurringRecipients.filter((_, i) => i !== index));
        }
    };

    const updateRecipient = (type: "batch" | "recurring", index: number, field: "address" | "amount", value: string) => {
        if (type === "batch") {
            const updated = [...batchRecipients];
            updated[index][field] = value;
            setBatchRecipients(updated);
        } else {
            const updated = [...recurringRecipients];
            updated[index][field] = value;
            setRecurringRecipients(updated);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (paymentType === "single") {
                if (!singleRecipient || !singleAmount) {
                    toast.error("Please fill in recipient and amount");
                    return;
                }
                await singleMutation.mutateAsync({
                    to: singleRecipient as `0x${string}`,
                    amount: singleAmount,
                    // Compliance metadata for single payment
                    compliance: {
                        entityIds: employeeId ? [employeeId] : [],
                        category: payrollCategory === "none" ? undefined : payrollCategory,
                        jurisdiction: jurisdiction === "none" ? undefined : jurisdiction,
                        referenceId: periodId || undefined,
                    },
                });
                // Reset
                setSingleRecipient("");
                setSingleAmount("");
                setPayrollCategory("none");
                setJurisdiction("none");
                setEmployeeId("");
                setPeriodId("");
            } else if (paymentType === "batch") {
                const validRecipients = batchRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length < 2) {
                    toast.error("Batch payments require at least 2 recipients");
                    return;
                }
                await batchMutation.mutateAsync({
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    // Compliance metadata for batch payment - entityIds per recipient
                    compliance: {
                        entityIds: validRecipients.map((_, i) => employeeId ? `${employeeId}-${i + 1}` : ""),
                        category: payrollCategory === "none" ? undefined : payrollCategory,
                        jurisdiction: jurisdiction === "none" ? undefined : jurisdiction,
                        referenceId: periodId || undefined,
                    },
                });
                setBatchRecipients([{ address: "", amount: "" }]);
                setPayrollCategory("none");
                setJurisdiction("none");
                setEmployeeId("");
                setPeriodId("");
            } else if (paymentType === "recurring") {
                if (!recurringName) {
                    toast.error("Please provide a name for this recurring payment");
                    return;
                }
                const validRecipients = recurringRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length === 0) {
                    toast.error("Please add at least one recipient");
                    return;
                }
                if (!recurringDuration) {
                    toast.error("Please specify the duration");
                    return;
                }
                await recurringMutation.mutateAsync({
                    name: recurringName,
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    interval: parseInt(recurringInterval),
                    duration: parseInt(recurringDuration),
                    transactionStartTime: 0,
                    // Compliance metadata - entityIds are per recipient
                    compliance: {
                        entityIds: validRecipients.map((_, i) => employeeId ? `${employeeId}-${i + 1}` : ""),
                        category: payrollCategory === "none" ? undefined : payrollCategory,
                        jurisdiction: jurisdiction === "none" ? undefined : jurisdiction,
                        referenceId: periodId || undefined,
                    },
                });
                // Reset
                setRecurringName("");
                setRecurringRecipients([{ address: "", amount: "" }]);
                setRecurringDuration("");
                setPayrollCategory("none");
                setJurisdiction("none");
                setEmployeeId("");
                setPeriodId("");
            }
        } catch (error) {
            console.error("Payment error:", error);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manual Payment Form</CardTitle>
                    <CardDescription>
                        Create payments without using the AI chat. All fields are required unless marked optional.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Payment Type Selection */}
                        <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single Transfer</SelectItem>
                                    <SelectItem value="batch">Batch Transfer (2+ recipients)</SelectItem>
                                    <SelectItem value="recurring">Recurring Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Single Transfer Form */}
                        {paymentType === "single" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="single-recipient">Recipient Address</Label>
                                    <Input
                                        id="single-recipient"
                                        placeholder="0x..."
                                        value={singleRecipient}
                                        onChange={(e) => setSingleRecipient(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="single-amount">Amount (MNEE)</Label>
                                    <Input
                                        id="single-amount"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={singleAmount}
                                        onChange={(e) => setSingleAmount(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Batch Transfer Form */}
                        {paymentType === "batch" && (
                            <div className="space-y-4">
                                <Label>Recipients</Label>
                                {batchRecipients.map((recipient, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="0x..."
                                            value={recipient.address}
                                            onChange={(e) => updateRecipient("batch", index, "address", e.target.value)}
                                            className="flex-1"
                                        />
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount"
                                            value={recipient.amount}
                                            onChange={(e) => updateRecipient("batch", index, "amount", e.target.value)}
                                            className="w-32"
                                        />
                                        {batchRecipients.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeRecipient("batch", index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addRecipient("batch")}
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add Recipient
                                </Button>
                            </div>
                        )}

                        {/* Recurring Payment Form */}
                        {paymentType === "recurring" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-name">Payment Name</Label>
                                    <Input
                                        id="recurring-name"
                                        placeholder="e.g., Monthly Payroll"
                                        value={recurringName}
                                        onChange={(e) => setRecurringName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Recipients</Label>
                                    {recurringRecipients.map((recipient, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <Input
                                                placeholder="0x..."
                                                value={recipient.address}
                                                onChange={(e) => updateRecipient("recurring", index, "address", e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Amount"
                                                value={recipient.amount}
                                                onChange={(e) => updateRecipient("recurring", index, "amount", e.target.value)}
                                                className="w-32"
                                            />
                                            {recurringRecipients.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeRecipient("recurring", index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addRecipient("recurring")}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Recipient
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Frequency</Label>
                                        <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="60">Every Minute (testing)</SelectItem>
                                                <SelectItem value="3600">Hourly</SelectItem>
                                                <SelectItem value="86400">Daily</SelectItem>
                                                <SelectItem value="604800">Weekly</SelectItem>
                                                <SelectItem value="2592000">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="3600">1 Hour</SelectItem>
                                                <SelectItem value="86400">1 Day</SelectItem>
                                                <SelectItem value="604800">1 Week</SelectItem>
                                                <SelectItem value="2592000">1 Month</SelectItem>
                                                <SelectItem value="7776000">3 Months</SelectItem>
                                                <SelectItem value="15552000">6 Months</SelectItem>
                                                <SelectItem value="31536000">1 Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Payroll Metadata Section */}
                                <div className="border-t pt-4 mt-4">
                                    <Label className="text-base font-semibold">Payroll Compliance (Optional)</Label>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add metadata for tax reporting and jurisdiction tracking.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tax Category</Label>
                                            <Select value={payrollCategory} onValueChange={(v) => setPayrollCategory(v as PayrollCategory)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="W2">W2 - Employee</SelectItem>
                                                    <SelectItem value="CONTRACTOR">1099 - Contractor</SelectItem>
                                                    <SelectItem value="BONUS">Bonus</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Jurisdiction</Label>
                                            <Select value={jurisdiction} onValueChange={setJurisdiction}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="None" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="US-CA">US - California</SelectItem>
                                                    <SelectItem value="US-NY">US - New York</SelectItem>
                                                    <SelectItem value="US-TX">US - Texas</SelectItem>
                                                    <SelectItem value="UK">United Kingdom</SelectItem>
                                                    <SelectItem value="EU-DE">Germany</SelectItem>
                                                    <SelectItem value="EU-FR">France</SelectItem>
                                                    <SelectItem value="NG">Nigeria</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="employee-id">Employee ID (Optional)</Label>
                                            <Input
                                                id="employee-id"
                                                placeholder="e.g., EMP-001"
                                                value={employeeId}
                                                onChange={(e) => setEmployeeId(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="period-id">Period ID (Optional)</Label>
                                            <Input
                                                id="period-id"
                                                placeholder="e.g., 2025-01, 2025-Q1"
                                                value={periodId}
                                                onChange={(e) => setPeriodId(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                paymentType === "recurring" ? "Create Recurring Payment" : "Send Payment"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
