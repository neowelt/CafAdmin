import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined, // Use default credential chain if not provided
});

const cloudFrontClient = new CloudFrontClient({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

export class AwsS3Service {
  static readonly BUCKETS = {
    DESIGNS: process.env.S3_DESIGNS_BUCKET || 'coverartbucket',
    PROCESSING: process.env.S3_PROCESSING_BUCKET || 'cafprocessing',
    PREVIEWS: process.env.S3_PREVIEWS_BUCKET || 'cafpreviews',
    ORDERS: process.env.S3_ORDERS_BUCKET || 'caforders',
  };

  static readonly CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID || 'E2LSEELWH9D3YF';

  /**
   * Upload a file to S3
   */
  static async uploadFile(
    file: Buffer,
    bucket: string,
    key: string,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await s3Client.send(command);
  }

  /**
   * Generate a pre-signed URL for downloading a file (1 hour expiration)
   */
  static async generateDownloadUrl(bucket: string, key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  }

  /**
   * Generate a pre-signed URL for uploading a file (15 minutes expiration)
   */
  static async generateUploadUrl(bucket: string, key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 900 });
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(bucket: string, key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Delete a folder and all its contents from S3
   */
  static async deleteFolder(bucket: string, prefix: string): Promise<void> {
    // Ensure prefix ends with /
    const folderPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;

    // List all objects in the folder
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: folderPrefix,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return;
    }

    // Delete all objects
    for (const object of listResponse.Contents) {
      if (object.Key) {
        await this.deleteFile(bucket, object.Key);
      }
    }
  }

  /**
   * Create a "directory" in S3 (actually just uploads an empty object with trailing /)
   */
  static async createDirectory(bucket: string, directoryPath: string): Promise<void> {
    const key = directoryPath.endsWith('/') ? directoryPath : `${directoryPath}/`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: '',
    });

    await s3Client.send(command);
  }

  /**
   * Invalidate CloudFront cache for a path
   */
  static async invalidateCloudFrontCache(path: string): Promise<void> {
    const command = new CreateInvalidationCommand({
      DistributionId: this.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        CallerReference: `${Date.now()}`,
        Paths: {
          Quantity: 1,
          Items: [path],
        },
      },
    });

    await cloudFrontClient.send(command);
  }

  /**
   * Upload a file to the processing bucket
   */
  static async putFileToProcessing(
    file: Buffer,
    fileName: string,
    contentType: string
  ): Promise<void> {
    const outputDir = process.env.S3_OUTPUT_DIRECTORY || 'output';
    const key = `${outputDir}/${fileName}`;

    await this.uploadFile(file, this.BUCKETS.PROCESSING, key, contentType);
  }

  /**
   * Get pre-signed URL for an order design
   */
  static async getOrderDesignUrl(key: string): Promise<string> {
    return await this.generateDownloadUrl(this.BUCKETS.ORDERS, key);
  }

  /**
   * Get pre-signed URL for an order preview
   */
  static async getOrderPreviewUrl(key: string): Promise<string> {
    return await this.generateDownloadUrl(this.BUCKETS.ORDERS, key);
  }
}
