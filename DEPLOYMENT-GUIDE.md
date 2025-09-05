# KonBase Deployment Guide - PostgreSQL & Edge Config

## Overview

KonBase now supports both **PostgreSQL GelDB** and **Vercel Edge Config** as database solutions. This guide covers deployment for both options with complete setup instructions.

## Database Options

### 1. PostgreSQL GelDB (Traditional)
- **Best for**: Complex queries, large datasets, transactional operations
- **Performance**: 50-200ms query latency
- **Features**: Full SQL support, ACID compliance, complex relationships

### 2. Vercel Edge Config (Ultra-fast)
- **Best for**: Configuration data, feature flags, small datasets
- **Performance**: < 15ms latency at P99
- **Features**: Global edge distribution, ultra-low latency, built-in caching

## File Storage Options

### 1. Vercel Blob (Recommended)
- **Best for**: Production applications, global distribution
- **Performance**: < 15ms latency at P99
- **Features**: Global CDN, automatic scaling, built-in caching

### 2. Local Storage (Development)
- **Best for**: Development, testing, small deployments
- **Performance**: Direct file system access
- **Features**: No external dependencies, easy debugging

## Quick Start

### Option 1: PostgreSQL Deployment

1. **Set up PostgreSQL database**
2. **Configure environment variables**
3. **Deploy to Vercel**
4. **Run database migrations**

### Option 2: Edge Config Deployment

1. **Create Edge Config in Vercel**
2. **Configure environment variables**
3. **Deploy to Vercel**
4. **Test configuration**

### Option 3: Vercel Blob Storage

1. **Create Blob Store in Vercel**
2. **Configure environment variables**
3. **Deploy to Vercel**
4. **Test file uploads**

## Detailed Setup Instructions

### PostgreSQL Setup

#### 1. Database Requirements
- PostgreSQL 12 or higher
- Minimum 1GB RAM
- SSL support recommended
- Regular backups configured

#### 2. Environment Variables
```bash
# PostgreSQL Configuration
GEL_DATABASE_URL=postgresql://username:password@host:port/database

# Optional: Force database type
DATABASE_TYPE=postgresql
```

#### 3. Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add GEL_DATABASE_URL

# Deploy
vercel --prod
```

#### 4. Database Migrations
```bash
# Run migrations after deployment
npm run migrate:gel
```

### Edge Config Setup

#### 1. Create Edge Config
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Edge Config**
3. Click **Create Edge Config**
4. Name it (e.g., "konbase-config")
5. Copy the **Edge Config ID**

#### 2. Configure Access Token
1. In Edge Config settings, go to **Access Tokens**
2. Create **Read Access Token**
3. Copy the token value

#### 3. Environment Variables
```bash
# Edge Config Configuration
EDGE_CONFIG_ID=your-edge-config-id
EDGE_CONFIG_READ_ACCESS_TOKEN=your-read-access-token

# Optional: Force database type
DATABASE_TYPE=edge-config
```

#### 4. Vercel Deployment
```bash
# Set environment variables
vercel env add EDGE_CONFIG_ID
vercel env add EDGE_CONFIG_READ_ACCESS_TOKEN

# Deploy
vercel --prod
```

### Vercel Blob Setup

#### 1. Create Blob Store
1. Go to [Vercel Storage Dashboard](https://vercel.com/dashboard/storage)
2. Click **Create Blob Store**
3. Choose a region close to your users
4. Name your store (e.g., "konbase-files")

#### 2. Configure Access Token
1. In your blob store settings, go to **Access Tokens**
2. Create **Read/Write Token**
3. Copy the token value

#### 3. Environment Variables
```bash
# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=your-blob-read-write-token

# Optional: Force storage type
STORAGE_TYPE=vercel-blob
```

#### 4. Vercel Deployment
```bash
# Set environment variables
vercel env add BLOB_READ_WRITE_TOKEN

# Deploy
vercel --prod
```

## Environment Configuration

### Development (.env.local)
```bash
# NextAuth Configuration
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (choose one)
# Option 1: PostgreSQL
GEL_DATABASE_URL=postgresql://user:password@localhost:5432/konbase

# Option 2: Edge Config
EDGE_CONFIG_ID=your-edge-config-id
EDGE_CONFIG_READ_ACCESS_TOKEN=your-read-access-token

