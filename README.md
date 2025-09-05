<div align="center">
  <img src="./public/uploads/1.svg" alt="KonBase Logo" width="300" />
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

KonBase is a comprehensive inventory and convention management system built for associations that organize events and need to track their equipment and supplies. This modernized version is built with Next.js 15, Material UI v7, GelDB, and Auth.js for a robust, scalable solution.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## Key Features

### Association Management Module

- Association registration and profile management
- Inventory management with categorization and location tracking
- User management with permission levels
- Warranty and documentation tracking
- Equipment sets management
- Import/export functionality
- Local backup capabilities

### Convention Management Module

- Create convention from association template
- Equipment issuing and return tracking
- Consumable items tracking
- Room/location mapping
- Requirements gathering and fulfillment tracking
- Comprehensive logging of all actions
- Reports generation
- Post-convention archiving

### Security Features

- Role-based access control
- Super-admin role with full system access
- Enhanced security for log files
- Two-factor authentication for sensitive operations
- Data encryption for sensitive information

## Tech Stack

KonBase is built using modern web technologies:

### Frontend

- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript** - Static typing for better developer experience
- **Material UI v7** - Modern React component library
- **Tailwind CSS v4** - Utility-first CSS framework with new CSS-first configuration
- **React Hook Form** - Form validation and management
- **TanStack Query** - Asynchronous state management
- **Lucide Icons** - Beautiful open source icons
- **Recharts** - Data visualization components

### Backend

- **GelDB** - Modern PostgreSQL client with type safety
- **Auth.js (NextAuth)** - Authentication with multiple providers
- **PostgreSQL** - Robust relational database
- **Row Level Security (RLS)** - Database-level security policies

### Deployment

- **Docker** - Containerized deployment
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD for automatic deployment

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (or Docker for containerized setup)
- Git

### Quick Start with Docker

1. Clone the repository
   ```bash
   git clone https://github.com/KonBase/konbase.git
   cd konbase
   ```

2. Copy environment variables
   ```bash
   cp .env.example .env.local
   ```

3. Start with Docker Compose
   ```bash
   docker-compose up -d
   ```

4. Run database migrations
   ```bash
   npm run db:migrate
   ```

5. Access the application at `http://localhost:3000`

### Manual Setup

1. Clone the repository
   ```bash
   git clone https://github.com/KonBase/konbase.git
   cd konbase
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # Database
   GEL_DATABASE_URL=postgresql://username:password@localhost:5432/konbase
   
   # Authentication
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   ```

4. Run database migrations
   ```bash
   npm run db:migrate
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

## Modern Stack (Next.js 15 + Material UI + GelDB)

For the Next.js modernization in this branch:

- Copy `.env.example` to `.env.local` and set:
  - NEXTAUTH_SECRET, NEXTAUTH_URL
  - GEL_DATABASE_URL (Postgres-compatible)
  - GOOGLE_CLIENT_ID/SECRET, DISCORD_CLIENT_ID/SECRET (optional)
- Run database migrations:

```
npm run db:migrate
```

- Run the dev server:

```
npm run dev
```

## Docker Deployment

### 🚀 Quick Start

### Development Environment
```bash
# Clone the repository
git clone https://github.com/your-org/konbase.git
cd konbase

# Start development environment
docker-compose -f docker-compose.dev.yml up -d --build

# Access the application
open http://localhost:3000
```

### Production Environment
```bash
# Use the automated setup script
./scripts/setup-production.sh

# Or manually:
cp env.production .env
# Edit .env with your values
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📁 Configuration Files

| File | Purpose | Environment |
|------|---------|-------------|
| `docker-compose.yml` | Basic development setup | Development |
| `docker-compose.dev.yml` | Enhanced development with hot reload | Development |
| `docker-compose.prod.yml` | Production-ready with security | Production |
| `Dockerfile` | Standard build | Development |
| `Dockerfile.prod` | Optimized production build | Production |
| `env.example` | Environment template | All |
| `env.production` | Production environment template | Production |

## 🔐 Security Configuration

### Required Environment Variables

```bash
# Authentication
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters-long
NEXTAUTH_URL=https://yourdomain.com

# Database
DB_USER=gel
DB_PASSWORD=your-secure-database-password-minimum-16-characters
DB_NAME=konbase_prod

# Application
APP_NAME=KonBase
APP_URL=https://yourdomain.com
```

