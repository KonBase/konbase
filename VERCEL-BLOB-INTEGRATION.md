# Vercel Blob Integration Guide

## Overview

KonBase now includes comprehensive support for [Vercel Blob](https://vercel.com/docs/vercel-blob) storage, providing a unified file storage solution that works seamlessly with both PostgreSQL GelDB and Vercel Edge Config database options.

## Features

### 🚀 **Unified Storage Architecture**
- **Vercel Blob**: Ultra-fast global edge storage with < 15ms latency
- **Local Storage**: Development-friendly local file storage
- **Auto-detection**: Automatically chooses storage type based on environment
- **Seamless Migration**: Easy switching between storage types

### 📁 **File Management**
- **Organized Storage**: Files automatically organized by association and type
- **Smart Caching**: Images cached for 1 year, documents for 1 hour
- **Secure Access**: Proper file permissions and access control
- **File Types**: Support for images, documents, PDFs, and more

### 🔧 **Developer Experience**
- **Type Safety**: Full TypeScript support across all storage operations
- **Error Handling**: Graceful fallbacks and comprehensive error messages
- **Health Monitoring**: Real-time storage status and performance metrics
- **Setup Wizard**: Visual configuration and testing interface

## Architecture

### Storage Adapter Pattern

```typescript
// Unified storage interface
export class UnifiedStorage {
  async uploadFile(upload: FileUpload): Promise<FileInfo>
  async deleteFile(pathname: string): Promise<void>
  async getFileInfo(pathname: string): Promise<FileInfo | null>
  async listFiles(options?: ListOptions): Promise<FileListResult>
  async getFileContent(pathname: string): Promise<Buffer | null>
  async healthCheck(): Promise<StorageHealth>
}
```

### Storage Types

#### 1. Vercel Blob Storage
```typescript
// Configuration
const config: BlobStorageConfig = {
  type: 'vercel-blob',
  blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
};

// Features
- Global edge distribution
- < 15ms latency at P99
- Built-in CDN caching
- Automatic scaling
- 99.99% availability
```

#### 2. Local Storage
```typescript
// Configuration
const config: BlobStorageConfig = {
  type: 'local',
  localPath: './uploads',
};

// Features
- Development-friendly
- No external dependencies
- Direct file system access
- Easy debugging
```

## Setup Instructions

### 1. Vercel Blob Setup

#### Create Blob Store
1. Go to [Vercel Storage Dashboard](https://vercel.com/dashboard/storage)
2. Click **Create Blob Store**
3. Choose a region close to your users
4. Name your store (e.g., "konbase-files")

#### Get Access Token
1. In your blob store settings, go to **Access Tokens**
2. Create **Read/Write Token**
3. Copy the token value

#### Environment Variables
```bash
# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_1234567890abcdef...

# Optional: Force storage type
STORAGE_TYPE=vercel-blob
```

### 2. Local Storage Setup

#### Environment Variables
```bash
# Local Storage Configuration
LOCAL_STORAGE_PATH=./uploads

# Optional: Force storage type
STORAGE_TYPE=local
```

### 3. Setup Wizard Configuration

The setup wizard includes a dedicated **File Storage** tab that provides:

- **Real-time Status**: Live connection testing
- **Configuration Guide**: Step-by-step setup instructions
- **Performance Metrics**: Latency and health monitoring
- **Storage Comparison**: Feature comparison between options

## API Endpoints

### File Upload
```typescript
POST /api/upload
Content-Type: multipart/form-data

// Form Data
- file: File (required)
- name: string (optional)
- description: string (optional)
- itemId: string (optional)
- conventionId: string (optional)

// Headers
- x-association-id: string (required)

// Response
{
  "data": {
    "id": "doc_1234567890",
    "name": "document.pdf",
    "file_path": "documents/assoc_123/doc_1234567890.pdf",
    "file_url": "https://blob.vercel-storage.com/...",
    "file_size": 1024000,
    "mime_type": "application/pdf",
    "url": "https://blob.vercel-storage.com/..."
  },
  "success": true,
  "message": "File uploaded successfully"
}
```

### File Serving
```typescript
GET /api/files/[...path]

// Examples
GET /api/files/documents/assoc_123/doc_1234567890.pdf
GET /api/files/images/assoc_123/avatar_1234567890.jpg
GET /api/files/logos/assoc_123/logo_1234567890.png

// Response
- Vercel Blob: Redirects to blob URL
- Local Storage: Serves file directly with proper headers
```

### Storage Health Check
```typescript
GET /api/setup/check-blob-storage

// Response
{
  "success": true,
  "configured": true,
  "storageType": "vercel-blob",
  "health": {
    "status": "healthy",
    "latency": 12
  },
  "message": "Vercel Blob storage is properly configured and accessible",
  "latency": 12,
  "hasData": true
}
```

## File Organization

### Directory Structure

```
Storage Root/
├── avatars/
│   └── {userId}-{timestamp}.{ext}
├── logos/
│   └── {associationId}-{timestamp}.{ext}
├── documents/
│   └── {associationId}/
│       └── {timestamp}-{filename}.{ext}
├── images/
│   └── {associationId}/
│       └── {timestamp}-{filename}.{ext}
└── items/
    └── {associationId}/
        └── {itemId}/
            └── {timestamp}-{filename}.{ext}
```

### File Naming Convention

- **Unique IDs**: Each file gets a unique identifier
- **Timestamps**: Creation time included in filename
- **Sanitized Names**: Special characters replaced with underscores
- **Type-specific Extensions**: Proper file extensions based on content type

## Performance Optimization

### Caching Strategy

```typescript
// Image files (1 year cache)
cacheControlMaxAge: 31536000

// Documents (1 hour cache)
cacheControlMaxAge: 3600

// Dynamic content (no cache)
cacheControlMaxAge: 0
```

### CDN Distribution

Vercel Blob automatically provides:
- **Global CDN**: Files served from edge locations worldwide
- **Automatic Compression**: Gzip compression for text files
- **Image Optimization**: Automatic format optimization
- **Bandwidth Optimization**: Efficient data transfer

## Security Features

### Access Control

```typescript
// Public files (images, logos)
access: 'public'

// Private files (documents, sensitive data)
access: 'private' // Note: Vercel Blob currently only supports public
```

### File Validation

```typescript
// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File size limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

### Path Sanitization

- **Directory Traversal Prevention**: Paths validated and sanitized
- **Association Isolation**: Files organized by association ID
- **Unique Identifiers**: Prevents filename conflicts

## Monitoring and Observability

### Health Monitoring

```typescript
// Storage health check
const health = await storage.healthCheck();
// Returns: { status: 'healthy' | 'unhealthy', latency?: number }

// Storage type detection
const type = storage.getStorageType();
// Returns: 'vercel-blob' | 'local'
```

### Performance Metrics

- **Upload Latency**: Time to upload files
- **Download Latency**: Time to serve files
- **Storage Availability**: Uptime monitoring
- **Error Rates**: Failed operations tracking

### Logging

```typescript
// Comprehensive error logging
console.error('Storage operation failed:', {
  operation: 'upload',
  storageType: 'vercel-blob',
  pathname: 'documents/assoc_123/file.pdf',
  error: error.message,
  timestamp: new Date().toISOString(),
});
```

## Migration Guide

### From Local to Vercel Blob

1. **Export existing files**:
   ```bash
   # Backup local uploads directory
   tar -czf uploads-backup.tar.gz ./uploads
   ```

2. **Set up Vercel Blob**:
   - Create blob store in Vercel dashboard
   - Get read/write token
   - Set environment variable

3. **Migrate files**:
   ```typescript
   // Migration script (run once)
   const localFiles = await fs.readdir('./uploads');
   for (const file of localFiles) {
     const content = await fs.readFile(`./uploads/${file}`);
     await storage.uploadFile({
       pathname: `migrated/${file}`,
       file: content,
       options: { access: 'public' }
     });
   }
   ```

4. **Update environment**:
   ```bash
   BLOB_READ_WRITE_TOKEN=your-token
   STORAGE_TYPE=vercel-blob
   ```

### From Vercel Blob to Local

1. **Export blob files**:
   ```typescript
   const files = await storage.listFiles();
   for (const file of files.files) {
     const content = await storage.getFileContent(file.pathname);
     await fs.writeFile(`./uploads/${file.pathname}`, content);
   }
   ```

2. **Update environment**:
   ```bash
   STORAGE_TYPE=local
   LOCAL_STORAGE_PATH=./uploads
   ```

## Troubleshooting

### Common Issues

#### 1. "Storage service is not available"
```bash
# Check environment variables
echo $BLOB_READ_WRITE_TOKEN
echo $STORAGE_TYPE

# Verify token validity
curl -H "Authorization: Bearer $BLOB_READ_WRITE_TOKEN" \
     https://api.vercel.com/v1/blob-stores
```

#### 2. "File not found" errors
```typescript
// Check file existence
const fileInfo = await storage.getFileInfo(pathname);
if (!fileInfo) {
  console.log('File does not exist:', pathname);
}
```

#### 3. Upload failures
```typescript
// Check file size and type
if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('File type not allowed');
}
```

### Debug Commands

```bash
# Test storage health
curl https://your-app.vercel.app/api/setup/check-blob-storage

# Test file upload
curl -X POST https://your-app.vercel.app/api/upload \
  -H "x-association-id: test-assoc" \
  -F "file=@test.pdf"

# Test file serving
curl https://your-app.vercel.app/api/files/documents/test-assoc/test.pdf
```

## Best Practices

### File Management

1. **Use organized paths**: Group files by association and type
2. **Implement cleanup**: Remove unused files regularly
3. **Monitor storage usage**: Track storage costs and limits
4. **Backup important files**: Regular backups for critical data

### Performance

1. **Optimize images**: Compress images before upload
2. **Use appropriate cache settings**: Long cache for static assets
3. **Monitor latency**: Track performance metrics
4. **Implement retry logic**: Handle temporary failures gracefully

### Security

1. **Validate file types**: Only allow safe file formats
2. **Limit file sizes**: Prevent abuse and reduce costs
3. **Sanitize filenames**: Prevent path traversal attacks
4. **Monitor access patterns**: Detect unusual usage

## Cost Optimization

### Vercel Blob Pricing

- **Storage**: $0.15/GB/month
- **Bandwidth**: $0.40/GB
- **Operations**: $0.50/1M operations

### Optimization Tips

1. **Compress files**: Reduce storage and bandwidth costs
2. **Use appropriate cache**: Reduce repeated downloads
3. **Clean up unused files**: Regular maintenance
4. **Monitor usage**: Track costs and optimize accordingly

## Integration Examples

### React Component

```typescript
import { useState } from 'react';

export function FileUpload({ associationId }: { associationId: string }) {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (file: File) => {
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-association-id': associationId },
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('File uploaded:', result.data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={uploading}
    />
  );
}
```

### Server-side Usage

```typescript
import { getUnifiedStorage } from '@/lib/storage/unified';

export async function uploadUserAvatar(userId: string, file: Buffer) {
  const storage = getUnifiedStorage();
  
  const fileInfo = await storage.uploadUserAvatar(userId, file, 'image/jpeg');
  
  // Update user profile with new avatar URL
  await updateUserProfile(userId, { avatarUrl: fileInfo.url });
  
  return fileInfo;
}
```

## Conclusion

The Vercel Blob integration provides KonBase with enterprise-grade file storage capabilities while maintaining simplicity and performance. The unified storage architecture ensures seamless operation across different deployment environments, making it easy to scale from development to production.

Key benefits:
- **Ultra-fast performance**: < 15ms latency globally
- **Automatic scaling**: No infrastructure management required
- **Cost-effective**: Pay only for what you use
- **Developer-friendly**: Simple API and comprehensive tooling
- **Production-ready**: Built-in reliability and monitoring

For more information, refer to the [Vercel Blob documentation](https://vercel.com/docs/vercel-blob) and the [KonBase deployment guide](./DEPLOYMENT-GUIDE.md).
