import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/collections - Get all collections from external API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const collections = await ExternalApiClient.fetchCollections(includeInactive);
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection
// Note: You'll need to provide the endpoint for creating collections
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Replace with actual endpoint when available
    return NextResponse.json(
      { error: 'Create collection endpoint not yet implemented. Please provide the Lambda endpoint for creating collections.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

// PATCH /api/collections - Update multiple collection positions
// Note: You'll need to provide the endpoint for updating positions
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Replace with actual endpoint when available
    return NextResponse.json(
      { error: 'Update positions endpoint not yet implemented. Please provide the Lambda endpoint for updating collection positions.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating collection positions:', error);
    return NextResponse.json(
      { error: 'Failed to update positions' },
      { status: 500 }
    );
  }
}