### Optional Environment Variables

```bash
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (for caching)
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

## 🐳 Docker Commands

### Development
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild and restart
docker-compose -f docker-compose.dev.yml up -d --build
```

### Production
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Backup database
docker-compose -f docker-compose.prod.yml exec geldb pg_dump -U gel konbase_prod > backup.sql
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if database is healthy
   docker-compose logs geldb
   
   # Restart database
   docker-compose restart geldb
   ```

2. **Application Won't Start**
   ```bash
   # Check application logs
   docker-compose logs app
   
   # Verify environment variables
   docker-compose config
   ```

3. **Permission Issues**
   ```bash
   # Fix upload directory permissions
   sudo chown -R 1001:1001 uploads/
   ```

### Health Checks

All services include health checks:
- **App**: HTTP endpoint at `/api/health`
- **Database**: PostgreSQL `pg_isready`
- **Redis**: Redis CLI ping

## 📊 Monitoring

### View Service Status
```bash
# Check all services
docker-compose ps

# Check health status
docker-compose exec app curl -f http://localhost:3000/api/health
```

### Log Management
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

## 🔄 Updates and Maintenance

### Updating KonBase
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Backups
```bash
# Create backup
docker-compose exec geldb pg_dump -U gel konbase_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T geldb psql -U gel konbase_prod < backup.sql
```

### Cleanup
```bash
# Remove unused images
docker image prune -f

# Remove unused volumes (CAUTION: This removes data)
docker volume prune -f

# Complete cleanup (CAUTION: This removes everything)
docker system prune -a -f --volumes
```

## 🌐 Reverse Proxy Setup

For production, use a reverse proxy like Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Vercel Deployment

This guide helps you deploy KonBase to Vercel with CI/CD automation and production-ready configuration.

## Prerequisites

1. **Database Setup**: GelDB is not directly compatible with Vercel's serverless environment. You'll need to use a managed PostgreSQL service.

### Recommended Database Options:

1. **Vercel Postgres** (Recommended)
   - Native Vercel integration
   - Automatic connection pooling
   - Easy setup through Vercel dashboard

2. **Supabase**
   - PostgreSQL-compatible
   - Good free tier
   - Easy migration from GelDB

3. **PlanetScale**
   - MySQL-compatible (requires schema changes)
   - Serverless-friendly
   - Good performance

4. **Railway**
   - PostgreSQL support
   - Easy deployment
   - Good for development

## 🚀 Quick Start

### 1. Prerequisites
- Vercel account
- GitHub repository
- Environment variables configured

### 2. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/KonBase/konbase)

### 3. Manual Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
./scripts/deploy-vercel.sh
```

## 🔧 Configuration

### Environment Variables

Set these in your Vercel dashboard or via CLI:

#### Required
```bash
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=https://yourdomain.vercel.app
GEL_DATABASE_URL=your-database-connection-string
```

#### Optional
```bash
# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# App Configuration
APP_NAME=KonBase
APP_URL=https://yourdomain.vercel.app
```

### Setting Environment Variables

#### Via Vercel CLI:
```bash
vercel env add NEXTAUTH_SECRET
vercel env add GEL_DATABASE_URL
vercel env add GOOGLE_CLIENT_ID
# ... add all required variables
```

#### Via Vercel Dashboard:
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production, Preview, and Development

## 🏗️ CI/CD Pipeline

### GitHub Actions Workflows

#### 1. **CI Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push to `main`/`develop`, Pull Requests
- **Jobs**:
  - Code quality checks (ESLint, TypeScript)
  - Security scanning (Trivy)
  - Build testing
  - Docker image building
  - Automated deployment

#### 2. **Vercel Deploy** (`.github/workflows/vercel-deploy.yml`)
- **Triggers**: Push to `main`/`production`, Pull Requests
- **Jobs**:
  - Lint and test
  - Deploy preview for PRs
  - Deploy production for main branch

### Workflow Features
- ✅ **Automated Testing**: Lint, type check, build validation
- ✅ **Security Scanning**: Vulnerability detection
- ✅ **Preview Deployments**: Every PR gets a preview URL
- ✅ **Production Deployments**: Automatic on main branch
- ✅ **Docker Testing**: Multi-stage Docker builds
- ✅ **Artifact Storage**: Build artifacts preserved

