import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dataAccess = createDataAccessLayer();

    // Check if user is super admin
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    if (user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Super admin access required' },
        { status: 403 }
      );
    }

    // Get system statistics
    const [
      totalUsers,
      totalAssociations,
      activeConventions,
      totalItems,
      recentUsers,
      systemHealth,
    ] = await Promise.all([
      // Total users
      dataAccess.executeQuerySingle(`
        SELECT COUNT(*) as count FROM users
      `) as Promise<{ count: number } | null>,

      // Total associations
      dataAccess.executeQuerySingle(`
        SELECT COUNT(*) as count FROM associations
      `) as Promise<{ count: number } | null>,

      // Active conventions
      dataAccess.executeQuerySingle(`
        SELECT COUNT(*) as count FROM conventions 
        WHERE status = 'active' AND end_date > NOW()
      `) as Promise<{ count: number } | null>,

      // Total items
      dataAccess.executeQuerySingle(`
        SELECT COUNT(*) as count FROM items
      `) as Promise<{ count: number } | null>,

      // Recent users (last 30 days)
      dataAccess.executeQuerySingle(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `) as Promise<{ count: number } | null>,

      // System health metrics
      dataAccess.executeQuerySingle(`
        SELECT 
          COUNT(*) as total_actions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_actions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_actions
        FROM audit_logs
      `) as Promise<{
        total_actions: number;
        today_actions: number;
        week_actions: number;
      } | null>,
    ]);

    return NextResponse.json({
      data: {
        totalUsers: totalUsers?.count || 0,
        totalAssociations: totalAssociations?.count || 0,
        activeConventions: activeConventions?.count || 0,
        totalItems: totalItems?.count || 0,
        recentUsers: recentUsers?.count || 0,
        systemHealth: {
          totalActions: systemHealth?.total_actions || 0,
          todayActions: systemHealth?.today_actions || 0,
          weekActions: systemHealth?.week_actions || 0,
        },
      },
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('System stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics', success: false },
      { status: 500 }
    );
  }
}
