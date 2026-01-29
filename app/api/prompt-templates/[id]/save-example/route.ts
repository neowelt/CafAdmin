import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// PUT /api/prompt-templates/[id]/save-example - Save example images
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const template = await ExternalApiClient.savePromptExample(id, formData);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error saving prompt example:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt example' },
      { status: 500 }
    );
  }
}
