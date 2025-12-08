import { NextRequest, NextResponse } from 'next/server';
import { AwsS3Service } from '@/lib/services/aws-s3-service';

// POST /api/upload - Upload file to S3
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const key = formData.get('key') as string;

    if (!file || !bucket || !key) {
      return NextResponse.json(
        { error: 'File, bucket, and key are required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    await AwsS3Service.uploadFile(buffer, bucket, key, file.type);

    return NextResponse.json({
      success: true,
      key,
      bucket,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// GET /api/upload - Generate pre-signed URL for upload
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket');
    const key = searchParams.get('key');
    const contentType = searchParams.get('contentType');

    if (!bucket || !key || !contentType) {
      return NextResponse.json(
        { error: 'Bucket, key, and contentType are required' },
        { status: 400 }
      );
    }

    const uploadUrl = await AwsS3Service.generateUploadUrl(bucket, key, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
      bucket,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
