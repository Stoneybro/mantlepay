import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Contact } from '@/lib/contact-store';

// Fetch all contacts for user
export function useContacts(userId?: string) {
    return useQuery({
        queryKey: ['contacts', userId],
        queryFn: async () => {
            const res = await fetch(`/api/contacts?userId=${userId}`);
            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            return data.contacts as Contact[];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 min
        gcTime: 30 * 60 * 1000, // 30 min
    });
}

// Create contact
export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            userId: string;
            name: string;
            type: 'individual' | 'group';
            addresses: Array<{ address: string; label?: string }>;
        }) => {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create contact');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['contacts', variables.userId]
            });
        },
    });
}

// Update contact
export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            contactId: string;
            userId: string;
            name?: string;
            type?: 'individual' | 'group';
            addresses?: Array<{ address: string; label?: string }>;
        }) => {
            const res = await fetch(`/api/contacts/${data.contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to update contact');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['contacts', variables.userId]
            });
        },
    });
}

// Delete contact
export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { contactId: string; userId: string }) => {
            const res = await fetch(`/api/contacts/${data.contactId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete contact');
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['contacts', variables.userId]
            });
        },
    });
}
