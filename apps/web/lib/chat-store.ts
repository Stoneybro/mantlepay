import { db } from "./db";
import { chats, messages } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { UIMessage } from "ai";

export async function saveChat({
    chatId,
    messages: newMessages,
    userId,
}: {
    chatId: string;
    messages: UIMessage[];
    userId?: string;
}): Promise<void> {
    const existingChat = await db
        .select()
        .from(chats)
        .where(eq(chats.id, chatId))
        .limit(1);

    if (existingChat.length === 0) {
        // Determine title from first user message
        const firstUserMessage = newMessages.find((m) => m.role === "user");
        const title = firstUserMessage
            ? (firstUserMessage as any).content.slice(0, 50)
            : "New Chat";

        await db.insert(chats).values({
            id: chatId,
            title,
            userId,
            createdAt: new Date(),
        });
    }

    // Upsert messages
    for (const m of newMessages) {
        await db
            .insert(messages)
            .values({
                id: m.id,
                chatId,
                role: m.role,
                content: m,
                createdAt: (m as any).createdAt ? new Date((m as any).createdAt) : new Date(),
            })
            .onConflictDoNothing();
    }
}

export async function loadChat(id: string): Promise<UIMessage[]> {
    const storedMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, id))
        .orderBy(messages.createdAt);

    return storedMessages.map((m) => m.content as UIMessage);
}

export async function getChats(userId?: string) {
    if (!userId) return [];

    return await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.createdAt));
}
