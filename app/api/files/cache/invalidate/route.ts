import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || "";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to admin API
    const response = await fetch(`${ADMIN_API_BASE_URL}/admin/files/cache/invalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ADMIN_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cache invalidation failed: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