## 📁 Configuration Files

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel deployment configuration |
| `.vercelignore` | Files to exclude from deployment |
| `.github/workflows/ci.yml` | Main CI/CD pipeline |
| `.github/workflows/vercel-deploy.yml` | Vercel-specific deployment |
| `scripts/deploy-vercel.sh` | Manual deployment script |

## 🔐 Security Features

### Vercel Security
- **HTTPS**: Automatic SSL certificates
- **Security Headers**: XSS protection, content type options
- **CORS**: Proper API access control
- **Environment Variables**: Secure secret management

### CI/CD Security
- **Secret Management**: GitHub Secrets for sensitive data
- **Vulnerability Scanning**: Automated security checks
- **Code Quality**: Automated linting and type checking
- **Build Validation**: Ensures only working code deploys

## 🚀 Deployment Strategies

### 1. **Preview Deployments**
- Every pull request gets a preview URL
- Perfect for testing before merging
- Automatic cleanup after PR closure

### 2. **Production Deployments**
- Automatic on `main` branch pushes
- Zero-downtime deployments
- Rollback capability

### 3. **Manual Deployments**
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# Deploy specific branch
vercel --target production
```

## 📊 Monitoring & Analytics

### Vercel Analytics
- **Performance**: Core Web Vitals tracking
- **Usage**: Page views and user analytics
- **Errors**: Automatic error tracking
- **Functions**: Serverless function monitoring

### GitHub Actions Monitoring
- **Build Status**: Visual indicators in PRs
- **Deployment History**: Track all deployments
- **Security Alerts**: Vulnerability notifications

## 🔧 Troubleshooting

### Common Issues

#### 1. **Build Failures**
```bash
# Check build logs
vercel logs

# Test build locally
npm run build
```

#### 2. **Environment Variable Issues**
```bash
# List all environment variables
vercel env ls

# Check specific environment
vercel env pull .env.local
```

#### 3. **Database Connection Issues**
- Ensure `GEL_DATABASE_URL` is correctly formatted
- Check database accessibility from Vercel
- Verify network security groups

### Debug Commands
```bash
# View deployment logs
vercel logs [deployment-url]

# Check function logs
vercel logs --follow

# Inspect environment
vercel env pull .env.local
```

## 🌐 Custom Domain Setup

### 1. **Add Domain in Vercel**
```bash
vercel domains add yourdomain.com
```

### 2. **Configure DNS**
- Add CNAME record pointing to Vercel
- Or use A records for apex domains

### 3. **SSL Certificate**
- Automatic SSL via Vercel
- Let's Encrypt integration

## 📈 Performance Optimization

### Vercel Optimizations
- **Edge Functions**: Global CDN distribution
- **Image Optimization**: Automatic image optimization
- **Caching**: Intelligent caching strategies
- **Bundle Analysis**: Automatic bundle optimization

### Next.js Optimizations
- **Static Generation**: Pre-rendered pages
- **API Routes**: Serverless functions
- **Middleware**: Edge runtime for auth
- **Font Optimization**: Automatic font loading

## 🔄 Updates and Maintenance

### Updating KonBase
```bash
# Pull latest changes
git pull origin main

# Deploy updates
vercel --prod
```

### Environment Updates
```bash
# Update environment variables
vercel env add VARIABLE_NAME

# Redeploy with new env vars
vercel --prod
```

## Contributing

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

## Community

Join our community to get help, share ideas, and connect with other KonBase users:

- **Discord**: Join our [Discord server](https://discord.gg/wt6JYqBRzU) for discussions and support
- **GitHub Issues**: Report bugs or request features through [GitHub Issues](https://github.com/KonBase/konbase/issues)
- **Discussions**: Participate in [GitHub Discussions](https://github.com/KonBase/konbase/discussions) for general topics

### Support the Project

If you find KonBase helpful, consider supporting the project:

- **GitHub Sponsors**: Support the development team directly through GitHub
- **Buy Me a Coffee**: [Buy us a coffee](https://www.buymeacoffee.com/konbase) to fuel development

## License

KonBase is licensed under the [MIT License](./LICENSE.md) - see the LICENSE.md file for details.

---

<p align="center">
  Made with ❤️ by the KonBase community
</p>

