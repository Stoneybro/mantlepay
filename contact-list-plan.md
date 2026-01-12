# Contact List Feature Implementation Plan 
## Overview
Add a contact management system that allows users to store recipient addresses (individuals or groups) and reference them by name in chat transactions. Uses database as source of truth with TanStack Query for intelligent caching.

---

## 1. Database Schema Changes

### New Table: `contacts`
```sql
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'group')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE UNIQUE INDEX idx_contacts_user_name ON contacts(user_id, LOWER(name));
```

### New Table: `contact_addresses`
```sql
CREATE TABLE contact_addresses (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contact_id, address)
);

CREATE INDEX idx_contact_addresses_contact_id ON contact_addresses(contact_id);
```

**Files to create/modify:**
- `apps/web/db/schema.ts` - Add new tables
- `apps/web/db/migrations/XXXX_add_contacts.sql` - New migration file

**Migration command:**
```bash
pnpm db:push
```

---

## 2. Backend API Routes

### **Create: `apps/web/app/api/contacts/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getContacts, createContact } from "@/lib/contact-store";

// GET /api/contacts?userId=xxx - List all contacts for user
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const contacts = await getContacts(userId);
  return NextResponse.json({ contacts }, { status: 200 });
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, name, type, addresses } = body;
  
  if (!userId || !name || !type || !addresses) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const contact = await createContact(userId, name, type, addresses);
  return NextResponse.json({ contact }, { status: 201 });
}
```

### **Create: `apps/web/app/api/contacts/[contactId]/route.ts`**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getContact, updateContact, deleteContact } from "@/lib/contact-store";

// GET /api/contacts/[contactId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  const contact = await getContact(contactId);
  
  if (!contact) {
    return NextResponse.json(
      { error: "Contact not found" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ contact }, { status: 200 });
}

// PUT /api/contacts/[contactId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  const body = await request.json();
  
  const contact = await updateContact(contactId, body);
  return NextResponse.json({ contact }, { status: 200 });
}

// DELETE /api/contacts/[contactId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  await deleteContact(contactId);
  
  return NextResponse.json({ success: true }, { status: 200 });
}
```

---

## 3. Contact Storage Functions

