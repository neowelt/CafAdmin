import { NextRequest, NextResponse } from "next/server";
import { CloudFrontClient, CreateInvalidationCommand } from "@aws-sdk/client-cloudfront";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || "";

// Initialize CloudFront client
// Uses IAM role when running on AWS (no credentials provided)
// Falls back to access keys for local development
const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION || "eu-north-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Use default credential chain (IAM role on AWS)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paths } = body;

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: "Invalid paths array" },
        { status: 400 }
      );
    }

    if (!CLOUDFRONT_DISTRIBUTION_ID) {
      return NextResponse.json(
        { error: "CloudFront distribution ID not configured" },
        { status: 500 }
      );
    }

    // Ensure paths start with /
    const formattedPaths = paths.map(path => path.startsWith('/') ? path : `/${path}`);

    console.log("Creating CloudFront invalidation:", { distributionId: CLOUDFRONT_DISTRIBUTION_ID, paths: formattedPaths });

    // Create CloudFront invalidation
    const invalidationResult = await cloudFrontClient.send(new CreateInvalidationCommand({
      DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `admin-${Date.now()}`,
        Paths: {
          Quantity: formattedPaths.length,
          Items: formattedPaths,
        },
      },
    }));

    console.log("Invalidation created:", invalidationResult.Invalidation?.Id);

    return NextResponse.json({
      success: true,
      paths: formattedPaths,
      distribution_id: CLOUDFRONT_DISTRIBUTION_ID,
      invalidation_id: invalidationResult.Invalidation?.Id,
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
