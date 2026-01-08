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
