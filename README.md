<div align="center">
  <img src="./.github/1.svg" alt="KonBase Logo" width="300" />
</div>

<p align="center">
  <a href="https://github.com/KonBase/KonBase/stargazers">
    <img src="https://img.shields.io/github/stars/KonBase/konbase-open-source" alt="Stars" />
  </a>
  <a href="https://github.com/KonBase/KonBase/network/members">
    <img src="https://img.shields.io/github/forks/KonBase/konbase-open-source" alt="Forks" />
  </a>
  <a href="https://deepscan.io/dashboard#view=project&tid=26785&pid=29370&bid=943878"><img src="https://deepscan.io/api/teams/26785/projects/29370/branches/943878/badge/grade.svg" alt="DeepScan grade"></a>
  <a href="https://github.com/KonBase/KonBase/issues">
    <img src="https://img.shields.io/github/issues/KonBase/konbase-open-source" alt="Issues" />
  </a>
  <a href="./LICENSE.md">
    <img src="https://img.shields.io/github/license/KonBase/konbase-open-source" alt="License" />
  </a>
</p>

# KonBase - Modern Inventory & Convention Management System

KonBase is a comprehensive inventory and convention management system built for associations that organize events and need to track their equipment and supplies. This modernized version is built with Next.js 15, Material UI v7, and supports both PostgreSQL and Vercel Edge Config for ultra-fast data access.

## 🚀 Quick Start

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KonBase/konbase)

### Local Development
```bash
# Clone the repository
git clone https://github.com/KonBase/konbase.git
cd konbase

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Database Options](#-database-options)
- [File Storage Options](#-file-storage-options)
- [Setup Instructions](#-setup-instructions)
- [Deployment Guide](#-deployment-guide)
- [API Documentation](#-api-documentation)
- [Admin Panel](#-admin-panel)
- [Branding System](#-branding-system)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [Community](#-community)
- [License](#-license)

## ✨ Key Features

### 🏢 Association Management
- **Association Registration**: Complete profile management with custom branding
- **User Management**: Role-based access control with permission levels
- **Inventory Management**: Categorization, location tracking, and warranty management
- **Equipment Sets**: Pre-configured equipment packages for events
- **Import/Export**: Bulk data operations with CSV support
- **Local Backup**: Automated backup capabilities

### 🎪 Convention Management
- **Event Creation**: Create conventions from association templates
- **Equipment Tracking**: Issue and return tracking with real-time status
- **Consumable Items**: Track usage and inventory levels
- **Room Mapping**: Location-based equipment organization
- **Requirements Gathering**: Automated fulfillment tracking
- **Comprehensive Logging**: Complete audit trail of all actions
- **Reports Generation**: Custom reports for post-event analysis
- **Archiving**: Post-convention data archiving

### 🔐 Security Features
- **Role-Based Access Control**: Granular permission system
- **Super Admin Role**: Full system access and management
- **Two-Factor Authentication**: Enhanced security for sensitive operations
- **Data Encryption**: Sensitive information protection
- **Audit Logging**: Complete security event tracking

### 🎨 Custom Branding
- **Admin Panel Branding**: Customize logos, colors, and styling
- **File Upload System**: Upload custom assets with Vercel Blob support
- **Theme Customization**: CSS and HTML customization options
- **PWA Support**: Progressive Web App with custom manifest

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript** - Static typing for better developer experience
- **Material UI v7** - Modern React component library
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Hook Form** - Form validation and management
- **TanStack Query** - Asynchronous state management
- **Lucide Icons** - Beautiful open source icons
- **Recharts** - Data visualization components

### Backend
- **GelDB** - Modern PostgreSQL client with type safety
- **Auth.js (NextAuth)** - Authentication with multiple providers
- **PostgreSQL** - Robust relational database
- **Vercel Edge Config** - Ultra-fast configuration storage
- **Row Level Security (RLS)** - Database-level security policies

### Storage & Deployment
- **Vercel Blob** - Global file storage with CDN
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD for automatic deployment

## 🗄 Database Options

KonBase supports multiple database solutions to fit different use cases:

### 1. PostgreSQL GelDB (Traditional)
- **Best for**: Complex queries, large datasets, transactional operations
- **Performance**: 50-200ms query latency
- **Features**: Full SQL support, ACID compliance, complex relationships
- **Use Cases**: Production applications, complex data relationships

### 2. Vercel Edge Config (Ultra-fast)
- **Best for**: Configuration data, feature flags, small datasets
- **Performance**: < 15ms latency at P99
- **Features**: Global edge distribution, ultra-low latency, built-in caching
- **Use Cases**: High-performance applications, configuration management
- **⚠️ Limitation**: Read-only in production (requires PostgreSQL for setup operations)

## 📁 File Storage Options

### 1. Vercel Blob (Recommended)
- **Best for**: Production applications, global distribution
- **Performance**: < 15ms latency at P99
- **Features**: Global CDN, automatic scaling, built-in caching
- **Use Cases**: Production deployments, global file distribution

### 2. Local Storage (Development)
- **Best for**: Development, testing, small deployments
- **Performance**: Direct file system access
- **Features**: No external dependencies, easy debugging
- **Use Cases**: Local development, testing environments

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or Docker for containerized setup)
- Git
- Vercel account (for Edge Config and Blob storage)

### Environment Configuration

Create `.env.local` with the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (choose one)
# Option 1: PostgreSQL
GEL_DATABASE_URL=postgresql://username:password@localhost:5432/konbase

# Option 2: Edge Config
EDGE_CONFIG_ID=your-edge-config-id
EDGE_CONFIG_READ_ACCESS_TOKEN=your-read-access-token

# File Storage Configuration (choose one)
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

### Database Setup

#### PostgreSQL Setup
1. Install PostgreSQL 12 or higher
2. Create a database named `konbase`
3. Set the `GEL_DATABASE_URL` environment variable
4. Run migrations: `npm run db:migrate`

#### Edge Config Setup
⚠️ **Important**: Edge Config is **read-only** in production. For setup operations (creating admin users, associations), you must also configure PostgreSQL.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Edge Config**
3. Create a new Edge Config
4. Set `EDGE_CONFIG_ID` and `EDGE_CONFIG_READ_ACCESS_TOKEN`
5. **Also set** `GEL_DATABASE_URL` for setup operations

### File Storage Setup

#### Vercel Blob Setup
1. Go to [Vercel Storage Dashboard](https://vercel.com/dashboard/storage)
2. Create a new Blob Store
3. Get the Read/Write Token
4. Set `BLOB_READ_WRITE_TOKEN` environment variable

#### Local Storage Setup
1. Create uploads directory: `mkdir uploads`
2. Set `LOCAL_STORAGE_PATH=./uploads`

### Running the Application

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

Access the application at `http://localhost:3000`

