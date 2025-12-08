import { NextRequest, NextResponse } from "next/server";

const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || "";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward to admin API
    const response = await fetch(`${ADMIN_API_BASE_URL}/admin/files/upload`, {
      method: "POST",
      headers: {
        "x-api-key": ADMIN_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
