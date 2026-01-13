import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    title: text("title"),
    userId: text("user_id"),
});

export const messages = pgTable("messages", {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
        .references(() => chats.id)
        .notNull(),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'individual' or 'group'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact addresses (one-to-many with contacts)
export const contactAddresses = pgTable("contact_addresses", {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
        .references(() => contacts.id, { onDelete: "cascade" })
        .notNull(),
    address: text("address").notNull(),
    label: text("label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