**Create: `apps/web/lib/contact-store.ts`**
```typescript
import { db } from "../db/db";
import { contacts, contactAddresses } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "ai";

export type Contact = {
  id: string;
  userId: string;
  name: string;
  type: 'individual' | 'group';
  addresses: Array<{
    id: string;
    address: string;
    label?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

// Create new contact with addresses
export async function createContact(
  userId: string,
  name: string,
  type: 'individual' | 'group',
  addresses: Array<{ address: string; label?: string }>
): Promise<Contact> {
  const contactId = generateId();
  
  await db.transaction(async (tx) => {
    // Insert contact
    await tx.insert(contacts).values({
      id: contactId,
      userId,
      name,
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Insert addresses
    for (const addr of addresses) {
      await tx.insert(contactAddresses).values({
        id: generateId(),
        contactId,
        address: addr.address,
        label: addr.label,
        createdAt: new Date(),
      });
    }
  });
  
  return getContact(contactId) as Promise<Contact>;
}

// Get all contacts for user (with addresses)
export async function getContacts(userId: string): Promise<Contact[]> {
  const results = await db
    .select()
    .from(contacts)
    .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
    .where(eq(contacts.userId, userId))
    .orderBy(contacts.name);
  
  // Group addresses by contact
  const contactMap = new Map<string, Contact>();
  
  for (const row of results) {
    if (!contactMap.has(row.contacts.id)) {
      contactMap.set(row.contacts.id, {
        id: row.contacts.id,
        userId: row.contacts.userId,
        name: row.contacts.name,
        type: row.contacts.type as 'individual' | 'group',
        addresses: [],
        createdAt: row.contacts.createdAt,
        updatedAt: row.contacts.updatedAt,
      });
    }
    
    if (row.contact_addresses) {
      contactMap.get(row.contacts.id)!.addresses.push({
        id: row.contact_addresses.id,
        address: row.contact_addresses.address,
        label: row.contact_addresses.label || undefined,
      });
    }
  }
  
  return Array.from(contactMap.values());
}

// Get single contact by ID
export async function getContact(contactId: string): Promise<Contact | null> {
  const results = await db
    .select()
    .from(contacts)
    .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
    .where(eq(contacts.id, contactId));
  
  if (results.length === 0) return null;
  
  const contact: Contact = {
    id: results[0].contacts.id,
    userId: results[0].contacts.userId,
    name: results[0].contacts.name,
    type: results[0].contacts.type as 'individual' | 'group',
    addresses: [],
    createdAt: results[0].contacts.createdAt,
    updatedAt: results[0].contacts.updatedAt,
  };
  
  for (const row of results) {
    if (row.contact_addresses) {
      contact.addresses.push({
        id: row.contact_addresses.id,
        address: row.contact_addresses.address,
        label: row.contact_addresses.label || undefined,
      });
    }
  }
  
  return contact;
}

// Find contact by name (case-insensitive)
export async function getContactByName(
  userId: string,
  name: string
): Promise<Contact | null> {
  const results = await db
    .select()
    .from(contacts)
    .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
    .where(
      and(
        eq(contacts.userId, userId),
        sql`LOWER(${contacts.name}) = LOWER(${name})`
      )
    );
  
  if (results.length === 0) return null;
  
  const contact: Contact = {
    id: results[0].contacts.id,
    userId: results[0].contacts.userId,
    name: results[0].contacts.name,
    type: results[0].contacts.type as 'individual' | 'group',
    addresses: [],
    createdAt: results[0].contacts.createdAt,
    updatedAt: results[0].contacts.updatedAt,
  };
  
  for (const row of results) {
    if (row.contact_addresses) {
      contact.addresses.push({
        id: row.contact_addresses.id,
        address: row.contact_addresses.address,
        label: row.contact_addresses.label || undefined,
      });
    }
  }
  
  return contact;
}

// Update contact
export async function updateContact(
  contactId: string,
  data: { name?: string; type?: 'individual' | 'group' }
): Promise<Contact> {
  await db
    .update(contacts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(contacts.id, contactId));
  
  return getContact(contactId) as Promise<Contact>;
}

// Delete contact (cascade deletes addresses)
export async function deleteContact(contactId: string): Promise<void> {
  await db.delete(contacts).where(eq(contacts.id, contactId));
}

// Add address to contact
export async function addAddressToContact(
  contactId: string,
  address: string,
  label?: string
): Promise<void> {
  await db.insert(contactAddresses).values({
    id: generateId(),
    contactId,
    address,
    label,
    createdAt: new Date(),
  });
  
  await db
    .update(contacts)
    .set({ updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
}

// Remove address from contact
export async function removeAddressFromContact(
  contactId: string,
  addressId: string
): Promise<void> {
  await db
    .delete(contactAddresses)
    .where(
      and(
        eq(contactAddresses.id, addressId),
        eq(contactAddresses.contactId, contactId)
      )
    );
  
  await db
    .update(contacts)
    .set({ updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
}
```

---

## 4. React Hooks with TanStack Query Caching

**Create: `apps/web/hooks/useContacts.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Contact } from '@/lib/contact-store';

// Fetch all contacts for user with smart caching
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
    staleTime: 5 * 60 * 1000, // 5 min - data stays fresh
    gcTime: 30 * 60 * 1000, // 30 min - cache persists
    refetchOnMount: false, // Don't refetch if cache is fresh
    refetchOnWindowFocus: false,
  });
}

// Fetch single contact
export function useContact(contactId?: string) {
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) throw new Error('Failed to fetch contact');
      const data = await res.json();
      return data.contact as Contact;
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
  });
}

// Create contact with optimistic updates
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
      // Invalidate contacts list to refetch
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
      queryClient.invalidateQueries({ 
        queryKey: ['contact', variables.contactId] 
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
```

---

## 5. Contact Resolution Logic

