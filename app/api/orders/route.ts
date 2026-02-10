import { NextRequest, NextResponse } from 'next/server';
import { ExternalApiClient } from '@/lib/services/api-client';
import { AwsS3Service } from '@/lib/services/aws-s3-service';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const response = await ExternalApiClient.fetchOrders(0, 1000);
    const orders = response.items || [];

    // Generate pre-signed URLs for previews and designs
    const ordersWithUrls = await Promise.all(
      orders.map(async (order: any) => {
        const orderObj: any = {
          ...order,
          _id: String(order._id) // Ensure _id is always a string
        };

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
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
