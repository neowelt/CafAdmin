import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

interface RouteParams {
  params: Promise<{
    key: string;
  }>;
}

// GET /api/render-assets/[key] - Get a render asset by key
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const asset = await ExternalApiClient.fetchRenderAssetByKey(decodedKey);

    if (!asset) {
      return NextResponse.json(
        { error: 'Render asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error fetching render asset:', error);
    return NextResponse.json(
      { error: 'Failed to fetch render asset' },
      { status: 500 }
    );
  }
}

// PUT /api/render-assets/[key] - Update a render asset by key
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    const body = await request.json();
    const asset = await ExternalApiClient.updateRenderAsset(decodedKey, body);
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating render asset:', error);
    return NextResponse.json(
      { error: 'Failed to update render asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/render-assets/[key] - Delete a render asset by key
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { key } = await params;
    const decodedKey = decodeURIComponent(key);
    await ExternalApiClient.deleteRenderAsset(decodedKey);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting render asset:', error);
    return NextResponse.json(
      { error: 'Failed to delete render asset' },
      { status: 500 }
    );
  }
}
