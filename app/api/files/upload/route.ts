import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const key = formData.get("key") as string | null;
    const contentType = formData.get("content_type") as string | null;

    console.log("File upload request:", { bucket, key, contentType, fileName: file?.name, fileType: file?.type });

    // Validate required fields
    if (!file || !bucket || !key) {
      return NextResponse.json(
        { error: "Missing required fields: file, bucket, or key" },
        { status: 400 }
      );
    }

    // Determine content type - prefer explicit contentType, fallback to file.type
    const finalContentType = contentType || file.type || "application/octet-stream";

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Uploading to S3:", { bucket, key, contentType: finalContentType, size: buffer.length });

    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
      ServerSideEncryption: "AES256",
    }));

    console.log("Upload successful:", { bucket, key, size: buffer.length });

    return NextResponse.json({
      success: true,
      bucket,
      key,
      size: buffer.length,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
