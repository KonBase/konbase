# KonBase Vercel Deployment Guide

This guide helps you deploy KonBase to Vercel with CI/CD automation and production-ready configuration.

## 🚀 Quick Start

### 1. Prerequisites
- Vercel account
- GitHub repository
- Environment variables configured

### 2. One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/konbase)

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

## 📞 Support

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Status](https://vercel-status.com)

### KonBase Support
- Check [main README.md](README.md)
- Open GitHub issues
- Review deployment logs

## 🎯 Best Practices

1. **Environment Variables**: Use Vercel's environment variable system
2. **Branch Strategy**: Use `main` for production, `develop` for staging
3. **Security**: Regularly update dependencies and scan for vulnerabilities
4. **Monitoring**: Set up alerts for deployment failures
5. **Testing**: Always test in preview before production
6. **Documentation**: Keep deployment docs updated
7. **Backups**: Regular database backups
8. **Performance**: Monitor Core Web Vitals
