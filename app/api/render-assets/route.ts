import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';

// GET /api/render-assets - Get all render assets
export async function GET() {
  try {
    const assets = await ExternalApiClient.fetchRenderAssets();
    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching render assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch render assets' },
      { status: 500 }
    );
  }
}

// POST /api/render-assets - Create a new render asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const asset = await ExternalApiClient.createRenderAsset(body);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating render asset:', error);
    return NextResponse.json(
      { error: 'Failed to create render asset' },
      { status: 500 }
    );
  }
}

// PUT /api/render-assets - Upsert a render asset (create or update by key)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const asset = await ExternalApiClient.upsertRenderAsset(body);
    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error upserting render asset:', error);
    return NextResponse.json(
      { error: 'Failed to upsert render asset' },
      { status: 500 }
    );
  }
}