# File Storage Configuration
# Option 1: Vercel Blob (Recommended)
BLOB_READ_WRITE_TOKEN=your-blob-read-write-token

# Option 2: Local Storage (Development)
# LOCAL_STORAGE_PATH=./uploads

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Application Settings
APP_NAME=KonBase
APP_URL=http://localhost:3000
```

### Production (Vercel Environment Variables)
```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-production-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-app.vercel.app

# Database Configuration (choose one)
# Option 1: PostgreSQL
GEL_DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Edge Config
EDGE_CONFIG_ID=your-edge-config-id
EDGE_CONFIG_READ_ACCESS_TOKEN=your-read-access-token

# File Storage Configuration (choose one)
# Option 1: Vercel Blob (Recommended)
BLOB_READ_WRITE_TOKEN=your-blob-read-write-token

# Option 2: Local Storage (Not recommended for production)
# LOCAL_STORAGE_PATH=./uploads

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Application Settings
APP_NAME=KonBase
APP_URL=https://your-app.vercel.app
```

## Setup Wizard

The application includes a comprehensive setup wizard that works with both database and storage types:

### 1. Database Selection
- Choose between PostgreSQL and Edge Config
- Real-time connection testing
- Configuration validation

### 2. File Storage Configuration
- Choose between Vercel Blob and Local Storage
- Real-time storage testing
- Performance monitoring

### 3. Admin User Creation
- Create super administrator account
- Configure 2FA (optional)
- Works with both database types

### 4. Association Setup
- Create first association
- Configure association details
- Set up admin membership

### 5. System Configuration
- Configure system settings
- Set up email (optional)
- Complete setup process

## API Endpoints

### Health Check
```bash
GET /api/health
```
Returns database status and type:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "databaseType": "postgresql"
  },
  "latency": 45
}
```

### Setup Status
```bash
GET /api/setup/status
```
Returns setup completion status:
```json
{
  "setupComplete": false,
  "databaseType": "postgresql",
  "databaseAvailable": true,
  "userCount": 0,
  "associationCount": 0
}
```

### Edge Config Check
```bash
GET /api/setup/check-edge-config
```
Returns Edge Config configuration status:
```json
{
  "success": true,
  "configured": true,
  "message": "Edge Config is properly configured and accessible",
  "latency": 2,
  "hasData": false
}
```

### Blob Storage Check
```bash
GET /api/setup/check-blob-storage
```
Returns blob storage configuration status:
```json
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

### File Upload
```bash
POST /api/upload
Content-Type: multipart/form-data

# Form Data
- file: File (required)
- name: string (optional)
- description: string (optional)
- itemId: string (optional)
- conventionId: string (optional)

# Headers
- x-association-id: string (required)
```
Returns uploaded file information:
```json
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

## Performance Comparison

### Database Options
| Feature | PostgreSQL | Edge Config |
|---------|------------|-------------|
| Query Latency | 50-200ms | < 15ms |
| Global Distribution | ❌ | ✅ |
| Complex Queries | ✅ | ❌ |
| Write Operations | ✅ | Limited |
| Data Size Limits | Large | Small |
| ACID Compliance | ✅ | ❌ |
| Connection Overhead | High | None |

### Storage Options
| Feature | Vercel Blob | Local Storage |
|---------|-------------|---------------|
| Upload Latency | < 15ms | < 5ms |
| Download Latency | < 15ms | < 5ms |
| Global Distribution | ✅ | ❌ |
| CDN Caching | ✅ | ❌ |
| File Size Limits | Large | Limited by disk |
| Automatic Scaling | ✅ | ❌ |
| Backup & Recovery | ✅ | Manual |

## Troubleshooting

### Common Issues

#### PostgreSQL Issues
1. **Connection Timeout**
   - Check database URL format
   - Verify network connectivity
   - Check firewall settings

2. **Migration Failures**
   - Ensure database exists
   - Check user permissions
   - Verify schema compatibility

#### Edge Config Issues
1. **"Edge Config is not configured"**
   - Check `EDGE_CONFIG_ID` environment variable
   - Verify Edge Config exists in Vercel dashboard

