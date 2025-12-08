import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevents static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/orders/:id - Get a single order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const adminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiBaseUrl || !adminApiKey) {
      console.error('Environment variables missing:', {
        hasBaseUrl: !!adminApiBaseUrl,
        hasApiKey: !!adminApiKey,
        env: process.env.NODE_ENV,
      });
      return NextResponse.json(
        { error: 'Admin API configuration missing' },
        { status: 500 }
      );
    }

    const url = `${adminApiBaseUrl}/admin/orders/${id}`;
    console.log('Fetching order from:', url);

    const response = await fetch(url, {
      headers: {
        'x-api-key': adminApiKey,
      },
      cache: 'no-store',
    });

    console.log('Admin API response status:', response.status);

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error('Admin API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Admin API returned ${response.status}: ${errorText}`);
    }

    const order = await response.json();
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/orders/:id/complete - Complete an order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Call the Admin API to complete the order
    const adminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
    const adminApiKey = process.env.ADMIN_API_KEY;

    if (!adminApiBaseUrl || !adminApiKey) {
      return NextResponse.json(
        { error: 'Admin API configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${adminApiBaseUrl}/orders/admin/${id}/complete`, {
      method: 'POST',
      headers: {
        'x-api-key': adminApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Admin API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to complete order via Admin API' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error completing order:', error);
    return NextResponse.json(
      { error: 'Failed to complete order' },
      { status: 500 }
    );
  }
}
