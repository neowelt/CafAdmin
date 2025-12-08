import { ObjectId } from "mongodb";

export interface Order {
  _id?: ObjectId | string;
  userId: string;
  userEmail?: string | null;
  templateId: string;
  templateName: string;
  styleName: string;
  artist: string;
  featuredArtist?: string | null;
  title: string;
  parental: boolean;
  userDesignId: string;
  price: number;
  status: string;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  updatedAt?: Date | null;
  expiresAt?: Date | null;
  paymentMethod: string;
  transactionId: string;
  originalTransactionId: string;
  verificationStatus: string;
  appleProductId: string;
  preview?: string | null;
  design?: string | null;
  affiliate_id?: string | null;
  stripeSessionId?: string | null;
  paymentProvider?: string | null;
  currency?: string | null;
}

// Monthly sales summary
export interface MonthlySales {
  year: number;
  month: number;
  monthName: string;
  totalSales: number;
  orderCount: number;
}

// Filter types for orders
export interface OrderFilters {
  search?: string;
  status?: string;
  dateFilter?: 'today' | 'week' | 'month' | 'all';
}
