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
                createdAt: row.contacts.createdAt!,
                updatedAt: row.contacts.updatedAt!,
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
        createdAt: results[0].contacts.createdAt!,
        updatedAt: results[0].contacts.updatedAt!,
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
        createdAt: results[0].contacts.createdAt!,
        updatedAt: results[0].contacts.updatedAt!,
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

// Update contact (name/type and optionally replace addresses)
export async function updateContact(
    contactId: string,
    data: {
        name?: string;
        type?: 'individual' | 'group';
        addresses?: Array<{ address: string; label?: string }>;
    }
): Promise<Contact> {
    await db.transaction(async (tx) => {
        // Update contact metadata
        if (data.name || data.type) {
            await tx
                .update(contacts)
                .set({
                    ...(data.name && { name: data.name }),
                    ...(data.type && { type: data.type }),
                    updatedAt: new Date(),
                })
                .where(eq(contacts.id, contactId));
        }

        // If addresses provided, replace all
        if (data.addresses) {
            await tx.delete(contactAddresses).where(eq(contactAddresses.contactId, contactId));

            for (const addr of data.addresses) {
                await tx.insert(contactAddresses).values({
                    id: generateId(),
                    contactId,
                    address: addr.address,
                    label: addr.label,
                    createdAt: new Date(),
                });
            }

            await tx
                .update(contacts)
                .set({ updatedAt: new Date() })
                .where(eq(contacts.id, contactId));
        }
    });

    return getContact(contactId) as Promise<Contact>;
}

// Delete contact (cascade deletes addresses)
export async function deleteContact(contactId: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, contactId));
}
