import { NextRequest, NextResponse } from 'next/server';

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
      return NextResponse.json(
        { error: 'Admin API configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(`${adminApiBaseUrl}/admin/orders/${id}`, {
      headers: {
        'x-api-key': adminApiKey,
      },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      throw new Error(`Admin API returned ${response.status}`);
    }

    const order = await response.json();
    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
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
