# Security Policy

## Overview

The KonBase Convention Management System prioritizes security to protect user data, inventory records, and organizational information. This document outlines our approach to security and provides guidance for reporting vulnerabilities.

## Reporting a Vulnerability

We take security issues seriously. If you discover a security vulnerability within KonBase, please:

1. **Do not** disclose the vulnerability publicly
2. Email details to [security@konbase.com](mailto:security@konbase.com)
3. Include steps to reproduce the issue
4. If possible, provide suggestions for resolving the issue

We strive to acknowledge reports within 48 hours and will work to address verified vulnerabilities promptly. We appreciate your assistance in keeping KonBase secure.

## Authentication and Authorization

### Authentication Methods

- Email/password with strong password requirements
- OAuth providers (Google, Microsoft)
- Two-Factor Authentication (2FA) via TOTP

### Role-Based Access Control

KonBase implements comprehensive role-based access control:

- **Super Admin**: Complete system access with administrative privileges
- **Admin**: Association management and user administration capabilities
- **Manager**: Equipment and convention management permissions
- **Member**: Standard user privileges
- **Guest**: Limited read-only access

### Security Features

- Enforced 2FA for administrative accounts
- Email verification requirements
- Configurable session timeouts
- Audit logging for sensitive operations

## Data Protection

### Database Security

- Row Level Security (RLS) implemented via Supabase PostgreSQL policies
- Secure function-based access control for cross-table operations
- Security-definer functions to enforce permission boundaries

### File Storage

- Strict file size limitations (default 2MB)
- MIME type restrictions for uploaded files
- Secure bucket policies for user-specific content

### Encryption

- Encrypted data at rest via Supabase
- HTTPS required for all communications
- Secure token handling for authentication

## User Responsibilities

As a user of KonBase, you are responsible for:

1. Maintaining the confidentiality of your account credentials
2. Setting up and using Two-Factor Authentication when available
3. Creating strong, unique passwords
4. Logging out from shared devices
5. Reporting suspicious activities to your association administrator

## System Security Features

- **Audit Logging**: Critical system changes are recorded with user information
- **Regular Backups**: Configurable backup frequency for data protection
- **Session Management**: Automatic session termination after configurable inactivity periods
- **Permission Enforcement**: Continuous validation of user permissions for sensitive operations

## Compliance and Updates

KonBase is committed to maintaining security best practices by:

1. Regularly updating dependencies to address security vulnerabilities
2. Conducting security reviews of code changes
3. Implementing security improvements based on industry standards
4. Responding promptly to reported security concerns

## Security Roadmap

We continuously work to enhance security. Planned enhancements include:

- Advanced threat detection
- Enhanced audit capabilities
- Additional authentication options
- Expanded encryption coverage

---

This security policy will be updated as the KonBase platform evolves. For questions regarding this policy, please contact [security@konbase.com](mailto:security@konbase.com).
