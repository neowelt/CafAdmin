# Presigned URL Upload Examples

This document provides examples of how to use the presigned URL upload system.

## Basic Upload (No Progress Tracking)

```tsx
import { uploadToS3 } from "@/lib/upload-utils";
import { useState } from "react";

function BasicUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const result = await uploadToS3({
        fileName: file.name,
        file: file,
        bucket: "coverartbucket", // optional
      });

      if (result.success) {
        console.log("Upload successful:", result.fileUrl);
        setFileUrl(result.fileUrl);
        // Update your database or state with result.key
      } else {
        console.error("Upload failed:", result.error);
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
      {fileUrl && <p>File uploaded: {fileUrl}</p>}
    </div>
  );
}
```

## Upload with Progress Tracking

```tsx
import { uploadToS3WithProgress, formatFileSize } from "@/lib/upload-utils";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

function ProgressUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadToS3WithProgress({
        fileName: file.name,
        file: file,
        bucket: "coverartbucket",
        onProgress: (percent) => {
          console.log(`Upload progress: ${percent}%`);
          setProgress(percent);
        },
      });

      if (result.success) {
        console.log("Upload successful:", result.fileUrl);
        setFileUrl(result.fileUrl);
        // Update your database or state with result.key
      } else {
        console.error("Upload failed:", result.error);
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600">Uploading: {progress}%</p>
        </div>
      )}

      {fileUrl && (
        <div className="text-sm text-green-600">
          File uploaded successfully!
        </div>
      )}
    </div>
  );
}
```

## Large File Upload with Validation

```tsx
import {
  uploadToS3WithProgress,
  formatFileSize,
  validateFileType,
} from "@/lib/upload-utils";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function LargeFileUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Allowed file types
  const ALLOWED_TYPES = ["image/*", "application/x-photoshop", ".psd"];
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!validateFileType(file, ALLOWED_TYPES)) {
      alert("Invalid file type. Please select an image or PSD file.");
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadToS3WithProgress({
        fileName: selectedFile.name,
        file: selectedFile,
        bucket: "coverartbucket",
        onProgress: (percent) => {
          setProgress(percent);
        },
      });

      if (result.success) {
        setFileUrl(result.fileUrl);

        // Here you would typically update your database
        // await updateDesignStyle(styleId, {
        //   fileName: result.key,
        //   preview: result.fileUrl,
        // });

        alert("Upload successful!");
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          accept=".psd,.jpg,.jpeg,.png"
        />
      </div>

      {selectedFile && (
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm">
            <strong>File:</strong> {selectedFile.name}
          </p>
          <p className="text-sm">
            <strong>Size:</strong> {formatFileSize(selectedFile.size)}
          </p>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-gray-600">
            Uploading: {progress}% - Please don't close this window
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? "Uploading..." : "Upload to S3"}
        </Button>

        {selectedFile && !uploading && (
          <Button
            variant="outline"
            onClick={() => setSelectedFile(null)}
          >
            Cancel
          </Button>
        )}
      </div>

      {fileUrl && (
        <div className="p-4 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-800">
            Upload successful! File URL: {fileUrl}
          </p>
        </div>
      )}
    </div>
  );
}
```

## Integration with Existing Design Form

Here's how to integrate presigned URL uploads into your existing design style upload:

```tsx
// In app/designs/[id]/page.tsx

import { uploadToS3WithProgress } from "@/lib/upload-utils";

// Replace the handleStylePSDUpload function:
const handleStylePSDUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  styleIndex: number
) => {
  const file = e.target.files?.[0];
  if (!file || !design) return;

  // Validate file type
  if (!file.name.toLowerCase().endsWith(".psd")) {
    toast.error("Please select a PSD file");
    return;
  }

  setUploadingPSD({ ...uploadingPSD, [styleIndex]: true });

  try {
    // Upload using presigned URL
    const result = await uploadToS3WithProgress({
      fileName: `${design.templateName}/styles/${file.name}`,
      file: file,
      bucket: "coverartbucket",
      onProgress: (progress) => {
        console.log(`PSD upload progress: ${progress}%`);
        // Optionally update UI with progress
      },
    });

    if (result.success) {
      // Update the style with the new fileName (S3 key)
      handleStyleFieldChange(styleIndex, "fileName", result.key);

      // Auto-save
      const updatedStyles = design.styles.map((s, i) =>
        i === styleIndex ? { ...s, fileName: result.key } : s
      );
      await autoSave({ ...design, styles: updatedStyles });

      toast.success("PSD file uploaded successfully");
    } else {
      toast.error(result.error || "Failed to upload PSD file");
    }
  } catch (error) {
    console.error("Error uploading PSD:", error);
    toast.error("Failed to upload PSD file");
  } finally {
    setUploadingPSD({ ...uploadingPSD, [styleIndex]: false });
  }
};

// Similar changes for handleStylePreviewUpload
```

## Key Benefits

1. **No Server Memory Limits**: Files upload directly from browser to S3
2. **Large File Support**: Handles 500MB+ files without issues
3. **Progress Tracking**: Real-time upload progress for better UX
4. **No CloudFront Limits**: Bypasses CloudFront body size restrictions
5. **Cost Effective**: Reduces server bandwidth and compute costs
6. **Scalable**: Handles concurrent uploads efficiently
7. **IAM Role Security**: Uses Amplify's IAM role, no exposed credentials

## Troubleshooting

### CORS Errors

If you get CORS errors, ensure your S3 bucket has the correct CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Large File Timeout

If uploads timeout, increase the presigned URL expiration in the API route:

```ts
const uploadUrl = await getSignedUrl(s3Client, command, {
  expiresIn: 7200 // 2 hours for very slow connections
});
```

### CloudFront Caching

If you're using CloudFront, you may want to use the CloudFront URL instead:

```ts
const fileUrl = `https://your-distribution.cloudfront.net/${key}`;
```
