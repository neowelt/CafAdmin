import { NextRequest, NextResponse } from "next/server";
import { ExternalApiClient } from "@/lib/services/api-client";

// GET /api/partners - List all partners
export async function GET() {
  try {
    const partners = await ExternalApiClient.fetchPartners();
    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// POST /api/partners - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const partner = await ExternalApiClient.createPartner(body);
    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 }
    );
  }
}
