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
        const existingMessage = await db
            .select()
            .from(messages)
            .where(eq(messages.id, m.id))
            .limit(1);

        if (existingMessage.length > 0) {
            await db
                .update(messages)
                .set({
                    content: m,
                })
                .where(eq(messages.id, m.id));
        } else {
            await db.insert(messages).values({
                id: m.id,
                chatId,
                role: m.role,
                content: m,
                createdAt: (m as any).createdAt ? new Date((m as any).createdAt) : new Date(),
            });
        }
    }
}

export async function loadChat(id: string): Promise<UIMessage[]> {
    try {
        const storedMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, id))
            .orderBy(messages.createdAt);

        return storedMessages.map((m) => m.content as UIMessage);
    } catch (error) {
        console.error("DEBUG: loadChat failed:", error);
        if (error && typeof error === 'object' && 'cause' in error) {
            console.error("DEBUG: loadChat error cause:", (error as any).cause);
        }
        throw error;
    }
}

export async function getChats(userId?: string) {
    if (!userId) return [];

    return await db
        .select()
        .from(chats)
        .where(eq(chats.userId, userId))
        .orderBy(desc(chats.createdAt));
}
