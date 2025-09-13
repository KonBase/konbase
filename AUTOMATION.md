# KonBase Automation System

This document describes the automated code quality, versioning, and deployment system for KonBase.

## 🚀 Quick Start

### For AI Agents (Cursor)

After making code changes, run:

```bash
npm run automation:full
```

This will:

1. ✅ Run quality checks (format, lint, type-check, build)
2. 📊 Update version number
3. 💾 Commit changes with automated message
4. 🚀 Deploy to Vercel

### For Developers

```bash
# Check code quality
npm run quality:check

# Fix code quality issues
npm run quality:fix

# Automated commit
npm run commit:auto

# Automated deployment
npm run deploy:auto
```

## 📋 Available Commands

### Quality Checks

- `npm run quality:check` - Run all quality checks without fixing
- `npm run quality:fix` - Fix formatting and linting issues
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check formatting without fixing
- `npm run lint:fix` - Fix ESLint issues

### Version Management

- `npm run version:update` - Update version number
- Version format: `0.RRRR.MMDDVVV`
  - `RRRR`: Current year (e.g., 2025)
  - `MM`: Current month (e.g., 09)
  - `DD`: Current day (e.g., 11)
  - `VVV`: Version number for the day (001, 002, etc.)

### Automation Scripts

- `npm run automation` - Show help for automation system
- `npm run automation:quality` - Run quality checks only
- `npm run automation:commit` - Run automated commit
- `npm run automation:deploy` - Run automated deployment
- `npm run automation:full` - Run complete automation

### Legacy Scripts

- `npm run commit:auto` - Automated commit with quality checks
- `npm run deploy:auto` - Automated deployment to Vercel

## 🔧 Configuration

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint (eslintrc.json)

- Extends Next.js core web vitals
- Integrates with Prettier
- TypeScript and React rules
- Custom rules for code quality

### Husky Git Hooks

- **Pre-commit**: Runs lint-staged for quality checks
- **Commit-msg**: Validates commit message format

### Lint-staged (.lintstagedrc.json)

- Runs ESLint and Prettier on staged files
- Automatically fixes issues before commit

## 📊 Version Management

### Version Format

Versions follow the format: `0.RRRR.MMDDVVV`

**Examples:**

- `0.2025.0911001` - First commit on September 11, 2025
- `0.2025.0911002` - Second commit on September 11, 2025
- `0.2025.0912001` - First commit on September 12, 2025

### Version Files

- `package.json` - Main version field
- `VERSION` - Plain text version file
- `deployment-info.json` - Deployment tracking

## 💾 Commit Automation

### Commit Message Format

```
Version 0.RRRR.MMDDVVV: description
```

**Examples:**

- `Version 0.2025.0911001: Add PostgreSQL database support`
- `Version 0.2025.0911002: Fix authentication issues`
- `Version 0.2025.0911003: Update UI components`

### Automated Process

1. Update version number
2. Run quality checks (format, lint, type-check, build)
3. Stage all changes
4. Generate commit message based on changes
5. Commit with formatted message
6. Push to GitHub

## 🚀 Deployment Automation

### Vercel Deployment

1. Check Vercel CLI installation
2. Verify login status
3. Run quality checks
4. Deploy to production
5. Run health checks
6. Save deployment info

### Deployment Tracking

- `deployment-info.json` - Contains deployment details
- Version tracking
- URL and timestamp
- Success/failure status

## 🔍 Quality Checks

### Pre-commit Hooks

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking
- Build verification

### Automated Checks

- Code formatting consistency
- Linting errors and warnings
- Type safety validation
- Build success verification

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Husky

```bash
npm run prepare
```

### 3. Install Vercel CLI (for deployment)

```bash
npm install -g vercel
vercel login
```

### 4. Verify Setup

```bash
npm run automation
```

## 📝 Commit Rules

### Commit Message Requirements

- Must start with "Version"
- Must include version number in format `0.RRRR.MMDDVVV`
- Must include descriptive message after colon
- Must describe what was changed

### Valid Examples

- ✅ `Version 0.2025.0911001: Add user authentication`
- ✅ `Version 0.2025.0911002: Fix database connection issues`
- ✅ `Version 0.2025.0911003: Update UI components and styling`

### Invalid Examples

- ❌ `Add new feature` (missing version)
- ❌ `Version 1.0.0: Add feature` (wrong format)
- ❌ `Version 0.2025.0911001` (missing description)

## 🚨 Error Handling

### Quality Check Failures

- Stops automation process
- Shows specific error messages
- Requires manual fixing before proceeding

### Commit Failures

- Validates commit message format
- Checks for staged changes
- Verifies git status

### Deployment Failures

- Logs deployment errors
- Saves failure information
- Provides troubleshooting steps

## 📈 Monitoring

### Version Tracking

- Automatic version increment
- Daily version reset
- Version history in git

### Deployment Monitoring

- Success/failure tracking
- URL and timestamp logging
- Health check verification

## 🔧 Troubleshooting

### Common Issues

#### Quality Check Failures

```bash
# Fix formatting issues
npm run format

# Fix linting issues
npm run lint:fix

# Check specific issues
npm run lint
npm run type-check
```

#### Version Update Issues

```bash
# Manual version update
npm run version:update

# Check current version
cat VERSION
```

#### Deployment Issues

```bash
# Check Vercel login
vercel whoami

# Manual deployment
vercel --prod

# Check deployment status
vercel ls
```

## 📚 Additional Resources

- [Prettier Documentation](https://prettier.io/docs/en/configuration.html)
- [ESLint Documentation](https://eslint.org/docs/user-guide/configuring/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
