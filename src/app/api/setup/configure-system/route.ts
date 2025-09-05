import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'gel';

export async function POST(request: NextRequest) {
  try {
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
      associationId
    } = await request.json();

    const connectionString = process.env.GEL_DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ 
        error: 'Database connection not configured' 
      }, { status: 500 });
    }

    const client = createClient(connectionString);

    // Create system settings table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Insert system settings
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

    for (const setting of settings) {
      await client.query(`
        INSERT INTO system_settings (key, value, description)
        VALUES (<str>$1, <str>$2, <str>$3)
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = NOW()
      `, [setting.key, setting.value, setting.description]);
    }

    // Mark setup as complete
    await client.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('setup_complete', 'true', 'Setup completion status')
      ON CONFLICT (key) DO UPDATE SET
        value = 'true',
        updated_at = NOW()
    `);

    return NextResponse.json({
      success: true,
      message: 'System configured successfully'
    });
  } catch (error) {
    console.error('Configure system error:', error);
    return NextResponse.json(
      { error: 'Failed to configure system' },
      { status: 500 }
    );
  }
}
