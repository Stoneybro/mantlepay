import { db } from "./db";
import { chats, messages } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { UIMessage } from "ai";

/**
 * Save or update a chat with its messages
 */
export async function saveChat({
    chatId,
    messages: newMessages,
    userId,
}: {
    chatId: string;
    messages: UIMessage[];
    userId?: string;
}): Promise<void> {
    try {
        // Check if chat exists
        const existingChat = await db
            .select()
            .from(chats)
            .where(eq(chats.id, chatId))
            .limit(1);

        // Create chat if it doesn't exist
        if (existingChat.length === 0) {
            // Extract title from first user message
            const firstUserMessage = newMessages.find((m) => m.role === "user");

            let title = "New Chat";
            if (firstUserMessage) {
                const messageAny = firstUserMessage as any;
                // Handle different content formats
                if (typeof messageAny.content === 'string') {
                    title = messageAny.content.slice(0, 50);
                } else if (Array.isArray(messageAny.content)) {
                    const textPart = messageAny.content.find((p: any) => p.type === 'text');
                    if (textPart && typeof textPart.text === 'string') {
                        title = textPart.text.slice(0, 50);
                    }
                }
            }

            await db.insert(chats).values({
                id: chatId,
                title,
                userId,
                createdAt: new Date(),
            });
        }

        // Upsert messages - using a transaction for consistency
        await db.transaction(async (tx) => {
            for (const m of newMessages) {
                const existingMessage = await tx
                    .select()
                    .from(messages)
                    .where(eq(messages.id, m.id))
                    .limit(1);

                if (existingMessage.length > 0) {
                    // Update existing message
                    await tx
                        .update(messages)
                        .set({
                            content: m as any, // Store full UIMessage
                        })
                        .where(eq(messages.id, m.id));
                } else {
                    // Insert new message
                    await tx.insert(messages).values({
                        id: m.id,
                        chatId,
                        role: m.role,
                        content: m as any, // Store full UIMessage
                        createdAt: new Date(),
                    });
                }
            }
        });

        console.log(`✅ Saved ${newMessages.length} messages for chat ${chatId}`);
    } catch (error) {
        console.error("❌ Error saving chat:", error);
        throw error;
    }
}

/**
 * Load all messages for a chat
 */
export async function loadChat(id: string): Promise<UIMessage[]> {
    try {
        const storedMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.chatId, id))
            .orderBy(messages.createdAt);

        return storedMessages.map((m) => m.content as UIMessage);
    } catch (error) {
        console.error("❌ Error loading chat:", error);
        // Return empty array instead of throwing to handle new chats gracefully
        return [];
    }
}

/**
 * Get all chats for a user
 */
export async function getChats(userId?: string) {
    try {
        if (!userId) return [];

        const userChats = await db
            .select()
            .from(chats)
            .where(eq(chats.userId, userId))
            .orderBy(desc(chats.createdAt));

        return userChats;
    } catch (error) {
        console.error("❌ Error getting chats:", error);
        return [];
    }
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(chatId: string): Promise<void> {
    try {
        await db.transaction(async (tx) => {
            // Delete all messages first
            await tx
                .delete(messages)
                .where(eq(messages.chatId, chatId));

            // Then delete the chat
            await tx
                .delete(chats)
                .where(eq(chats.id, chatId));
        });

        console.log(`✅ Deleted chat ${chatId}`);
    } catch (error) {
        console.error("❌ Error deleting chat:", error);
        throw error;
    }
}

/**
 * Update chat title
 */
export async function updateChatTitle(chatId: string, title: string): Promise<void> {
    try {
        await db
            .update(chats)
            .set({ title })
            .where(eq(chats.id, chatId));

        console.log(`✅ Updated title for chat ${chatId}`);
    } catch (error) {
        console.error("❌ Error updating chat title:", error);
        throw error;
    }
}