**Create: `apps/web/lib/resolveContacts.ts`**
```typescript
import { getContactByName } from './contact-store';

export type ResolvedRecipient = {
  original: string; // Original text from user
  addresses: string[]; // Resolved addresses
  contactName?: string; // Contact name if found
  isContact: boolean; // Whether this was resolved from contacts
};

/**
 * Resolves potential contact names in user message to addresses
 * Only queries database if message contains non-address recipients
 */
export async function resolveRecipients(
  userMessage: string,
  userId: string
): Promise<ResolvedRecipient[]> {
  // Extract potential recipients from message
  // Patterns: "to X", "send X", "pay X", etc.
  const recipientPattern = /(?:to|send|pay)\s+([a-zA-Z0-9][a-zA-Z0-9\s]*?)(?:\s+(?:and|,|every|for|each|\d|$))/gi;
  const matches = Array.from(userMessage.matchAll(recipientPattern));
  
  if (matches.length === 0) return [];
  
  const resolved: ResolvedRecipient[] = [];
  
  for (const match of matches) {
    const recipient = match[1].trim();
    
    // If it's already an address, skip contact lookup
    if (recipient.startsWith('0x') && recipient.length === 42) {
      resolved.push({
        original: recipient,
        addresses: [recipient],
        isContact: false,
      });
      continue;
    }
    
    // Try to find contact by name
    const contact = await getContactByName(userId, recipient);
    
    if (contact) {
      resolved.push({
        original: recipient,
        addresses: contact.addresses.map(a => a.address),
        contactName: contact.name,
        isContact: true,
      });
    } else {
      // Not found - AI will handle asking user
      resolved.push({
        original: recipient,
        addresses: [],
        isContact: false,
      });
    }
  }
  
  return resolved;
}

/**
 * Creates contact context string for AI prompt
 * Only called when message likely contains contact references
 */
export function createContactContext(contacts: any[]): string {
  if (contacts.length === 0) return '';
  
  const contactList = contacts
    .map(c => `${c.name} (${c.type}): ${c.addresses.map((a: any) => a.address).join(', ')}`)
    .join('\n');
  
  return `\n\n[User's Saved Contacts]\n${contactList}\n`;
}

/**
 * Checks if message likely contains contact references (not addresses)
 */
export function hasContactReference(message: string): boolean {
  // Has "to/send/pay" followed by non-address text
  const pattern = /(?:to|send|pay)\s+([a-zA-Z][a-zA-Z\s]*)/i;
  return pattern.test(message) && !message.includes('0x');
}
```

---

## 6. AI Prompt Enhancement

**Modify: `apps/web/app/api/chat/route.ts`**

Add to imports:
```typescript
import { getContacts } from "@/lib/contact-store";
import { hasContactReference, createContactContext } from "@/lib/resolveContacts";
```

Update `SYSTEM_PROMPT` (add after "AREA OF RESPONSIBILITY" section):
```typescript
## CONTACT RESOLUTION

Users can save contacts (individuals or groups) with friendly names instead of addresses.

**Contact Resolution Rules:**
1. **When user mentions a name (not a 0x address)**, check the [User's Saved Contacts] section below
2. **If contact found**: Use the contact's address(es) in tool calls
3. **If contact NOT found**: Ask user if they meant an existing contact or if they want to create one
4. **For group contacts**: Automatically use batch transfer tools with all group addresses

**Examples:**
- "send 10 MNEE to bob" → Look up "bob" in contacts, use bob's address
- "pay engineering team 50 MNEE" → Look up "engineering team", use batch transfer with all team addresses
- "send to alice and 0x123..." → Use alice's address from contacts + literal 0x123...

**When contact not found:**
- User: "send 10 MNEE to john"
- You: "I don't have a contact named 'john'. Would you like to:
  1. Enter john's wallet address manually
  2. Create a new contact named 'john' (I can save it for future use)"

**IMPORTANT**: Always reference contacts by name in responses for better UX:
- ✅ "Sending 10 MNEE to Bob (0x742d...)"
- ❌ "Sending 10 MNEE to 0x742d..."
```

Update POST function to inject contacts only when needed:
```typescript
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { message, chatId, walletAddress } = json;

    // ... existing code ...

    // Only fetch contacts if message likely contains contact references
    let contactContext = '';
    if (hasContactReference(message.content)) {
      try {
        const contacts = await getContacts(walletAddress);
        contactContext = createContactContext(contacts);
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        // Continue without contacts - AI will ask for addresses
      }
    }

    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT + contactContext, // Inject contacts when needed
      messages: modelMessages,
      temperature: 0.0,
      toolChoice: "auto",
      tools: {
        // ... existing tools ...
      },
      // ... rest of config
    });

    return result.toUIMessageStreamResponse({
      // ... existing config
    });
  } catch (error) {
    // ... error handling
  }
}
```

---

## 7. UI Components

### **Create: `apps/web/components/contacts/ContactList.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useContacts, useDeleteContact } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Loader2, Plus, Search, Users, User, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactForm } from './ContactForm';
import { toast } from 'sonner';

