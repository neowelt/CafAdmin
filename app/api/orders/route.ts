import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';
import { AwsS3Service } from '@/lib/services/aws-s3-service';

// GET /api/orders - Get all orders with optional filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('dateFilter');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    // Calculate skip based on page
    const skip = (page - 1) * pageSize;

    // Fetch with larger limit to apply filters client-side
    // This is not ideal but necessary until backend supports filter parameters
    const response = await ExternalApiClient.fetchOrders(0, 1000);
    let orders = response.items || [];
    const totalInDB = response.total || 0;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      orders = orders.filter((order: any) => {
        return (
          order.userEmail?.toLowerCase().includes(searchLower) ||
          order.artist.toLowerCase().includes(searchLower) ||
          order.title.toLowerCase().includes(searchLower) ||
          order.templateName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (status && status !== 'all') {
      orders = orders.filter((order: any) => order.status === status);
    }

    // Apply date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      orders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate;
      });
    }

    // Get total after filtering
    const totalFiltered = orders.length;

    // Apply pagination
    const paginatedOrders = orders.slice(skip, skip + pageSize);

    // Generate pre-signed URLs for previews and designs
    const ordersWithUrls = await Promise.all(
      paginatedOrders.map(async (order: any) => {
        const orderObj: any = { ...order };

        if (order.preview) {
          try {
            orderObj.previewUrl = await AwsS3Service.getOrderPreviewUrl(order.preview);
          } catch (error) {
            console.error(`Error generating preview URL for order ${order._id}:`, error);
          }
        }

        if (order.design) {
          try {
            orderObj.designUrl = await AwsS3Service.getOrderDesignUrl(order.design);
          } catch (error) {
            console.error(`Error generating design URL for order ${order._id}:`, error);
          }
        }

        return orderObj;
      })
    );

    return NextResponse.json({
      items: ordersWithUrls,
      total: totalFiltered,
      page,
      pageSize,
      totalPages: Math.ceil(totalFiltered / pageSize),
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
