"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Design, DesignStyle, DesignFont } from "@/lib/types";

export default function AddDesignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateName: "",
    description: "",
    overview: "",
    preview: "",
    productTier: "free",
    appleProductId: "",
    published: false,
    allowCustomImage: false,
    customImageWidth: 1080,
    customImageHeight: 1080,
    customImageBgTransparency: false,
  });

  const [styles, setStyles] = useState<DesignStyle[]>([
    {
      styleName: "Default",
      artistTag: "",
      titleTag: "",
      artistCaseMode: "none",
      titleCaseMode: "none",
      artistNameMaxCharacters: 50,
      titleMaxCharacters: 50,
      isDefault: true,
      preview: "",
      fileName: "",
      titleLines: 1,
      artistLines: 1,
    },
  ]);

  const [fonts, setFonts] = useState<DesignFont[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStyleChange = (index: number, field: keyof DesignStyle, value: any) => {
    const newStyles = [...styles];
    newStyles[index] = { ...newStyles[index], [field]: value };
    setStyles(newStyles);
  };

  const addStyle = () => {
    setStyles([
      ...styles,
      {
        styleName: "",
        artistTag: "",
        titleTag: "",
        artistCaseMode: "none",
        titleCaseMode: "none",
        artistNameMaxCharacters: 50,
        titleMaxCharacters: 50,
        isDefault: false,
        preview: "",
        fileName: "",
        titleLines: 1,
        artistLines: 1,
      },
    ]);
  };

  const removeStyle = (index: number) => {
    if (styles.length > 1) {
      setStyles(styles.filter((_, i) => i !== index));
    }
  };

  const handleFileUpload = async (
    file: File,
    bucket: string,
    key: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("key", key);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload file");
    }

    const data = await response.json();
    return data.key;
  };

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFiles((prev) => ({ ...prev, preview: true }));
      const bucket = process.env.NEXT_PUBLIC_S3_PREVIEWS_BUCKET || "cafpreviews";
      const key = `${formData.templateName}/preview.jpg`;

      await handleFileUpload(file, bucket, key);
      setFormData((prev) => ({ ...prev, preview: key }));
      toast.success("Preview uploaded successfully");
    } catch (error) {
      console.error("Error uploading preview:", error);
      toast.error("Failed to upload preview");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, preview: false }));
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setUploadingFiles((prev) => ({ ...prev, fonts: true }));
      const bucket = process.env.NEXT_PUBLIC_S3_DESIGNS_BUCKET || "coverartbucket";
      const uploadedFonts: DesignFont[] = [];

      for (const file of Array.from(files)) {
        const key = `${formData.templateName}/fonts/${file.name}`;
        await handleFileUpload(file, bucket, key);
        uploadedFonts.push({ fileName: key });
      }

      setFonts((prev) => [...prev, ...uploadedFonts]);
      toast.success(`${uploadedFonts.length} font(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading fonts:", error);
      toast.error("Failed to upload fonts");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, fonts: false }));
    }
  };

  const handleStylePSDUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    styleIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFiles((prev) => ({ ...prev, [`style-${styleIndex}`]: true }));
      const bucket = process.env.NEXT_PUBLIC_S3_DESIGNS_BUCKET || "coverartbucket";
      const key = `${formData.templateName}/${styles[styleIndex].styleName || `style-${styleIndex}`}.psd`;

      await handleFileUpload(file, bucket, key);
      handleStyleChange(styleIndex, "fileName", key);
      toast.success("PSD file uploaded successfully");
    } catch (error) {
      console.error("Error uploading PSD:", error);
      toast.error("Failed to upload PSD file");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [`style-${styleIndex}`]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.templateName) {
      toast.error("Template name is required");
      return;
    }

    if (styles.length === 0) {
      toast.error("At least one style is required");
      return;
    }

    try {
      setLoading(true);

      const design: Omit<Design, "_id"> = {
        ...formData,
        customImageWidth: Number(formData.customImageWidth),
        customImageHeight: Number(formData.customImageHeight),
        fonts,
        styles,
        macroIds: [],
      };

      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(design),
      });

      if (!response.ok) throw new Error("Failed to create design");

      toast.success("Design created successfully");
      router.push("/designs");
    } catch (error) {
      console.error("Error creating design:", error);
      toast.error("Failed to create design");
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
        <p className="text-muted-foreground">Create a new cover art template</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Template details and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  name="templateName"
                  value={formData.templateName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productTier">Product Tier</Label>
                <Input
                  id="productTier"
                  name="productTier"
                  value={formData.productTier}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overview">Overview</Label>
              <Input
                id="overview"
                name="overview"
                value={formData.overview}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appleProductId">Apple Product ID</Label>
              <Input
                id="appleProductId"
                name="appleProductId"
                value={formData.appleProductId}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="published"
                name="published"
                checked={formData.published}
                onChange={handleInputChange}
                className="rounded"
              />
              <Label htmlFor="published">Published</Label>
            </div>
          </CardContent>
        </Card>

        {/* Preview Image */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="previewUpload">Upload Preview Image</Label>
              <Input
                id="previewUpload"
                type="file"
                accept="image/*"
                onChange={handlePreviewUpload}
                disabled={uploadingFiles.preview || !formData.templateName}
              />
              {!formData.templateName && (
                <p className="text-sm text-muted-foreground">
                  Please enter a template name first
                </p>
              )}
              {formData.preview && (
                <Badge variant="outline">Preview uploaded: {formData.preview}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fonts */}
        <Card>
          <CardHeader>
            <CardTitle>Fonts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fontUpload">Upload Font Files (TTF/TTC)</Label>
              <Input
                id="fontUpload"
                type="file"
                accept=".ttf,.ttc"
                multiple
                onChange={handleFontUpload}
                disabled={uploadingFiles.fonts || !formData.templateName}
              />
              {!formData.templateName && (
                <p className="text-sm text-muted-foreground">
                  Please enter a template name first
                </p>
              )}
            </div>
            {fonts.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Fonts:</Label>
                {fonts.map((font, index) => (
                  <Badge key={index} variant="outline">
                    {font.fileName.split("/").pop()}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Styles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Styles</CardTitle>
                <CardDescription>Design style variations</CardDescription>
              </div>
              <Button type="button" onClick={addStyle} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Style
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {styles.map((style, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    Style {index + 1} {style.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
                  </h3>
                  {styles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStyle(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Style Name</Label>
                    <Input
                      value={style.styleName}
                      onChange={(e) =>
                        handleStyleChange(index, "styleName", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PSD File</Label>
                    <Input
                      type="file"
                      accept=".psd"
                      onChange={(e) => handleStylePSDUpload(e, index)}
                      disabled={uploadingFiles[`style-${index}`] || !formData.templateName || !style.styleName}
                    />
                    {style.fileName && (
                      <Badge variant="outline">{style.fileName.split("/").pop()}</Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Artist Tag (Layer Name)</Label>
                    <Input
                      value={style.artistTag}
                      onChange={(e) =>
                        handleStyleChange(index, "artistTag", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title Tag (Layer Name)</Label>
                    <Input
                      value={style.titleTag}
                      onChange={(e) =>
                        handleStyleChange(index, "titleTag", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Artist Max Characters</Label>
                    <Input
                      type="number"
                      value={style.artistNameMaxCharacters}
                      onChange={(e) =>
                        handleStyleChange(
                          index,
                          "artistNameMaxCharacters",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Title Max Characters</Label>
                    <Input
                      type="number"
                      value={style.titleMaxCharacters}
                      onChange={(e) =>
                        handleStyleChange(
                          index,
                          "titleMaxCharacters",
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/designs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Design"}
          </Button>
        </div>
      </form>
    </div>
  );
}
