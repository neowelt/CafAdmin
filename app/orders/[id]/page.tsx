"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CheckCircle, XCircle, Eye, Download } from "lucide-react";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.status === 404) {
        toast.error("Order not found");
        router.push("/orders");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch order");
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

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

  const handlePreview = async () => {
    if (!order?.preview) return;

    setLoadingPreview(true);
    try {
      const response = await fetch("/api/files/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: "caforders",
          key: order.preview,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate preview URL");
      }

      const data = await response.json();
      setPreviewUrl(data.url);
      setShowPreviewDialog(true);
    } catch (error) {
      console.error("Error loading preview:", error);
      toast.error("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    if (!order?.design) return;

    setLoadingDownload(true);
    try {
      const response = await fetch("/api/files/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: "caforders",
          key: order.design,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate download URL");
      }

      const data = await response.json();

      // Trigger download using a temporary anchor element
      const link = document.createElement("a");
      link.href = data.url;
      link.download = order.design.split("/").pop() || "design";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    } finally {
      setLoadingDownload(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Button asChild>
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              {String(order._id)}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-lg px-4 py-1">
            {order.status}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              {order.updatedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Updated Date</p>
                  <p className="font-medium">{formatDate(order.updatedAt)}</p>
                </div>
              )}
              {order.expiresAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Expires At</p>
                  <p className="font-medium">{formatDate(order.expiresAt)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium text-lg">${order.price.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-medium font-mono text-sm">{order.userId}</p>
              </div>
              {order.userEmail && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{order.userEmail}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Design Details */}
        <Card>
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Template Name</p>
                <p className="font-medium">{order.templateName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Style Name</p>
                <p className="font-medium">{order.styleName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Template ID</p>
                <p className="font-medium font-mono text-sm">{order.templateId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">User Design ID</p>
                <p className="font-medium font-mono text-sm">{order.userDesignId}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Artist</p>
                <p className="font-medium">{order.artist}</p>
              </div>
              {order.featuredArtist && (
                <div>
                  <p className="text-sm text-muted-foreground">Featured Artist</p>
                  <p className="font-medium">{order.featuredArtist}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{order.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parental Advisory</p>
                <div className="flex items-center gap-2">
                  {order.parental ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Yes</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-muted-foreground">No</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge variant={getStatusBadgeVariant(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Status</p>
                <Badge variant={getStatusBadgeVariant(order.orderStatus)}>
                  {order.orderStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification Status</p>
                <p className="font-medium">{order.verificationStatus}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-medium font-mono text-sm">{order.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Transaction ID</p>
                <p className="font-medium font-mono text-sm">{order.originalTransactionId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Apple Product ID</p>
                <p className="font-medium font-mono text-sm">{order.appleProductId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Files */}
        {(order.preview || order.design) && (
          <Card>
            <CardHeader>
              <CardTitle>Design Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {order.preview && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Preview</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePreview}
                        disabled={loadingPreview}
                      >
                        {loadingPreview ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {order.preview}
                    </p>
                  </div>
                )}
                {order.design && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Design</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDownload}
                        disabled={loadingDownload}
                      >
                        {loadingDownload ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {order.design}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Design Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {previewUrl && (
              <Image
                src={previewUrl}
                alt="Order design preview"
                width={800}
                height={800}
                className="max-w-full h-auto rounded-lg"
                unoptimized
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
