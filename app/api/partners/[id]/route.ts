import { NextRequest, NextResponse } from "next/server";
import { ExternalApiClient } from "@/lib/services/api-client";

// GET /api/partners/:id - Get a partner by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const partner = await ExternalApiClient.fetchPartnerById(id);

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}

// PUT /api/partners/:id - Update a partner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const partner = await ExternalApiClient.updatePartner(id, body);

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      { error: "Failed to update partner" },
      { status: 500 }
    );
  }
}

// DELETE /api/partners/:id - Delete a partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await ExternalApiClient.deletePartner(id);

    if (!result) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Partner deleted successfully" });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Failed to delete partner" },
      { status: 500 }
    );
  }
}
