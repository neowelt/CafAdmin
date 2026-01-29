"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AddDesignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [templateNameValid, setTemplateNameValid] = useState(false);
  const [templateNameError, setTemplateNameError] = useState("");
  const [templateName, setTemplateName] = useState("");

  const validateTemplateName = (name: string) => {
    if (!name) {
      setTemplateNameError("Template name is required");
      setTemplateNameValid(false);
      return false;
    }

    // Allow only alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      setTemplateNameError("Template name can only contain letters, numbers, and underscores");
      setTemplateNameValid(false);
      return false;
    }

    setTemplateNameError("");
    setTemplateNameValid(true);
    return true;
  };

  const handleTemplateNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTemplateName(value);
    validateTemplateName(value);
  };

  const createTemplate = async () => {
    if (!templateNameValid || !templateName) {
      toast.error("Please enter a valid template name");
      return;
    }

    try {
      setLoading(true);

      // Create the design with minimal data
      const initialDesign = {
        templateName: templateName,
        productTier: "basic",
        appleProductId: "Neowelt.Interactive.CoverArtFactory.standardcover",
        description: "",
        overview: "",
        preview: "",
        published: false,
        allowCustomImage: false,
        customImageWidth: 3000,
        customImageHeight: 3000,
        customImageBgTransparency: false,
        fonts: [],
        styles: [],
        macroIds: [],
        version: 1,
      };

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialDesign),
      });

      if (!response.ok) throw new Error("Failed to create template");

      const data = await response.json();

      toast.success("Template created successfully");

      // Redirect to edit page
      router.push(`/designs/${data._id}`);
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error("Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/designs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Designs
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Add New Design</h1>
        <p className="text-muted-foreground">Create a new template</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
          <CardDescription>Enter a unique template name to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              name="templateName"
              value={templateName}
              onChange={handleTemplateNameChange}
              placeholder="e.g., Modern_Vibes, Classic_Album"
              required
            />
            <p className="text-sm text-muted-foreground">
              No spaces or special characters. Use only letters, numbers, and underscores.
            </p>
            {templateNameError && (
              <p className="text-sm text-destructive">{templateNameError}</p>
            )}
            {templateNameValid && !templateNameError && (
              <p className="text-sm text-green-600">Template name is valid</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/designs">Cancel</Link>
            </Button>
            <Button
              type="button"
              onClick={createTemplate}
              disabled={!templateNameValid || loading}
            >
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
