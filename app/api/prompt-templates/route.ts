import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/prompt-templates - Get all prompt templates
export async function GET() {
  try {
    const templates = await ExternalApiClient.fetchPromptTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt templates' },
      { status: 500 }
    );
  }
}

// POST /api/prompt-templates - Create a new prompt template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const template = await ExternalApiClient.createPromptTemplate(body);
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating prompt template:', error);
    return NextResponse.json(
      { error: 'Failed to create prompt template' },
      { status: 500 }
    );
  }
}
