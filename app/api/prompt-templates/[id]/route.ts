import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/prompt-templates/[id] - Get a single prompt template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await ExternalApiClient.fetchPromptTemplateById(id);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt template' },
      { status: 500 }
    );
  }
}

// PUT /api/prompt-templates/[id] - Update a prompt template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const template = await ExternalApiClient.updatePromptTemplate(id, body);
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt template' },
      { status: 500 }
    );
  }
}

// DELETE /api/prompt-templates/[id] - Delete a prompt template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await ExternalApiClient.deletePromptTemplate(id);
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Error deleting prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt template' },
      { status: 500 }
    );
  }
}