## 🚀 Deployment Guide

### Vercel Deployment (Recommended)

#### 1. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KonBase/konbase)

#### 2. Manual Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### 3. Environment Variables
Set the following in your Vercel dashboard:

**Required:**
```bash
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
```

**Database (choose one):**
```bash
# PostgreSQL
GEL_DATABASE_URL=postgresql://user:pass@host:port/db

# Edge Config
EDGE_CONFIG_ID=your-edge-config-id
EDGE_CONFIG_READ_ACCESS_TOKEN=your-read-access-token
```

**Storage (choose one):**
```bash
# Vercel Blob
BLOB_READ_WRITE_TOKEN=your-blob-read-write-token

# Local Storage
LOCAL_STORAGE_PATH=./uploads
```

### Docker Deployment

#### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Access the application
open http://localhost:3000
```

#### Production
```bash
# Use the automated setup script
./scripts/setup-production.sh

# Or manually:
cp env.production .env
# Edit .env with your values
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Comparison

| Feature | PostgreSQL | Edge Config | Vercel Blob | Local Storage |
|---------|------------|-------------|-------------|---------------|
| Query Latency | 50-200ms | < 15ms | < 15ms | < 5ms |
| Global Distribution | ❌ | ✅ | ✅ | ❌ |
| Complex Queries | ✅ | ❌ | ❌ | ❌ |
| Write Operations | ✅ | Limited | ✅ | ✅ |
| Data Size Limits | Large | Small | Large | Limited |
| ACID Compliance | ✅ | ❌ | ❌ | ❌ |
| Connection Overhead | High | None | None | None |

## 📚 API Documentation

### Health Check
```bash
GET /api/health
```
Returns system health status and database type.

### Setup Status
```bash
GET /api/setup/status
```
Returns setup completion status and configuration.

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

### File Serving
```bash
GET /api/files/[...path]

# Examples
GET /api/files/documents/assoc_123/doc_1234567890.pdf
GET /api/files/images/assoc_123/avatar_1234567890.jpg
```

