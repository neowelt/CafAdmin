import { NextRequest, NextResponse } from "next/server";

const adminApiBaseUrl = process.env.ADMIN_API_BASE_URL;
const adminApiKey = process.env.ADMIN_API_KEY;

if (!adminApiBaseUrl || !adminApiKey) {
  throw new Error("Missing required environment variables: ADMIN_API_BASE_URL or ADMIN_API_KEY");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch all orders for this partner from the backend
    const response = await fetch(`${adminApiBaseUrl}/admin/orders?skip=0&limit=10000`, {
      headers: {
        "x-api-key": adminApiKey,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders from external API");
    }

    const data = await response.json();
    const orders = data.items || [];

    // Filter orders for this partner with live Stripe sessions
    const partnerOrders = orders.filter(
      (order: any) =>
        order.affiliate_id === id &&
        order.stripeSessionId &&
        order.stripeSessionId.startsWith("cs_live_") &&
        order.status === "completed"
    );

    // Group by month and calculate totals
    const monthlySales: { [key: string]: { year: number; month: number; totalSales: number; orderCount: number } } = {};

    partnerOrders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const key = `${year}-${month.toString().padStart(2, "0")}`;

      if (!monthlySales[key]) {
        monthlySales[key] = {
          year,
          month,
          totalSales: 0,
          orderCount: 0,
        };
      }

      // Ensure price is a number - use Number() for explicit conversion
      const price = Number(order.price) || 0;
      monthlySales[key].totalSales = Number(monthlySales[key].totalSales) + price;
      monthlySales[key].orderCount += 1;
    });

    // Convert to array and sort by date (newest first)
    const salesSummary = Object.keys(monthlySales)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const data = monthlySales[key];
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        return {
          ...data,
          monthName: `${monthNames[data.month - 1]} ${data.year}`,
        };
      });

    // Calculate total
    const totalSales = salesSummary.reduce((sum, month) => sum + month.totalSales, 0);
    const totalOrders = salesSummary.reduce((sum, month) => sum + month.orderCount, 0);

    return NextResponse.json({
      partnerId: id,
      monthlySales: salesSummary,
      totalSales,
      totalOrders,
    });
  } catch (error) {
    console.error("Error fetching partner sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner sales" },
      { status: 500 }
    );
  }
}
