"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, Trash2, Plus, X, Sparkles } from "lucide-react";
import { PromptTemplate } from "@/lib/types/prompt-template";
import { PromptEditor } from "@/components/prompt-templates/prompt-editor";
import { uploadToS3WithProgress } from "@/lib/upload-utils";

interface UploadedImage {
  file: File;
  preview: string;
  s3Key: string;
  name: string;
  uploadProgress: number;
}

export default function EditPromptTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const promptId = params.id as string;

  // Template data
  const [template, setTemplate] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptType, setPromptType] = useState<'text' | 'json'>('text');

  // Multi-image upload
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);

  // Test & Results
  const [testing, setTesting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [savingExample, setSavingExample] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [promptId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/prompt-templates/${promptId}`);
      if (!response.ok) throw new Error("Failed to fetch template");
      const data: PromptTemplate = await response.json();

      setTemplate(data);
      setName(data.name);
      setDescription(data.description);
      setPrompt(data.prompt);
      setPromptType(data.promptType);
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template");
      router.push("/prompt-templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a template description");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/prompt-templates/${promptId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          prompt,
          promptType,
        }),
      });

      if (!response.ok) throw new Error("Failed to update template");

      const updated = await response.json();
      setTemplate(updated);
      toast.success("Template saved successfully");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate max images
    if (uploadedImages.length + files.length > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    setUploading(true);

    for (const file of files) {
      // Size validation (20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB limit`);
        continue;
      }

      // Type validation
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`${file.name} must be JPEG, PNG, or WEBP`);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);

      // Generate S3 key
      const s3Key = `prompt-templates/${promptId}/input-${Date.now()}-${file.name}`;

      // Add to state with 0% progress
      const newImage: UploadedImage = {
        file,
        preview,
        s3Key,
        name: file.name,
        uploadProgress: 0,
      };

      setUploadedImages(prev => [...prev, newImage]);

      try {
        // Upload to S3
        await uploadToS3WithProgress({
          fileName: s3Key,
          file: file,
          bucket: 'cafgeneration',
          onProgress: (progress) => {
            setUploadedImages(prev =>
              prev.map(img =>
                img.s3Key === s3Key
                  ? { ...img, uploadProgress: progress }
                  : img
              )
            );
          },
        });

        toast.success(`${file.name} uploaded`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
        // Remove failed upload
        setUploadedImages(prev => prev.filter(img => img.s3Key !== s3Key));
      }
    }

    setUploading(false);
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const image = uploadedImages[index];
    URL.revokeObjectURL(image.preview);
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.info(`${image.name} removed`);
  };

  const handleTestPrompt = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setTesting(true);

      // Send S3 keys instead of files
      const response = await fetch('/api/prompt-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          imageKeys: uploadedImages.map(img => img.s3Key),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedImage(`data:image/jpeg;base64,${result.generatedImageBase64}`);
        toast.success("Image generated successfully!");
      } else {
        toast.error(result.error || "Generation failed");
      }
    } catch (error) {
      console.error("Error testing prompt:", error);
      toast.error("Failed to test prompt");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveExample = async () => {
    if (!uploadedImages[0] || !generatedImage) {
      toast.error("Please test the prompt first");
      return;
    }

    try {
      setSavingExample(true);

      const formData = new FormData();
      formData.append('before_image', uploadedImages[0].file);

      // Extract base64 data from data URL
      const base64Data = generatedImage.split(',')[1];
      formData.append('after_image_base64', base64Data);

      const response = await fetch(`/api/prompt-templates/${promptId}/save-example`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to save example");

      const updated = await response.json();
      setTemplate(updated);
      toast.success("Example saved successfully!");
    } catch (error) {
      console.error("Error saving example:", error);
      toast.error("Failed to save example");
    } finally {
      setSavingExample(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const response = await fetch(`/api/prompt-templates/${promptId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Failed to delete template");

      toast.success("Template deleted successfully");
      router.push("/prompt-templates");
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setDeleting(false);
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

  if (!template) {
    return null;
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/prompt-templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Prompt Templates
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            <p className="text-muted-foreground">{template.description}</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Card 1: Input Images */}
        <Card>
          <CardHeader>
            <CardTitle>Input Images</CardTitle>
            <CardDescription>Upload 1-10 images (max 20MB each)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap items-start">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative">
                    <div className="w-12 h-12 relative rounded border overflow-hidden">
                      <Image
                        src={img.preview}
                        alt={img.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      {img.uploadProgress < 100 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-3 w-3 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {uploadedImages.length < 10 && (
                  <Label htmlFor="imageUpload">
                    <div className="w-12 h-12 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Label>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                JPEG, PNG, or WEBP up to 20MB each (max 10 images)
              </p>

              {uploading && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Prompt Input */}
        <Card>
          <CardHeader>
            <CardTitle>Prompt</CardTitle>
            <CardDescription>Define the AI transformation for your images</CardDescription>
          </CardHeader>
          <CardContent>
            <PromptEditor
              value={prompt}
              onChange={setPrompt}
              promptType={promptType}
              onPromptTypeChange={setPromptType}
              rows={25}
            />
          </CardContent>
        </Card>

        {/* Card 3: Test & Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test & Results</CardTitle>
            <CardDescription>Test your prompt and view generated images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Button */}
            <Button
              onClick={handleTestPrompt}
              disabled={testing || uploadedImages.length === 0 || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Test Prompt
                </>
              )}
            </Button>

            {/* Results */}
            {generatedImage && (
              <>
                <Separator />

                {/* Input images grid */}
                <div>
                  <Label className="text-base">Input Images</Label>
                  <div className="flex gap-2 flex-wrap mt-3">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="w-28 h-28 relative rounded border overflow-hidden">
                        <Image
                          src={img.preview}
                          alt={img.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generated image */}
                <div>
                  <Label className="text-base">Generated Result</Label>
                  <div className="relative aspect-square max-w-lg mt-3 border rounded overflow-hidden">
                    <Image
                      src={generatedImage}
                      alt="Generated"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSaveExample}
                  disabled={savingExample}
                  variant="default"
                  className="w-full"
                >
                  {savingExample ? "Saving..." : "Save This Example"}
                </Button>
              </>
            )}

            {/* Show saved example if exists */}
            {template.beforeImageKey && template.afterImageKey && !generatedImage && (
              <>
                <Separator />
                <div>
                  <Label className="text-base">Saved Example</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Current saved example for this template
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Before</p>
                      <div className="relative aspect-square border rounded overflow-hidden">
                        <Image
                          src={`https://d1ob1c4s71ij1b.cloudfront.net/${template.beforeImageKey}`}
                          alt="Before"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">After</p>
                      <div className="relative aspect-square border rounded overflow-hidden">
                        <Image
                          src={`https://d1ob1c4s71ij1b.cloudfront.net/${template.afterImageKey}`}
                          alt="After"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Save Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Template Settings</CardTitle>
            <CardDescription>Update template name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="e.g., Vintage, 90s Flash Portrait"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Describe what this prompt does and the effect it creates"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
