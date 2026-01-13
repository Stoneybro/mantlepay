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

    try {
        const contacts = await getContacts(userId);
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

        const contact = await createContact(userId, name, type, addresses);
        return NextResponse.json({ contact }, { status: 201 });
    } catch (error) {
        console.error("Failed to create contact:", error);
        return NextResponse.json(
            { error: "Failed to create contact" },
            { status: 500 }
        );
    }
}