type ContactListProps = {
  walletAddress?: string;
  onSelectContact?: (contact: any) => void;
};

export function ContactList({ walletAddress, onSelectContact }: ContactListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const { data: contacts = [], isLoading } = useContacts(walletAddress);
  const { mutate: deleteContact, isPending: isDeleting } = useDeleteContact();

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (contactId: string) => {
    if (!window.confirm('Delete this contact?')) return;
    
    deleteContact(
      { contactId, userId: walletAddress! },
      {
        onSuccess: () => {
          toast.success('Contact deleted');
        },
        onError: () => {
          toast.error('Failed to delete contact');
        },
      }
    );
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <ContactForm
        walletAddress={walletAddress}
        contact={editingContact}
        onClose={() => {
          setShowForm(false);
          setEditingContact(null);
        }}
      />
    );
  }

  return (
    <SidebarGroup className="px-0">
      <div className="p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Add Contact Button */}
        <Button
          onClick={() => setShowForm(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <SidebarGroupContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No contacts found' : 'No contacts yet'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="group flex items-center gap-3 p-3 rounded hover:bg-muted cursor-pointer"
                onClick={() => onSelectContact?.(contact)}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                  {contact.type === 'group' ? (
                    <Users className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {contact.addresses.length === 1
                      ? `${contact.addresses[0].address.slice(0, 6)}...${contact.addresses[0].address.slice(-4)}`
                      : `${contact.addresses.length} addresses`}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(contact)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(contact.id)}
                      className="text-destructive"
                      disabled={isDeleting}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

### **Create: `apps/web/components/contacts/ContactForm.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type ContactFormProps = {
  walletAddress?: string;
  contact?: any; // Existing contact for editing
  onClose: () => void;
};

export function ContactForm({ walletAddress, contact, onClose }: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '');
  const [type, setType] = useState<'individual' | 'group'>(contact?.type || 'individual');
  const [addresses, setAddresses] = useState<Array<{ address: string; label?: string }>>(
    contact?.addresses || [{ address: '', label: '' }]
  );

  const { mutate: createContact, isPending: isCreating } = useCreateContact();
  const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();

  const isPending = isCreating || isUpdating;

  const addAddress = () => {
    setAddresses([...addresses, { address: '', label: '' }]);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  const updateAddress = (index: number, field: 'address' | 'label', value: string) => {
    const updated = [...addresses];
    updated[index][field] = value;
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
      toast.error('Please enter valid Ethereum addresses (0x...)');
      return;
    }

    const data = {
      userId: walletAddress!,
      name: name.trim(),
      type,
      addresses: validAddresses,
    };

    if (contact) {
      // Update existing
      updateContact(
        { ...data, contactId: contact.id },
        {
          onSuccess: () => {
            toast.success('Contact updated');
            onClose();
          },
          onError: () => {
            toast.error('Failed to update contact');
          },
        }
      );
    } else {
      // Create new
      createContact(data, {
        onSuccess: () => {
          toast.success('Contact created');
          onClose();
        },
        onError: () => {
          toast.error('Failed to create contact');
        },
      });
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {contact ? 'Edit Contact' : 'Add Contact'}
        </h2>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Contact Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bob, Engineering Team"
            required
          />
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select value={type} onValueChange={(v: any) => setType(