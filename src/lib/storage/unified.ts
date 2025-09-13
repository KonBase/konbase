import { createBlobStorageAdapter, BlobStorageAdapter } from './blob';

export interface FileUpload {
  pathname: string;
  file: Buffer | File | string;
  options?: {
    access?: 'public' | 'private';
    contentType?: string;
    cacheControlMaxAge?: number;
  };
}

export interface FileInfo {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  contentType?: string;
}

export interface StorageHealth {
  status: 'healthy' | 'unhealthy';
  latency?: number;
  storageType: 'vercel-blob' | 'local';
}

export class UnifiedStorage {
  private blobAdapter: BlobStorageAdapter;
  private isAvailable: boolean = false;

  constructor() {
    this.blobAdapter = createBlobStorageAdapter();
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      this.isAvailable = await this.blobAdapter.isStorageAvailable();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Storage availability check failed:', error);
      this.isAvailable = false;
    }
  }

  async isStorageReady(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }

  async uploadFile(upload: FileUpload): Promise<FileInfo> {
    if (!this.isAvailable) {
      throw new Error('Storage is not available');
    }

    const blobFile = await this.blobAdapter.uploadFile(
      upload.pathname,
      upload.file,
      upload.options
    );

    return {
      url: blobFile.url,
      pathname: blobFile.pathname,
      size: blobFile.size,
      uploadedAt: blobFile.uploadedAt,
      contentType: blobFile.contentType,
    };
  }

  async deleteFile(pathname: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Storage is not available');
    }

    await this.blobAdapter.deleteFile(pathname);
  }

  async getFileInfo(pathname: string): Promise<FileInfo | null> {
    if (!this.isAvailable) {
      return null;
    }

    const blobFile = await this.blobAdapter.getFileInfo(pathname);
    if (!blobFile) {
      return null;
    }

    return {
      url: blobFile.url,
      pathname: blobFile.pathname,
      size: blobFile.size,
      uploadedAt: blobFile.uploadedAt,
      contentType: blobFile.contentType,
    };
  }

  async listFiles(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ files: FileInfo[]; cursor?: string }> {
    if (!this.isAvailable) {
      return { files: [] };
    }

    const result = await this.blobAdapter.listFiles(options);

    const files: FileInfo[] = result.blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
      contentType: blob.contentType,
    }));

    return {
      files,
      cursor: result.cursor,
    };
  }

  async getFileContent(pathname: string): Promise<Buffer | null> {
    if (!this.isAvailable) {
      return null;
    }

    const storageType = this.blobAdapter.getStorageType();

    if (storageType === 'vercel-blob') {
      // For Vercel Blob, we need to fetch from URL
      try {
        const response = await fetch(await this.getFileUrl(pathname));
        if (!response.ok) {
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching file content from Vercel Blob:', error);
        return null;
      }
    } else {
      // For local storage, not supported in browser environment
      return null;
    }
  }

  async getFileUrl(pathname: string): Promise<string> {
    const fileInfo = await this.getFileInfo(pathname);
    if (!fileInfo) {
      throw new Error('File not found');
    }
    return fileInfo.url;
  }

  getStorageType(): 'vercel-blob' | 'local' {
    return this.blobAdapter.getStorageType();
  }

  async healthCheck(): Promise<StorageHealth> {
    const health = await this.blobAdapter.healthCheck();
    return {
      status: health.status,
      latency: health.latency,
      storageType: this.blobAdapter.getStorageType(),
    };
  }

  // Utility methods for common file operations
  async uploadUserAvatar(
    userId: string,
    file: Buffer | File,
    contentType: string
  ): Promise<FileInfo> {
    const pathname = `avatars/${userId}-${Date.now()}.${this.getFileExtension(contentType)}`;
    return this.uploadFile({
      pathname,
      file,
      options: {
        access: 'public',
        contentType,
        cacheControlMaxAge: 31536000, // 1 year cache
      },
    });
  }

  async uploadAssociationLogo(
    associationId: string,
    file: Buffer | File,
    contentType: string
  ): Promise<FileInfo> {
    const pathname = `logos/${associationId}-${Date.now()}.${this.getFileExtension(contentType)}`;
    return this.uploadFile({
      pathname,
      file,
      options: {
        access: 'public',
        contentType,
        cacheControlMaxAge: 31536000, // 1 year cache
      },
    });
  }

  async uploadDocument(
    associationId: string,
    fileName: string,
    file: Buffer | File,
    contentType: string
  ): Promise<FileInfo> {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `documents/${associationId}/${Date.now()}-${sanitizedFileName}`;
    return this.uploadFile({
      pathname,
      file,
      options: {
        access: 'private',
        contentType,
      },
    });
  }

  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
    };

    return extensions[contentType] || 'bin';
  }
}

// Singleton instance
let unifiedStorage: UnifiedStorage | null = null;

export function getUnifiedStorage(): UnifiedStorage {
  if (!unifiedStorage) {
    unifiedStorage = new UnifiedStorage();
  }
  return unifiedStorage;
}
