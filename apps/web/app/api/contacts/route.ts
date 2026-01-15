import { NextRequest, NextResponse } from "next/server";
import { getContacts, createContact } from "@/lib/contact-store";

// Retry helper for database operations (handles Neon cold starts)
async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2,
    delayMs: number = 500
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}

// GET /api/contacts?userId=xxx - List all contacts for user
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
        return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
        );
    }

    try {
        const contacts = await withRetry(() => getContacts(userId));
        return NextResponse.json({ contacts }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch contacts:", error);
        return NextResponse.json(
            { error: "Failed to fetch contacts" },
            { status: 500 }
        );
    }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, name, type, addresses } = body;

        if (!userId || !name || !type || !addresses) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const contact = await withRetry(() => createContact(userId, name, type, addresses));
        return NextResponse.json({ contact }, { status: 201 });
    } catch (error) {
        console.error("Failed to create contact:", error);
        return NextResponse.json(
            { error: "Failed to create contact" },
            { status: 500 }
        );
    }
}
