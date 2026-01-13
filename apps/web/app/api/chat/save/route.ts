import { NextRequest, NextResponse } from "next/server";
import { saveChat } from "@/lib/chat-store";

// POST /api/chat/save - Save chat messages
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { chatId, messages, userId } = body;

        if (!chatId || !messages) {
            return NextResponse.json(
                { error: "chatId and messages are required" },
                { status: 400 }
            );
        }

        await saveChat({
            chatId,
            messages,
            userId
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to save chat:", error);
        return NextResponse.json(
            { error: "Failed to save chat" },
            { status: 500 }
        );
    }
}
