import { NextRequest, NextResponse } from "next/server";
import { loadChat, deleteChat } from "@/lib/chat-store";

// GET /api/chat/[chatId] - Load specific chat
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params; // Next.js 15: params is async!

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    const messages = await loadChat(chatId);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error("❌ GET chat error:", error);
    return NextResponse.json(
      { error: "Failed to load chat" },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/[chatId] - Delete specific chat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required" },
        { status: 400 }
      );
    }

    await deleteChat(chatId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE chat error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}