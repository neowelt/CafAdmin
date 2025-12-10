import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Force Node.js runtime for presigned URL generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize S3 client with IAM role authentication
const s3Client = new S3Client({
  region: process.env.APP_AWS_REGION || "eu-north-1",
});

// Default bucket for uploads
const DEFAULT_BUCKET = process.env.S3_UPLOADS_BUCKET || "coverartbucket";

/**
 * Generate a presigned URL for direct S3 uploads
 *
 * Query Parameters:
 * - fileName: The name of the file to upload (required)
 * - contentType: MIME type of the file (required)
 * - bucket: Optional bucket name (defaults to coverartbucket)
 *
 * Returns:
 * - uploadUrl: Presigned URL for PUT request
 * - fileUrl: Public URL of the file after upload
 * - key: S3 object key
 * - bucket: Bucket name
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    const contentType = searchParams.get("contentType");
    const bucket = searchParams.get("bucket") || DEFAULT_BUCKET;

    // Validate required parameters
    if (!fileName) {
      return NextResponse.json(
        { error: "Missing required parameter: fileName" },
        { status: 400 }
      );
    }

    if (!contentType) {
      return NextResponse.json(
        { error: "Missing required parameter: contentType" },
        { status: 400 }
      );
    }

    // Generate S3 key with uploads/ prefix
    const key = `uploads/${fileName}`;

    console.log("Generating presigned URL:", { bucket, key, contentType });

    // Create the PutObject command
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL (valid for 1 hour)
    // This is plenty of time even for very large files with slow connections
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600
    });

    // Construct the public file URL
    // Note: If using CloudFront, you may want to use the CloudFront URL instead
    const fileUrl = `https://${bucket}.s3.${process.env.APP_AWS_REGION || "eu-north-1"}.amazonaws.com/${key}`;

    console.log("Presigned URL generated successfully");

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
      key,
      bucket,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate presigned URL",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
