import { put, del, head, list } from '@vercel/blob';

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  contentType?: string;
}

export interface BlobStorageConfig {
  type: 'vercel-blob' | 'local';
  blobReadWriteToken?: string;
  localPath?: string;
}

export class BlobStorageAdapter {
  private config: BlobStorageConfig;
  private isAvailable: boolean = false;

  constructor(config: BlobStorageConfig) {
    this.config = config;
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      if (this.config.type === 'vercel-blob') {
        // Check if we have the required token
        this.isAvailable = !!this.config.blobReadWriteToken;
      } else {
        // For local storage, we'll assume it's available if we're in a server environment
        // In browser environment, local storage is not supported
        this.isAvailable = typeof window === 'undefined';
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Blob storage availability check failed');
      this.isAvailable = false;
    }
  }

  async isStorageAvailable(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }

  async uploadFile(
    pathname: string,
    file: Buffer | File | string,
    options?: {
      access?: 'public' | 'private';
      contentType?: string;
      cacheControlMaxAge?: number;
    }
  ): Promise<BlobFile> {
    if (this.config.type === 'vercel-blob') {
      if (!this.config.blobReadWriteToken) {
        throw new Error('Vercel Blob token is required');
      }

      const blob = await put(pathname, file, {
        access: 'public',
        token: this.config.blobReadWriteToken,
        contentType: options?.contentType,
        cacheControlMaxAge: options?.cacheControlMaxAge,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        size: 0, // Vercel Blob doesn't return size in the result
        uploadedAt: new Date().toISOString(),
        contentType: options?.contentType,
      };
    } else {
      // Local storage implementation - for browser environment, we'll use a different approach
      // In a real implementation, this would be handled by the server
      throw new Error(
        'Local storage is not supported in browser environment. Use Vercel Blob instead.'
      );
    }
  }

  async deleteFile(pathname: string): Promise<void> {
    if (this.config.type === 'vercel-blob') {
      if (!this.config.blobReadWriteToken) {
        throw new Error('Vercel Blob token is required');
      }

      await del(pathname, {
        token: this.config.blobReadWriteToken,
      });
    } else {
      // Local storage deletion - not supported in browser
      throw new Error(
        'Local storage is not supported in browser environment. Use Vercel Blob instead.'
      );
    }
  }

  async getFileInfo(pathname: string): Promise<BlobFile | null> {
    try {
      if (this.config.type === 'vercel-blob') {
        if (!this.config.blobReadWriteToken) {
          throw new Error('Vercel Blob token is required');
        }

        const blob = await head(pathname, {
          token: this.config.blobReadWriteToken,
        });

        return {
          url: blob.url,
          pathname: blob.pathname,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          contentType: blob.contentType,
        };
      } else {
        // Local storage info - not supported in browser
        return null;
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error('Error getting file info');
      return null;
    }
  }

  async listFiles(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ blobs: BlobFile[]; cursor?: string }> {
    if (this.config.type === 'vercel-blob') {
      if (!this.config.blobReadWriteToken) {
        throw new Error('Vercel Blob token is required');
      }

      const result = await list({
        prefix: options?.prefix,
        limit: options?.limit || 1000,
        cursor: options?.cursor,
        token: this.config.blobReadWriteToken,
      });

      const blobs: BlobFile[] = result.blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size || 0,
        uploadedAt: blob.uploadedAt.toISOString(),
        contentType: undefined, // Vercel Blob list doesn't include contentType
      }));

      return {
        blobs,
        cursor: result.cursor,
      };
    } else {
      // Local storage listing - not supported in browser
      return {
        blobs: [],
      };
    }
  }

  getStorageType(): 'vercel-blob' | 'local' {
    return this.config.type;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      if (this.config.type === 'vercel-blob') {
        // Test with a small operation
        await this.listFiles({ limit: 1 });
      } else {
        // Test local storage
        await this.listFiles({ limit: 1 });
      }

      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch {
      return { status: 'unhealthy' };
    }
  }
}

// Factory function to create blob storage adapter
export function createBlobStorageAdapter(): BlobStorageAdapter {
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
  const storageType = process.env.STORAGE_TYPE as
    | 'vercel-blob'
    | 'local'
    | undefined;

  // Auto-detect storage type
  let type: 'vercel-blob' | 'local';
  if (storageType === 'vercel-blob' || blobReadWriteToken) {
    type = 'vercel-blob';
  } else {
    type = 'local';
  }

  const config: BlobStorageConfig = {
    type,
    blobReadWriteToken,
    localPath: process.env.LOCAL_STORAGE_PATH || './uploads',
  };

  return new BlobStorageAdapter(config);
}

// Utility function to check if Vercel Blob is configured
export function isVercelBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
