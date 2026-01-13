import { NextRequest, NextResponse } from "next/server";
import { getContact, updateContact, deleteContact } from "@/lib/contact-store";

// GET /api/contacts/[contactId]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        const contact = await getContact(contactId);

        if (!contact) {
            return NextResponse.json(
                { error: "Contact not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ contact }, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch contact:", error);
        return NextResponse.json(
            { error: "Failed to fetch contact" },
            { status: 500 }
        );
    }
}

// PUT /api/contacts/[contactId]
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        const body = await request.json();

        const contact = await updateContact(contactId, body);
        return NextResponse.json({ contact }, { status: 200 });
    } catch (error) {
        console.error("Failed to update contact:", error);
        return NextResponse.json(
            { error: "Failed to update contact" },
            { status: 500 }
        );
    }
}

// DELETE /api/contacts/[contactId]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const { contactId } = await params;
        await deleteContact(contactId);

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete contact:", error);
        return NextResponse.json(
            { error: "Failed to delete contact" },
            { status: 500 }
        );
    }
}
