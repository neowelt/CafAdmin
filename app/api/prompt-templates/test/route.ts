import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// POST /api/prompt-templates/test - Test a prompt with S3 image keys
export async function POST(request: NextRequest) {
  try {
    const { prompt, imageKeys } = await request.json();

    if (!prompt || !imageKeys || !Array.isArray(imageKeys) || imageKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Prompt and at least one image are required' },
        { status: 400 }
      );
    }

    // Forward JSON payload directly to backend API
    // Backend will fetch images from S3 using the keys
    const result = await ExternalApiClient.testPrompt({ prompt, imageKeys });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing prompt:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test prompt'
      },
      { status: 500 }
    );
  }
}
