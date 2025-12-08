"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Trash2, X, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { Partner, PartnerColors } from "@/lib/types";
import { OklchColorPicker } from "@/components/ui/oklch-color-picker";

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Domain input
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    if (partnerId) {
      fetchPartner();
    }
  }, [partnerId]);

  const fetchPartner = async () => {
    try {
      const response = await fetch(`/api/partners/${partnerId}`);
      if (!response.ok) throw new Error("Failed to fetch partner");
      const data = await response.json();
      setPartner(data);
    } catch (error) {
      console.error("Error fetching partner:", error);
      toast.error("Failed to load partner");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!partner) return;
    const { name, value } = e.target;

    if (name === "revenueShare") {
      // Convert percentage input to float (0-1)
      const percentage = parseFloat(value);
      if (!isNaN(percentage)) {
        setPartner((prev) => {
          if (!prev) return prev;
          return { ...prev, revenueShare: percentage / 100 };
        });
      }
    } else {
      setPartner((prev) => {
        if (!prev) return prev;
        return { ...prev, [name]: value };
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!partner) return;
    setPartner((prev) => {
      if (!prev) return prev;
      return { ...prev, [name]: checked };
    });
  };

  const handleColorChange = (colorKey: keyof PartnerColors, value: string) => {
    if (!partner) return;
    setPartner((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        colors: {
          ...prev.colors,
          [colorKey]: value,
        },
      };
    });
  };

  const handleAddDomain = () => {
    if (!partner || !newDomain.trim()) return;

    const trimmedDomain = newDomain.trim();
    if (partner.allowedDomains.includes(trimmedDomain)) {
      toast.error("Domain already exists");
      return;
    }

    setPartner((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allowedDomains: [...prev.allowedDomains, trimmedDomain],
      };
    });
    setNewDomain("");
  };

  const handleRemoveDomain = (index: number) => {
    if (!partner) return;
    setPartner((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        allowedDomains: prev.allowedDomains.filter((_, i) => i !== index),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner),
      });

      if (!response.ok) throw new Error("Failed to update partner");
      toast.success("Partner updated successfully");
    } catch (error) {
      console.error("Error updating partner:", error);
      toast.error("Failed to update partner");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!partner) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete partner");

      toast.success("Partner deleted successfully");
      router.push("/partners");
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Failed to delete partner");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Partner not found</p>
        <Button asChild>
          <Link href="/partners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Partners
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/partners">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Partners
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Partner: {partner.name}</h1>
            <p className="text-muted-foreground font-mono text-sm">{partner.partnerId}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partnerId">Partner ID *</Label>
                <Input
                  id="partnerId"
                  name="partnerId"
                  value={partner.partnerId}
                  onChange={handleInputChange}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={partner.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueShare">Revenue Share (%) *</Label>
              <Input
                id="revenueShare"
                name="revenueShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(partner.revenueShare * 100).toFixed(1)}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-muted-foreground">
                Current: {(partner.revenueShare * 100).toFixed(1)}% (stored as {partner.revenueShare.toFixed(3)})
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sandbox">Sandbox Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable for testing purposes
                </p>
              </div>
              <Switch
                id="sandbox"
                checked={partner.sandbox}
                onCheckedChange={(checked) => handleSwitchChange("sandbox", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>
              Define the color scheme for this partner (OKLCH format)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <OklchColorPicker
                id="color-background"
                label="Background Color"
                value={partner.colors.background}
                onChange={(value) => handleColorChange("background", value)}
              />

              <OklchColorPicker
                id="color-foreground"
                label="Foreground Color"
                value={partner.colors.foreground}
                onChange={(value) => handleColorChange("foreground", value)}
              />

              <OklchColorPicker
                id="color-primary"
                label="Primary Color"
                value={partner.colors.primary}
                onChange={(value) => handleColorChange("primary", value)}
              />

              <OklchColorPicker
                id="color-border"
                label="Border Color"
                value={partner.colors.border}
                onChange={(value) => handleColorChange("border", value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Allowed Domains */}
        <Card>
          <CardHeader>
            <CardTitle>Allowed Domains</CardTitle>
            <CardDescription>
              Domains allowed for iframe embedding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partner.allowedDomains.map((domain, index) => (
              <div key={index} className="flex items-center gap-4">
                <Input value={domain} readOnly className="flex-1 font-mono text-sm" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveDomain(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Separator />

            <div className="flex items-center gap-4">
              <Input
                placeholder="example.com or localhost:3000"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDomain())}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddDomain}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="flex justify-between pt-6">
            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/partners">Close</Link>
              </Button>
            </div>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* Delete Partner Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the partner "{partner.name}" ({partner.partnerId})?
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">This will permanently delete:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Partner record from DynamoDB</li>
                  <li>All associated configurations</li>
                  <li>Access for {partner.allowedDomains.length} domain(s)</li>
                </ul>
                <p className="text-sm font-bold text-destructive mt-4">
                  This action cannot be undone!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
