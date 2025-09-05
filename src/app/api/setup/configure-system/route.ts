import { NextRequest, NextResponse } from 'next/server';
import { createDataAccessLayer } from '@/lib/db/data-access';

// Set timeout for the entire operation
const TIMEOUT_MS = 25000; // 25 seconds

export async function POST(request: NextRequest) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS);
  });

  try {
    const operationPromise = async () => {
      const { 
        siteName,
        siteDescription,
        maintenanceMode,
        registrationEnabled,
        emailVerificationRequired,
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        twoFactorRequired,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        fromEmail,
        fromName,
        enableAuditLogs,
        enableNotifications,
        enableChat,
        enableFileUploads,
        enableAnalytics,
        adminUserId,
        associationId,
        databaseType = 'postgresql'
      } = await request.json();

      console.log('Configuring system with database type:', databaseType);

      // Auto-detect database type if not specified
      let actualDatabaseType = databaseType;
      if (databaseType === 'auto' || !databaseType) {
        if (process.env.REDIS_URL) {
          actualDatabaseType = 'redis';
        } else if (process.env.EDGEDB_INSTANCE && process.env.EDGEDB_SECRET_KEY) {
          actualDatabaseType = 'postgresql'; // EdgeDB uses PostgreSQL interface
        } else if (process.env.GEL_DATABASE_URL) {
          actualDatabaseType = 'postgresql';
        } else {
          return NextResponse.json({ 
            error: 'No database configuration found',
            suggestion: 'Please configure REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL'
          }, { status: 400 });
        }
      }

      console.log('Using database type:', actualDatabaseType);
      
      // Create data access layer
      const dataAccess = createDataAccessLayer(actualDatabaseType as 'postgresql' | 'redis');

      // Test database connection first
      console.log('Testing database connection...');
      const healthCheck = await dataAccess.healthCheck();
      console.log('Database health check:', healthCheck);

      if (healthCheck.status !== 'healthy') {
        return NextResponse.json({ 
          error: 'Database connection failed',
          details: `Database is ${healthCheck.status}`,
          suggestion: 'Please check your database configuration and ensure the database is accessible'
        }, { status: 500 });
      }

      // System settings
      const settings = [
        { key: 'site_name', value: siteName, description: 'Site name' },
        { key: 'site_description', value: siteDescription, description: 'Site description' },
        { key: 'maintenance_mode', value: maintenanceMode.toString(), description: 'Maintenance mode' },
        { key: 'registration_enabled', value: registrationEnabled.toString(), description: 'User registration enabled' },
        { key: 'email_verification_required', value: emailVerificationRequired.toString(), description: 'Email verification required' },
        { key: 'session_timeout', value: sessionTimeout.toString(), description: 'Session timeout in minutes' },
        { key: 'max_login_attempts', value: maxLoginAttempts.toString(), description: 'Maximum login attempts' },
        { key: 'password_min_length', value: passwordMinLength.toString(), description: 'Minimum password length' },
        { key: 'two_factor_required', value: twoFactorRequired.toString(), description: 'Two-factor authentication required' },
        { key: 'smtp_host', value: smtpHost, description: 'SMTP host' },
        { key: 'smtp_port', value: smtpPort.toString(), description: 'SMTP port' },
        { key: 'smtp_user', value: smtpUser, description: 'SMTP username' },
        { key: 'smtp_password', value: smtpPassword, description: 'SMTP password' },
        { key: 'from_email', value: fromEmail, description: 'From email address' },
        { key: 'from_name', value: fromName, description: 'From name' },
        { key: 'enable_audit_logs', value: enableAuditLogs.toString(), description: 'Enable audit logs' },
        { key: 'enable_notifications', value: enableNotifications.toString(), description: 'Enable notifications' },
        { key: 'enable_chat', value: enableChat.toString(), description: 'Enable chat system' },
        { key: 'enable_file_uploads', value: enableFileUploads.toString(), description: 'Enable file uploads' },
        { key: 'enable_analytics', value: enableAnalytics.toString(), description: 'Enable analytics' },
      ];

      console.log('Setting system configuration...');
      
      // Set each system setting
      for (const setting of settings) {
        await dataAccess.setSystemSetting(setting.key, setting.value);
      }

      // Mark setup as complete
      console.log('Marking setup as complete...');
      await dataAccess.setSystemSetting('setup_complete', 'true');

      console.log('System configuration completed successfully');

      return NextResponse.json({
        success: true,
        message: 'System configured successfully',
        databaseType: actualDatabaseType,
        healthCheck: healthCheck
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;

  } catch (error) {
    console.error('Configure system error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        { 
          error: 'Request timeout - database operation took too long',
          suggestion: 'Please check your database connection and try again'
        },
        { status: 504 }
      );
    }
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('GEL_DATABASE_URL') || error.message.includes('REDIS_URL')) {
        return NextResponse.json(
          { 
            error: 'Database configuration is required for setup operations',
            suggestion: 'Please provide REDIS_URL, EDGEDB_INSTANCE + EDGEDB_SECRET_KEY, or GEL_DATABASE_URL environment variable'
          },
          { status: 400 }
        );
      }

      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'Database connection failed',
            details: error.message,
            suggestion: 'Please check your database configuration and ensure the database is accessible'
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to configure system', 
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again'
      },
      { status: 500 }
    );
  }
}
