"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, X, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { PartnerColors } from "@/lib/types";
import { OklchColorPicker } from "@/components/ui/oklch-color-picker";

export default function AddPartnerPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [partnerId, setPartnerId] = useState("");
  const [name, setName] = useState("");
  const [revenueShare, setRevenueShare] = useState(20); // Default 20%
  const [sandbox, setSandbox] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [colors, setColors] = useState<PartnerColors>({
    background: "oklch(1.0 0 0)",
    foreground: "oklch(0.15 0 0)",
    primary: "oklch(0.4 0.15 240)",
    border: "oklch(0.85 0 0)",
  });

  const handleColorChange = (colorKey: keyof PartnerColors, value: string) => {
    setColors((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;

    const trimmedDomain = newDomain.trim();
    if (allowedDomains.includes(trimmedDomain)) {
      toast.error("Domain already exists");
      return;
    }

    setAllowedDomains([...allowedDomains, trimmedDomain]);
    setNewDomain("");
  };

  const handleRemoveDomain = (index: number) => {
    setAllowedDomains(allowedDomains.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerId || !name) {
      toast.error("Partner ID and Name are required");
      return;
    }

    try {
      setSaving(true);

      const partnerData = {
        partnerId,
        name,
        revenueShare: revenueShare / 100, // Convert percentage to float
        sandbox,
        allowedDomains,
        colors,
      };

      const response = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partnerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create partner");
      }

      toast.success("Partner created successfully");
      router.push("/partners");
    } catch (error: any) {
      console.error("Error creating partner:", error);
      toast.error(error.message || "Failed to create partner");
    } finally {
      setSaving(false);
    }
  };

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Partner</h1>
          <p className="text-muted-foreground">
            Create a new white-label partner configuration
          </p>
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
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  required
                  className="font-mono"
                  placeholder="my-partner"
                />
                <p className="text-sm text-muted-foreground">
                  Unique identifier (lowercase, no spaces)
                </p>
                <p className="text-sm text-amber-500 font-medium">
                  ⚠️ Cannot be changed after creation
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="My Partner Company"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenueShare">Revenue Share (%) *</Label>
              <Input
                id="revenueShare"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={revenueShare}
                onChange={(e) => setRevenueShare(parseFloat(e.target.value))}
                required
              />
              <p className="text-sm text-muted-foreground">
                Will be stored as {(revenueShare / 100).toFixed(3)}
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
                checked={sandbox}
                onCheckedChange={setSandbox}
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
                value={colors.background}
                onChange={(value) => handleColorChange("background", value)}
              />

              <OklchColorPicker
                id="color-foreground"
                label="Foreground Color"
                value={colors.foreground}
                onChange={(value) => handleColorChange("foreground", value)}
              />

              <OklchColorPicker
                id="color-primary"
                label="Primary Color"
                value={colors.primary}
                onChange={(value) => handleColorChange("primary", value)}
              />

              <OklchColorPicker
                id="color-border"
                label="Border Color"
                value={colors.border}
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
            {allowedDomains.map((domain, index) => (
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

            {allowedDomains.length > 0 && <Separator />}

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
          <CardContent className="flex justify-end gap-4 pt-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/partners">Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Partner"
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
