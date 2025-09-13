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
        systemName,
        systemDescription,
        systemEmail,
        systemUrl,
        enableRegistration,
        enableInvitations,
        enableTwoFactor,
        enableAuditLogs,
        enableNotifications,
        enableChat,
        enableFileUploads,
        maxFileSize,
        allowedFileTypes,
        enableEmailNotifications,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        enableBlobStorage,
        blobReadWriteToken,
        enableEdgeConfig,
        edgeConfigId,
        edgeConfigReadAccessToken,
      } = await request.json();

      // eslint-disable-next-line no-console
      console.log('Configuring system settings...');

      // Check if PostgreSQL is configured
      if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
        return NextResponse.json(
          {
            error: 'PostgreSQL database configuration not found',
            suggestion:
              'Please configure POSTGRES_URL or DATABASE_URL environment variable',
          },
          { status: 400 }
        );
      }

      // Get PostgreSQL data access layer
      const dataAccess = createDataAccessLayer('postgresql');

      // Test database connection first
      // eslint-disable-next-line no-console
      console.log('Testing database connection...');
      const healthCheck = await dataAccess.healthCheck();
      // eslint-disable-next-line no-console
      console.log('Database health check:', healthCheck);

      if (healthCheck.status !== 'healthy') {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: `Database is ${healthCheck.status}`,
            suggestion:
              'Please check your database configuration and ensure the database is accessible',
          },
          { status: 500 }
        );
      }

      // Configure system settings
      const settings = {
        systemName: systemName || 'KonBase',
        systemDescription: systemDescription || 'Association Management System',
        systemEmail: systemEmail || 'admin@konbase.local',
        systemUrl: systemUrl || 'http://localhost:3000',
        enableRegistration: enableRegistration ?? true,
        enableInvitations: enableInvitations ?? true,
        enableTwoFactor: enableTwoFactor ?? true,
        enableAuditLogs: enableAuditLogs ?? true,
        enableNotifications: enableNotifications ?? true,
        enableChat: enableChat ?? true,
        enableFileUploads: enableFileUploads ?? true,
        maxFileSize: maxFileSize || 10485760, // 10MB
        allowedFileTypes: allowedFileTypes || [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
        ],
        enableEmailNotifications: enableEmailNotifications ?? false,
        smtpHost: smtpHost || '',
        smtpPort: smtpPort || 587,
        smtpUser: smtpUser || '',
        smtpPassword: smtpPassword || '',
        enableBlobStorage: enableBlobStorage ?? false,
        blobReadWriteToken: blobReadWriteToken || '',
        enableEdgeConfig: enableEdgeConfig ?? false,
        edgeConfigId: edgeConfigId || '',
        edgeConfigReadAccessToken: edgeConfigReadAccessToken || '',
      };

      // eslint-disable-next-line no-console
      console.log('Saving system settings...');

      // Save each setting individually
      for (const [key, value] of Object.entries(settings)) {
        await dataAccess.setSystemSetting(key, JSON.stringify(value));
      }

      // eslint-disable-next-line no-console
      console.log('System settings saved successfully');

      return NextResponse.json({
        success: true,
        message: 'System configuration saved successfully',
        settings: settings,
        healthCheck: healthCheck,
      });
    };

    // Race between operation and timeout
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return result as NextResponse;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Configure system error:', error);

    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json(
        {
          error: 'Request timeout - database operation took too long',
          suggestion: 'Please check your database connection and try again',
        },
        { status: 504 }
      );
    }

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.message.includes('POSTGRES_URL') ||
        error.message.includes('DATABASE_URL')
      ) {
        return NextResponse.json(
          {
            error: 'PostgreSQL database configuration is required',
            suggestion:
              'Please provide POSTGRES_URL or DATABASE_URL environment variable',
          },
          { status: 400 }
        );
      }

      if (
        error.message.includes('connection') ||
        error.message.includes('timeout')
      ) {
        return NextResponse.json(
          {
            error: 'Database connection failed',
            details: error.message,
            suggestion:
              'Please check your PostgreSQL database configuration and ensure the database is accessible',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to configure system',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please check your database configuration and try again',
      },
      { status: 500 }
    );
  }
}