### Database Health
```bash
# PostgreSQL
GET /api/setup/test-database

# Edge Config
GET /api/setup/check-edge-config

# Blob Storage
GET /api/setup/check-blob-storage
```

## 🎛 Admin Panel

The admin panel provides comprehensive system management:

### System Overview
- **Dashboard**: Real-time system statistics
- **Health Monitoring**: Database and storage status
- **Performance Metrics**: Response times and usage statistics

### Association Management
- **Create/Edit Associations**: Manage association profiles
- **User Management**: Assign roles and permissions
- **Settings Configuration**: Customize association settings

### User Management
- **User Administration**: Create, edit, and manage users
- **Role Assignment**: Assign and modify user roles
- **Permission Management**: Granular access control

### Global Settings
- **System Configuration**: Global application settings
- **Email Configuration**: SMTP and notification settings
- **Security Settings**: Authentication and security policies

### Branding Management
- **Custom Branding**: Upload logos, favicons, and app icons
- **Color Customization**: Set primary, secondary, and accent colors
- **CSS Customization**: Custom styling and themes
- **PWA Configuration**: Progressive Web App settings

### Audit Logs
- **Activity Tracking**: Complete audit trail
- **Security Events**: Login attempts and security events
- **System Changes**: Configuration and data changes

## 🎨 Branding System

KonBase includes a comprehensive branding system that allows complete customization:

### Features
- **Custom Logos**: Upload and manage logos for different contexts
- **Color Themes**: Customize primary, secondary, and accent colors
- **File Assets**: Upload custom favicons, app icons, and images
- **CSS Customization**: Add custom CSS for advanced styling
- **HTML Customization**: Custom HTML for head section
- **PWA Support**: Custom manifest and app icons

### Usage
1. Access the Admin Panel
2. Navigate to the "Branding" tab
3. Upload custom assets or modify colors
4. Preview changes in real-time
5. Save configuration

### Asset Types
- **Logo**: Main application logo
- **Favicon**: Browser tab icon
- **App Icon**: PWA and mobile app icon
- **Apple Touch Icon**: iOS home screen icon

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database health
curl https://your-app.vercel.app/api/health

# Test specific database
curl https://your-app.vercel.app/api/setup/check-edge-config
curl https://your-app.vercel.app/api/setup/test-database
```

#### File Upload Issues
```bash
# Check storage health
curl https://your-app.vercel.app/api/setup/check-blob-storage

# Test file upload
curl -X POST https://your-app.vercel.app/api/upload \
  -H "x-association-id: test-assoc" \
  -F "file=@test.pdf"
```

#### Build Issues
```bash
# Test build locally
npm run build

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint
```

### Debug Commands
```bash
# View deployment logs
vercel logs

# Check environment variables
vercel env ls

# Test file serving
curl https://your-app.vercel.app/api/files/documents/test.pdf
```

## 🤝 Contributing

We welcome contributions to KonBase! Here's how you can help:

### Ways to Contribute
- **Code Contributions**: Fix bugs, add features, improve performance
- **Documentation**: Improve or expand documentation
- **Bug Reports**: Submit issues for any bugs you encounter
- **Feature Requests**: Suggest new features or improvements
- **Testing**: Help test the application and provide feedback

### Contribution Process
1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Code Style
- Follow the existing code style
- Use TypeScript for type safety
- Write tests for new features
- Update documentation for significant changes

### Commit Messages
Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `style:` for code style changes
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for build process or auxiliary tool changes

## 🌐 Community

Join our community to get help, share ideas, and connect with other KonBase users:

- **Discord**: Join our [Discord server](https://discord.gg/wt6JYqBRzU) for discussions and support
- **GitHub Issues**: Report bugs or request features through [GitHub Issues](https://github.com/KonBase/konbase/issues)
- **Discussions**: Participate in [GitHub Discussions](https://github.com/KonBase/konbase/discussions) for general topics

### Support the Project
If you find KonBase helpful, consider supporting the project:

- **GitHub Sponsors**: Support the development team directly through GitHub
- **Buy Me a Coffee**: [Buy us a coffee](https://www.buymeacoffee.com/konbase) to fuel development

## 📄 License

KonBase is licensed under the [MIT License](./LICENSE.md) - see the LICENSE.md file for details.

---

<p align="center">
  Made with ❤️ by the KonBase community
</p>