import { NextRequest, NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ADMIN_API_BASE_URL = process.env.ADMIN_API_BASE_URL || "";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const bucket = formData.get("bucket");
    const key = formData.get("key");
    const contentType = formData.get("content_type");

    console.log("File upload request:", { bucket, key, contentType, hasApiUrl: !!ADMIN_API_BASE_URL, hasApiKey: !!ADMIN_API_KEY });

    if (!ADMIN_API_BASE_URL || !ADMIN_API_KEY) {
      console.error("Missing environment variables:", { hasApiUrl: !!ADMIN_API_BASE_URL, hasApiKey: !!ADMIN_API_KEY });
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Forward to admin API
    const apiUrl = `${ADMIN_API_BASE_URL}/admin/files/upload`;
    console.log("Forwarding to:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-api-key": ADMIN_API_KEY,
      },
      body: formData,
    });

    console.log("Admin API response:", response.status, response.statusText);

    if (!response.ok) {
      const error = await response.text();
      console.error("Admin API error:", error);
      throw new Error(`Upload failed: ${error}`);
    }

    const data = await response.json();
    console.log("Upload successful:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
