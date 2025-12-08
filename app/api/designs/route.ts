import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/designs - Get all designs from external API
export async function GET() {
  try {
    const designs = await ExternalApiClient.fetchDesigns();
    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}

// POST /api/designs - Create a new design
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const design = await ExternalApiClient.createDesign(body);
    return NextResponse.json(design, { status: 201 });
  } catch (error) {
    console.error('Error creating design:', error);
    return NextResponse.json(
      { error: 'Failed to create design' },
      { status: 500 }
    );
  }
}
