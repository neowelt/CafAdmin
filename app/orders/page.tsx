"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Order, Partner } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Search, CheckCircle } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [affiliateFilter, setAffiliateFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Fetch all data once on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersRes, partnersRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/partners"),
        ]);

        if (!ordersRes.ok) throw new Error("Failed to fetch orders");
        const ordersData = await ordersRes.json();
        setAllOrders(ordersData.items || []);

        if (partnersRes.ok) {
          const partnersData = await partnersRes.json();
          setPartners(partnersData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Client-side filtering
  useEffect(() => {
    let result = [...allOrders];

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.userEmail?.toLowerCase().includes(searchLower) ||
          order.artist.toLowerCase().includes(searchLower) ||
          order.title.toLowerCase().includes(searchLower) ||
          order.templateName.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "lastweek":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "lastmonth":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate;
      });
    }

    // Affiliate filter
    if (affiliateFilter !== "all") {
      if (affiliateFilter === "app") {
        result = result.filter((order) => order.affiliate_id == null);
      } else {
        result = result.filter((order) => order.affiliate_id === affiliateFilter);
      }
    }

    setFilteredOrders(result);
  }, [allOrders, searchQuery, statusFilter, dateFilter, affiliateFilter]);

  const formatDate = (dateString: Date | string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadgeVariant = (
    status: string
  ): "default" | "secondary" | "destructive" => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "completed") return "default";
    if (lowerStatus === "pending") return "secondary";
    return "destructive";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, artist, title, or template name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="lastweek">Last Week</SelectItem>
            <SelectItem value="lastmonth">Last Month</SelectItem>
          </SelectContent>
        </Select>

        <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Affiliate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Affiliates</SelectItem>
            <SelectItem value="app">App</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p.partnerId} value={p.partnerId}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || dateFilter !== "all" || affiliateFilter !== "all"
                ? "No orders match your search criteria."
                : "No orders found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg text-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Created Date</TableHead>
                <TableHead className="text-xs">User Email</TableHead>
                <TableHead className="text-xs">Template Name</TableHead>
                <TableHead className="text-xs">Style Name</TableHead>
                <TableHead className="text-xs">Artist</TableHead>
                <TableHead className="text-xs">Title</TableHead>
                <TableHead className="text-xs">Parental</TableHead>
                <TableHead className="text-xs">Affiliate</TableHead>
                <TableHead className="text-xs">Price</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const orderId = String(order._id);
                return (
                  <TableRow
                    key={orderId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      router.push(`/orders/${orderId}`);
                    }}
                  >
                    <TableCell>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      {order.userEmail || "N/A"}
                    </TableCell>
                    <TableCell className="font-medium">{order.templateName}</TableCell>
                    <TableCell>{order.styleName}</TableCell>
                    <TableCell>{order.artist}</TableCell>
                    <TableCell>{order.title}</TableCell>
                    <TableCell>
                      {order.parental ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.affiliate_id ?? "App"}
                    </TableCell>
                    <TableCell>
                      ${order.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs" variant={getStatusBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
