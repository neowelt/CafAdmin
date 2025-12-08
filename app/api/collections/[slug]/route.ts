import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/collections/:slug - Get collection with designs from external API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const collection = await ExternalApiClient.fetchCollectionWithDesigns(slug);

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// PUT /api/collections/:slug - Update collection designs
// Note: You'll need to provide the endpoint for updating collection designs
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // TODO: Replace with actual endpoint when available
    return NextResponse.json(
      { error: 'Update collection designs endpoint not yet implemented. Please provide the Lambda endpoint.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating collection designs:', error);
    return NextResponse.json(
      { error: 'Failed to update collection designs' },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/:slug - Delete collection
// Note: You'll need to provide the endpoint for deleting collections
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // TODO: Replace with actual endpoint when available
    return NextResponse.json(
      { error: 'Delete collection endpoint not yet implemented. Please provide the Lambda endpoint.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}

// PATCH /api/collections/:slug - Toggle active status
// Note: You'll need to provide the endpoint for toggling collection status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // TODO: Replace with actual endpoint when available
    return NextResponse.json(
      { error: 'Toggle collection status endpoint not yet implemented. Please provide the Lambda endpoint.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Error updating collection status:', error);
    return NextResponse.json(
      { error: 'Failed to update collection status' },
      { status: 500 }
    );
  }
}
