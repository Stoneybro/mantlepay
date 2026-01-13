'use client';

import { useState } from 'react';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Contact } from '@/lib/contact-store';

type ContactFormProps = {
    walletAddress?: string;
    contact?: Contact | null;
    onClose: () => void;
};

export function ContactForm({ walletAddress, contact, onClose }: ContactFormProps) {
    const [name, setName] = useState(contact?.name || '');
    const [addresses, setAddresses] = useState<Array<{ address: string; label?: string }>>(
        contact?.addresses.map(a => ({ address: a.address, label: a.label })) ||
        [{ address: '', label: '' }]
    );

    const { mutate: createContact, isPending: isCreating } = useCreateContact();
    const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();

    const isPending = isCreating || isUpdating;

    const addAddress = () => {
        setAddresses([...addresses, { address: '', label: '' }]);
    };

    const removeAddress = (index: number) => {
        if (addresses.length === 1) return;
        setAddresses(addresses.filter((_, i) => i !== index));
    };

    const updateAddressField = (index: number, field: 'address' | 'label', value: string) => {
        const updated = [...addresses];
        updated[index] = { ...updated[index], [field]: value };
        setAddresses(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            toast.error('Please enter a contact name');
            return;
        }

        const validAddresses = addresses.filter(a => a.address.trim() !== '');
        if (validAddresses.length === 0) {
            toast.error('Please add at least one address');
            return;
        }

        // Check address format
        const invalidAddresses = validAddresses.filter(
            a => !a.address.startsWith('0x') || a.address.length !== 42
        );
        if (invalidAddresses.length > 0) {
            toast.error('Please enter valid wallet addresses (0x...)');
            return;
        }

        // Determine type based on address count
        const type = validAddresses.length > 1 ? 'group' : 'individual';

        const data = {
            userId: walletAddress!,
            name: name.trim(),
            type: type as 'individual' | 'group',
            addresses: validAddresses,
        };

        if (contact) {
            updateContact(
                { ...data, contactId: contact.id },
                {
                    onSuccess: () => {
                        toast.success('Contact updated');
                        onClose();
                    },
                    onError: () => toast.error('Failed to update contact'),
                }
            );
        } else {
            createContact(data, {
                onSuccess: () => {
                    toast.success('Contact created');
                    onClose();
                },
                onError: () => toast.error('Failed to create contact'),
            });
        }
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                    {contact ? 'Edit Contact' : 'New Contact'}
                </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Bob, Team Alpha"
                        autoFocus
                    />
                </div>

                {/* Addresses */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Wallet Address(es)</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addAddress}
                            className="h-7 px-2"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {addresses.map((addr, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    value={addr.address}
                                    onChange={(e) => updateAddressField(index, 'address', e.target.value)}
                                    placeholder="0x..."
                                    className="font-mono text-sm"
                                />
                                {addresses.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeAddress(index)}
                                        className="h-10 w-10 shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Add multiple addresses to create a group
                    </p>
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
                </Button>
            </form>
        </div>
    );
}
