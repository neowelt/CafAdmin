"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Upload,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
  CloudUpload,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Design, DesignStyle, DesignFont } from "@/lib/types";

const S3_DESIGNS_BUCKET = "coverartbucket";
const S3_PREVIEWS_BUCKET = "cafpreviews";
const CLOUDFRONT_BASE_URL = "https://d1ob1c4s71ij1b.cloudfront.net";

export default function EditDesignPage() {
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [design, setDesign] = useState<Design | null>(null);
  const [expandedStyles, setExpandedStyles] = useState<Set<number>>(new Set());

  // Upload states
  const [previewUploading, setPreviewUploading] = useState(false);
  const [fontUploading, setFontUploading] = useState(false);
  const [styleFileUploading, setStyleFileUploading] = useState<{ [key: number]: boolean }>({});
  const [stylePreviewUploading, setStylePreviewUploading] = useState<{ [key: number]: boolean }>({});

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFontDialogOpen, setDeleteFontDialogOpen] = useState(false);
  const [deleteStyleDialogOpen, setDeleteStyleDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number>(-1);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag and drop state
  const [draggingStyleIndex, setDraggingStyleIndex] = useState<number>(-1);
  const [dragOverStyleIndex, setDragOverStyleIndex] = useState<number>(-1);

  useEffect(() => {
    if (designId) {
      fetchDesign();
    }
  }, [designId]);

  const fetchDesign = async () => {
    try {
      const response = await fetch(`/api/designs/${designId}`);
      if (!response.ok) throw new Error("Failed to fetch design");
      const data = await response.json();
      setDesign(data);
    } catch (error) {
      console.error("Error fetching design:", error);
      toast.error("Failed to load design");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!design) return;
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setDesign((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    if (!design) return;
    setDesign((prev) => {
      if (!prev) return prev;
      return { ...prev, [name]: checked };
    });
    // Auto-save on switch change
    autoSave({ ...design, [name]: checked });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (!design) return;
    setDesign((prev) => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
  };

  const autoSave = async (updatedDesign: Design) => {
    try {
      const response = await fetch(`/api/designs/${designId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDesign),
      });

      if (!response.ok) throw new Error("Failed to auto-save");
      console.log("Design auto-saved successfully");
    } catch (error) {
      console.error("Error auto-saving design:", error);
      toast.error("Failed to auto-save changes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!design) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/designs/${designId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(design),
      });

      if (!response.ok) throw new Error("Failed to update design");
      toast.success("Design updated successfully");
    } catch (error) {
      console.error("Error updating design:", error);
      toast.error("Failed to update design");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!design) return;

    setIsDeleting(true);
    try {
      // Delete from API (which should handle S3 cleanup)
      const response = await fetch(`/api/designs/${designId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete design");

      toast.success("Design deleted successfully");
      router.push("/designs");
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Preview image upload
  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !design) return;

    const file = e.target.files[0];
    if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/jpg")) {
      toast.error("Only JPG/JPEG files are allowed");
      return;
    }

    setPreviewUploading(true);
    try {
      const templateDir = design.templateName.toLowerCase();
      const key = `${templateDir}/${templateDir}.jpg`;

      // Upload directly to S3
      const uploadSuccess = await uploadToS3(file, S3_PREVIEWS_BUCKET, key, file.type);

      if (uploadSuccess) {
        const newPreviewUrl = `${CLOUDFRONT_BASE_URL}/${key}`;
        const updatedDesign = { ...design, preview: newPreviewUrl };
        setDesign(updatedDesign);

        // Invalidate CloudFront cache
        await invalidateCloudFrontCache([key]);

        toast.success("Preview uploaded successfully. Changes may take up to a minute to appear.");
        await autoSave(updatedDesign);
      }
    } catch (error) {
      console.error("Error uploading preview:", error);
      toast.error("Failed to upload preview image");
    } finally {
      setPreviewUploading(false);
    }
  };

  // Font upload
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !design) return;

    const file = e.target.files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf", "ttc"].includes(ext || "")) {
      toast.error("Only TTF, OTF, and TTC font files are allowed");
      return;
    }

    setFontUploading(true);
    try {
      const templateDir = design.templateName.toLowerCase();
      const key = `${templateDir}/fonts/${file.name}`;

      const mimeType = ext === "otf" ? "font/otf" : ext === "ttc" ? "font/collection" : "application/x-font-ttf";
      const uploadSuccess = await uploadToS3(file, S3_DESIGNS_BUCKET, key, mimeType);

      if (uploadSuccess) {
        const updatedFonts = [...design.fonts, { fileName: key }];
        const updatedDesign = { ...design, fonts: updatedFonts };
        setDesign(updatedDesign);

        toast.success("Font uploaded successfully");
        await autoSave(updatedDesign);
      }
    } catch (error) {
      console.error("Error uploading font:", error);
      toast.error("Failed to upload font");
    } finally {
      setFontUploading(false);
    }
  };

  // Remove font
  const handleRemoveFont = async (index: number) => {
    if (!design) return;

    const updatedFonts = design.fonts.filter((_, i) => i !== index);
    const updatedDesign = { ...design, fonts: updatedFonts };
    setDesign(updatedDesign);
    setDeleteFontDialogOpen(false);

    await autoSave(updatedDesign);
    toast.success("Font removed");
  };

  // Add new style
  const handleAddStyle = () => {
    if (!design) return;

    const styleNumber = design.styles.length + 1;
    const newStyle: DesignStyle = {
      styleName: `S${styleNumber}`,
      artistTag: "ARTIST",
      titleTag: "TITLE",
      artistCaseMode: "UpperCase",
      titleCaseMode: "UpperCase",
      artistNameMaxCharacters: 32,
      titleMaxCharacters: 32,
      titleLines: 1,
      artistLines: 1,
      isDefault: false,
      preview: "",
      fileName: "",
    };

    const updatedStyles = [...design.styles, newStyle];
    const updatedDesign = { ...design, styles: updatedStyles };
    setDesign(updatedDesign);

    // Expand the new style
    setExpandedStyles(new Set([updatedStyles.length - 1]));
  };

  // Remove style
  const handleRemoveStyle = async (index: number) => {
    if (!design) return;

    const updatedStyles = design.styles.filter((_, i) => i !== index);
    const updatedDesign = { ...design, styles: updatedStyles };
    setDesign(updatedDesign);
    setDeleteStyleDialogOpen(false);

    await autoSave(updatedDesign);
    toast.success("Style removed");
  };

  // Update style field
  const handleStyleFieldChange = (index: number, field: string, value: any) => {
    if (!design) return;

    const updatedStyles = design.styles.map((style, i) => {
      if (i === index) {
        return { ...style, [field]: value };
      }
      return style;
    });

    setDesign({ ...design, styles: updatedStyles });
  };

  // Style PSD upload
  const handleStylePSDUpload = async (e: React.ChangeEvent<HTMLInputElement>, styleIndex: number) => {
    if (!e.target.files || !e.target.files[0] || !design) return;

    const file = e.target.files[0];
    if (!file.name.endsWith(".psd")) {
      toast.error("Only PSD files are allowed");
      return;
    }

    setStyleFileUploading({ ...styleFileUploading, [styleIndex]: true });
    try {
      const style = design.styles[styleIndex];
      const templateDir = design.templateName.toLowerCase();
      const styleSafeName = style.styleName.replace(/\s+/g, "_").toLowerCase();
      const key = style.fileName || `${templateDir}/${templateDir}_${styleSafeName}.psd`;

      const uploadSuccess = await uploadToS3(file, S3_DESIGNS_BUCKET, key, "application/psd");

      if (uploadSuccess) {
        handleStyleFieldChange(styleIndex, "fileName", key);
        toast.success("PSD file uploaded successfully");

        const updatedDesign = {
          ...design,
          styles: design.styles.map((s, i) => i === styleIndex ? { ...s, fileName: key } : s)
        };
        await autoSave(updatedDesign);
      }
    } catch (error) {
      console.error("Error uploading PSD:", error);
      toast.error("Failed to upload PSD file");
    } finally {
      setStyleFileUploading({ ...styleFileUploading, [styleIndex]: false });
    }
  };

  // Style preview upload
  const handleStylePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>, styleIndex: number) => {
    if (!e.target.files || !e.target.files[0] || !design) return;

    const file = e.target.files[0];
    if (!file.type.startsWith("image/jpeg") && !file.type.startsWith("image/jpg")) {
      toast.error("Only JPG/JPEG files are allowed");
      return;
    }

    setStylePreviewUploading({ ...stylePreviewUploading, [styleIndex]: true });
    try {
      const style = design.styles[styleIndex];
      const templateDir = design.templateName.toLowerCase();
      const styleSafeName = style.styleName.replace(/\s+/g, "_").toLowerCase();
      const uniqueId = Math.random().toString(36).substring(2, 10);
      const key = `${templateDir}/${templateDir}_${styleSafeName}_${uniqueId}.jpg`;

      const uploadSuccess = await uploadToS3(file, S3_PREVIEWS_BUCKET, key, file.type);

      if (uploadSuccess) {
        const newPreviewUrl = `${CLOUDFRONT_BASE_URL}/${key}`;
        handleStyleFieldChange(styleIndex, "preview", newPreviewUrl);

        // Invalidate CloudFront cache
        await invalidateCloudFrontCache([key]);

        toast.success("Style preview uploaded successfully");

        const updatedDesign = {
          ...design,
          styles: design.styles.map((s, i) => i === styleIndex ? { ...s, preview: newPreviewUrl } : s)
        };
        await autoSave(updatedDesign);
      }
    } catch (error) {
      console.error("Error uploading style preview:", error);
      toast.error("Failed to upload style preview");
    } finally {
      setStylePreviewUploading({ ...stylePreviewUploading, [styleIndex]: false });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggingStyleIndex(index);
    e.dataTransfer.effectAllowed = "move";

    // Collapse the panel when dragging
    const newExpanded = new Set(expandedStyles);
    newExpanded.delete(index);
    setExpandedStyles(newExpanded);
  };

  const handleDragEnd = () => {
    setDraggingStyleIndex(-1);
    setDragOverStyleIndex(-1);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggingStyleIndex !== -1 && draggingStyleIndex !== index) {
      setDragOverStyleIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!design || draggingStyleIndex === -1 || draggingStyleIndex === targetIndex) {
      setDraggingStyleIndex(-1);
      setDragOverStyleIndex(-1);
      return;
    }

    const styles = [...design.styles];
    const draggedStyle = styles[draggingStyleIndex];
    styles.splice(draggingStyleIndex, 1);

    if (targetIndex > draggingStyleIndex) {
      styles.splice(targetIndex - 1, 0, draggedStyle);
    } else {
      styles.splice(targetIndex, 0, draggedStyle);
    }

    const updatedDesign = { ...design, styles };
    setDesign(updatedDesign);
    setDraggingStyleIndex(-1);
    setDragOverStyleIndex(-1);

    toast.info("Style order updated. Don't forget to save!");
  };

  // Helper function to upload to S3
  const uploadToS3 = async (file: File, bucket: string, key: string, contentType: string): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("key", key);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error("S3 upload error:", error);
      return false;
    }
  };

  // Helper function to invalidate CloudFront cache
  const invalidateCloudFrontCache = async (paths: string[]) => {
    try {
      await fetch("/api/files/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });
    } catch (error) {
      console.error("CloudFront invalidation error:", error);
    }
  };

  const toggleStyleExpansion = (index: number) => {
    const newExpanded = new Set(expandedStyles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedStyles(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Design not found</p>
        <Button asChild>
          <Link href="/designs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Designs
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/designs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Designs
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Design: {design.templateName}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="md:col-span-3 space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                      id="templateName"
                      name="templateName"
                      value={design.templateName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productTier">Product Tier *</Label>
                    <Input
                      id="productTier"
                      name="productTier"
                      value={design.productTier}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Label htmlFor="appleProductId">Apple Product ID</Label>
                    <Select
                      value={design.appleProductId}
                      onValueChange={(value) => handleSelectChange("appleProductId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Neowelt.Interactive.CoverArtFactory.standardcover">
                          standardcover
                        </SelectItem>
                        <SelectItem value="Neowelt.Interactive.CoverArtFactory.photocover">
                          photocover
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={design.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overview">Overview</Label>
                  <Textarea
                    id="overview"
                    name="overview"
                    value={design.overview}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>

              {/* Preview Image Column */}
              <div className="flex flex-col items-center justify-center gap-4">
                {design.preview ? (
                  <div className="relative w-48 h-48">
                    <Image
                      src={design.preview}
                      alt="Preview"
                      fill
                      className="object-cover rounded"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">No preview</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="previewUpload"
                    accept=".jpg,.jpeg"
                    onChange={handlePreviewUpload}
                    className="hidden"
                  />
                  <Label htmlFor="previewUpload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={previewUploading}
                      asChild
                    >
                      <span className="cursor-pointer">
                        {previewUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <CloudUpload className="mr-2 h-4 w-4" />
                            {design.preview ? "Replace" : "Upload"} Preview
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Switches */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={design.published}
                  onCheckedChange={(checked) => handleSwitchChange("published", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowCustomImage">Allow Custom Image</Label>
                <Switch
                  id="allowCustomImage"
                  checked={design.allowCustomImage}
                  onCheckedChange={(checked) => handleSwitchChange("allowCustomImage", checked)}
                />
              </div>
              {design.allowCustomImage && (
                <div className="flex items-center justify-between">
                  <Label htmlFor="customImageBgTransparency">Custom Image BG Transparency</Label>
                  <Switch
                    id="customImageBgTransparency"
                    checked={design.customImageBgTransparency}
                    onCheckedChange={(checked) => handleSwitchChange("customImageBgTransparency", checked)}
                  />
                </div>
              )}
            </div>

            {design.allowCustomImage && (
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="customImageWidth">Custom Image Width</Label>
                  <Input
                    type="number"
                    id="customImageWidth"
                    name="customImageWidth"
                    value={design.customImageWidth}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customImageHeight">Custom Image Height</Label>
                  <Input
                    type="number"
                    id="customImageHeight"
                    name="customImageHeight"
                    value={design.customImageHeight}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fonts */}
        <Card>
          <CardHeader>
            <CardTitle>Fonts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {design.fonts.map((font, index) => (
              <div key={index} className="flex items-center gap-4">
                <Input value={font.fileName} readOnly className="flex-1" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setItemToDelete(index);
                    setDeleteFontDialogOpen(true);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Separator />

            <div className="flex items-center gap-4">
              <input
                type="file"
                id="fontUpload"
                accept=".ttf,.otf,.ttc"
                onChange={handleFontUpload}
                className="hidden"
              />
              <Label htmlFor="fontUpload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={fontUploading}
                  asChild
                >
                  <span className="cursor-pointer">
                    {fontUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CloudUpload className="mr-2 h-4 w-4" />
                        Upload Font
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <span className="text-sm text-muted-foreground">
                TTF, OTF, and TTC files are supported
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Styles */}
        <Card>
          <CardHeader>
            <CardTitle>Styles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {design.styles.map((style, index) => (
              <div
                key={index}
                className={`border rounded-lg transition-all ${
                  dragOverStyleIndex === index && draggingStyleIndex !== index
                    ? "border-primary border-2"
                    : ""
                } ${draggingStyleIndex === index ? "opacity-50" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleStyleExpansion(index)}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                      <h3 className="font-semibold">
                        {style.styleName || `Style ${index + 1}`}
                      </h3>
                    </div>
                    <Button type="button" variant="ghost" size="sm">
                      {expandedStyles.has(index) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <Collapsible open={expandedStyles.has(index)}>
                    <CollapsibleContent className="mt-4">
                      <div className="grid gap-6 md:grid-cols-4">
                        <div className="md:col-span-3 space-y-4">
                          <div className="space-y-2">
                            <Label>Style Name *</Label>
                            <Input
                              value={style.styleName}
                              onChange={(e) => handleStyleFieldChange(index, "styleName", e.target.value)}
                              required
                            />
                          </div>

                          {/* Artist Settings */}
                          <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950/20">
                            <h4 className="font-semibold mb-3 text-blue-700 dark:text-blue-400">
                              Artist Settings
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Artist Tag</Label>
                                <Input
                                  value={style.artistTag}
                                  onChange={(e) => handleStyleFieldChange(index, "artistTag", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Artist Case Mode</Label>
                                <Select
                                  value={style.artistCaseMode}
                                  onValueChange={(value) => handleStyleFieldChange(index, "artistCaseMode", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="UpperCase">UpperCase</SelectItem>
                                    <SelectItem value="LowerCase">LowerCase</SelectItem>
                                    <SelectItem value="TitleCase">TitleCase</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Artist Max Characters</Label>
                                <Input
                                  type="number"
                                  value={style.artistNameMaxCharacters}
                                  onChange={(e) => handleStyleFieldChange(index, "artistNameMaxCharacters", parseInt(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Artist Lines</Label>
                                <Input
                                  type="number"
                                  value={style.artistLines}
                                  onChange={(e) => handleStyleFieldChange(index, "artistLines", parseInt(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Title Settings */}
                          <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 dark:bg-green-950/20">
                            <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                              Title Settings
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Title Tag</Label>
                                <Input
                                  value={style.titleTag}
                                  onChange={(e) => handleStyleFieldChange(index, "titleTag", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Title Case Mode</Label>
                                <Select
                                  value={style.titleCaseMode}
                                  onValueChange={(value) => handleStyleFieldChange(index, "titleCaseMode", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="UpperCase">UpperCase</SelectItem>
                                    <SelectItem value="LowerCase">LowerCase</SelectItem>
                                    <SelectItem value="TitleCase">TitleCase</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Title Max Characters</Label>
                                <Input
                                  type="number"
                                  value={style.titleMaxCharacters}
                                  onChange={(e) => handleStyleFieldChange(index, "titleMaxCharacters", parseInt(e.target.value))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Title Lines</Label>
                                <Input
                                  type="number"
                                  value={style.titleLines}
                                  onChange={(e) => handleStyleFieldChange(index, "titleLines", parseInt(e.target.value))}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={style.isDefault}
                              onCheckedChange={(checked) => handleStyleFieldChange(index, "isDefault", checked)}
                            />
                            <Label>Is Default Style</Label>
                          </div>

                          {style.fileName && (
                            <div className="text-sm text-muted-foreground">
                              File: {style.fileName.split("/").pop()}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setItemToDelete(index);
                                setDeleteStyleDialogOpen(true);
                              }}
                            >
                              Remove Style
                            </Button>

                            <input
                              type="file"
                              id={`stylePSD-${index}`}
                              accept=".psd"
                              onChange={(e) => handleStylePSDUpload(e, index)}
                              className="hidden"
                            />
                            <Label htmlFor={`stylePSD-${index}`}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={styleFileUploading[index]}
                                asChild
                              >
                                <span className="cursor-pointer">
                                  {styleFileUploading[index] ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <CloudUpload className="mr-2 h-4 w-4" />
                                      {style.fileName ? "Replace" : "Upload"} PSD
                                    </>
                                  )}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>

                        {/* Style Preview Column */}
                        <div className="flex flex-col items-center justify-center gap-4">
                          {style.preview ? (
                            <div className="relative w-48 h-48">
                              <Image
                                src={style.preview}
                                alt="Style Preview"
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-48 h-48 bg-muted rounded flex items-center justify-center">
                              <span className="text-sm text-muted-foreground">No preview</span>
                            </div>
                          )}
                          <div>
                            <input
                              type="file"
                              id={`stylePreview-${index}`}
                              accept=".jpg,.jpeg"
                              onChange={(e) => handleStylePreviewUpload(e, index)}
                              className="hidden"
                            />
                            <Label htmlFor={`stylePreview-${index}`}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={stylePreviewUploading[index]}
                                asChild
                              >
                                <span className="cursor-pointer">
                                  {stylePreviewUploading[index] ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <CloudUpload className="mr-2 h-4 w-4" />
                                      {style.preview ? "Replace" : "Upload"} Preview
                                    </>
                                  )}
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            ))}

            <Button type="button" onClick={handleAddStyle} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Style
            </Button>
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
                <Link href="/designs">Close</Link>
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

      {/* Delete Design Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Design</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the design "{design.templateName}"?
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">This will permanently delete:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Design record from database</li>
                  <li>All template files from S3 (PSDs, fonts)</li>
                  <li>All preview images from S3</li>
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

      {/* Delete Font Dialog */}
      <Dialog open={deleteFontDialogOpen} onOpenChange={setDeleteFontDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Font</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this font? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFontDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveFont(itemToDelete)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Style Dialog */}
      <Dialog open={deleteStyleDialogOpen} onOpenChange={setDeleteStyleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Style</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this style? This action cannot be undone.
              {design && itemToDelete >= 0 && itemToDelete < design.styles.length && (
                <p className="mt-2 font-medium">
                  Style: {design.styles[itemToDelete].styleName}
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStyleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleRemoveStyle(itemToDelete)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
