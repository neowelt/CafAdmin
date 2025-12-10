/**
 * Upload Utilities for Presigned URL S3 Uploads
 *
 * This module provides functions for uploading files directly to S3 using presigned URLs.
 * Files are uploaded directly from the browser to S3, bypassing the Next.js server.
 * This approach supports very large files (500MB+) without server memory constraints.
 */

export interface PresignedUrlResponse {
  success: boolean;
  uploadUrl: string;
  fileUrl: string;
  key: string;
  bucket: string;
}

export interface UploadOptions {
  fileName: string;
  file: File | Blob;
  bucket?: string;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  fileUrl: string;
  key: string;
  bucket: string;
  error?: string;
}

/**
 * Basic upload function without progress tracking
 *
 * @param options Upload options
 * @returns Upload result with file URL and key
 *
 * @example
 * const result = await uploadToS3({
 *   fileName: "my-file.jpg",
 *   file: fileBlob,
 *   bucket: "coverartbucket"
 * });
 *
 * if (result.success) {
 *   console.log("File uploaded:", result.fileUrl);
 * }
 */
export async function uploadToS3(options: UploadOptions): Promise<UploadResult> {
  const { fileName, file, bucket } = options;

  try {
    // Step 1: Get presigned URL from our API
    const presignParams = new URLSearchParams({
      fileName,
      contentType: file.type,
    });

    if (bucket) {
      presignParams.append("bucket", bucket);
    }

    const presignResponse = await fetch(`/api/upload/presign?${presignParams}`);

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      throw new Error(error.error || "Failed to get presigned URL");
    }

    const presignData: PresignedUrlResponse = await presignResponse.json();

    // Step 2: Upload file directly to S3 using presigned URL
    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed with status: ${uploadResponse.status}`);
    }

    // Step 3: Return success result
    return {
      success: true,
      fileUrl: presignData.fileUrl,
      key: presignData.key,
      bucket: presignData.bucket,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      fileUrl: "",
      key: "",
      bucket: bucket || "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload function with progress tracking using XMLHttpRequest
 *
 * @param options Upload options including onProgress callback
 * @returns Upload result with file URL and key
 *
 * @example
 * const result = await uploadToS3WithProgress({
 *   fileName: "large-file.psd",
 *   file: fileBlob,
 *   onProgress: (progress) => {
 *     console.log(`Upload progress: ${progress}%`);
 *     setUploadProgress(progress);
 *   }
 * });
 */
export async function uploadToS3WithProgress(options: UploadOptions): Promise<UploadResult> {
  const { fileName, file, bucket, onProgress } = options;

  try {
    // Step 1: Get presigned URL from our API
    const presignParams = new URLSearchParams({
      fileName,
      contentType: file.type,
    });

    if (bucket) {
      presignParams.append("bucket", bucket);
    }

    const presignResponse = await fetch(`/api/upload/presign?${presignParams}`);

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      throw new Error(error.error || "Failed to get presigned URL");
    }

    const presignData: PresignedUrlResponse = await presignResponse.json();

    // Step 2: Upload file directly to S3 with progress tracking
    const uploadResult = await new Promise<{ success: boolean; status: number }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true, status: xhr.status });
        } else {
          reject(new Error(`S3 upload failed with status: ${xhr.status}`));
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      // Start upload
      xhr.open("PUT", presignData.uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });

    // Step 3: Return success result
    return {
      success: true,
      fileUrl: presignData.fileUrl,
      key: presignData.key,
      bucket: presignData.bucket,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      fileUrl: "",
      key: "",
      bucket: bucket || "",
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Helper function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Helper function to validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith("/*")) {
      const prefix = type.slice(0, -2);
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });
}