2. **"Edge Config is configured but not accessible"**
   - Check read access token
   - Verify Edge Config permissions
   - Ensure Edge Config is not empty

#### Blob Storage Issues
1. **"Storage service is not available"**
   - Check `BLOB_READ_WRITE_TOKEN` environment variable
   - Verify blob store exists in Vercel dashboard
   - Check token permissions

2. **"File upload failed"**
   - Check file size (max 10MB)
   - Verify file type is allowed
   - Check blob store quota and limits

3. **"File not found" errors**
   - Verify file path is correct
   - Check if file was properly uploaded
   - Ensure blob store is accessible

### Debug Commands

```bash
# Check application health
curl https://your-app.vercel.app/api/health

# Check setup status
curl https://your-app.vercel.app/api/setup/status

# Test Edge Config (if using)
curl https://your-app.vercel.app/api/setup/check-edge-config

# Test Blob Storage (if using)
curl https://your-app.vercel.app/api/setup/check-blob-storage

# Test file upload
curl -X POST https://your-app.vercel.app/api/upload \
  -H "x-association-id: test-assoc" \
  -F "file=@test.pdf"
```

## Migration Between Database Types

### From PostgreSQL to Edge Config
1. Export data from PostgreSQL
2. Transform to Edge Config format
3. Import to Edge Config
4. Update environment variables
5. Test thoroughly

### From Edge Config to PostgreSQL
1. Export data from Edge Config
2. Transform to PostgreSQL format
3. Import to PostgreSQL
4. Update environment variables
5. Test thoroughly

## Migration Between Storage Types

### From Local to Vercel Blob
1. Create blob store in Vercel
2. Get read/write token
3. Set environment variables
4. Migrate files using migration script
5. Test file uploads and downloads

### From Vercel Blob to Local
1. Export files from blob store
2. Download to local directory
3. Update environment variables
4. Test local file serving
5. Verify all files accessible

## Best Practices

### PostgreSQL
- Use connection pooling
- Implement proper indexing
- Regular backups
- Monitor performance
- Use SSL connections

### Edge Config
- Keep data size small (< 1MB per key)
- Use consistent key naming
- Leverage built-in caching
- Monitor latency
- Regular data validation

### Vercel Blob
- Optimize images before upload
- Use appropriate cache settings
- Monitor storage usage and costs
- Implement file cleanup routines
- Regular backup of critical files

### Local Storage
- Regular file system backups
- Monitor disk space usage
- Implement file cleanup
- Secure file permissions
- Regular maintenance

### General
- Use environment-specific configurations
- Implement proper error handling
- Monitor application health
- Regular security updates
- Test both database types

## Monitoring

### Health Monitoring
- Use `/api/health` endpoint
- Monitor database connectivity
- Track response times
- Set up alerts

### Performance Monitoring
- Monitor query latency
- Track error rates
- Monitor resource usage
- Set up dashboards

## Security Considerations

### PostgreSQL
- Use strong passwords
- Enable SSL
- Regular security updates
- Access control
- Audit logging

### Edge Config
- Secure access tokens
- Regular token rotation
- Monitor access patterns
- Data encryption
- Access logging

### Vercel Blob
- Secure read/write tokens
- Regular token rotation
- Monitor storage access
- File type validation
- Access control implementation

### Local Storage
- Secure file permissions
- Regular security updates
- Access control
- File encryption for sensitive data
- Audit logging

## Support

### Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Edge Config Documentation](https://vercel.com/docs/edge-config)
- [Vercel Blob Documentation](https://vercel.com/docs/vercel-blob)
- [KonBase Documentation](./README.md)
- [KonBase Blob Integration](./VERCEL-BLOB-INTEGRATION.md)

### Community
- GitHub Issues
- Discord Community
- Stack Overflow

## Conclusion

KonBase now provides flexible database and storage options to suit different use cases:

### Database Options
- **PostgreSQL**: For complex applications with large datasets
- **Edge Config**: For high-performance applications with configuration data

### Storage Options
- **Vercel Blob**: For production applications requiring global file distribution
- **Local Storage**: For development and small deployments

All options are fully supported with comprehensive setup tools, monitoring, and documentation. The unified architecture ensures seamless operation across different deployment environments, making it easy to scale from development to production.
