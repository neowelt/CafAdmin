import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize S3 client
// Uses IAM role when running on AWS (no credentials provided)
// Falls back to access keys for local development
const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "eu-north-1",
  credentials: process.env.APP_AWS_ACCESS_KEY_ID && process.env.APP_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Use default credential chain (IAM role on AWS)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bucket, key } = body;

    if (!bucket || !key) {
      return NextResponse.json(
        { error: "Missing required fields: bucket or key" },
        { status: 400 }
      );
    }

    console.log("Generating download URL:", { bucket, key });

    // Generate presigned URL for download (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log("Download URL generated successfully");

    return NextResponse.json({
      success: true,
      url,
      bucket,
      key,
    });
  } catch (error) {
    console.error("Error generating download URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate download URL" },
      { status: 500 }
    );
  }
}
