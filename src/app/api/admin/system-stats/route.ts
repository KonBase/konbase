import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb } from '@/lib/db/gel';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await geldb.querySingle(`
      SELECT role FROM users WHERE id = <str>$1
    `, [session.user.id]) as any;

    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get system statistics
    const [
      totalUsers,
      totalAssociations,
      activeConventions,
      totalItems,
      recentUsers,
      systemHealth
    ] = await Promise.all([
      // Total users
      geldb.querySingle(`
        SELECT COUNT(*) as count FROM users
      `) as any,

      // Total associations
      geldb.querySingle(`
        SELECT COUNT(*) as count FROM associations
      `) as any,

      // Active conventions
      geldb.querySingle(`
        SELECT COUNT(*) as count FROM conventions 
        WHERE status = 'active' AND end_date > NOW()
      `) as any,

      // Total items
      geldb.querySingle(`
        SELECT COUNT(*) as count FROM items
      `) as any,

      // Recent users (last 30 days)
      geldb.querySingle(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `) as any,

      // System health metrics
      geldb.querySingle(`
        SELECT 
          COUNT(*) as total_actions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN 1 END) as today_actions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_actions
        FROM audit_logs
      `) as any
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
        }
      },
      success: true
    });
  } catch (error) {
    console.error('System stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system statistics', success: false },
      { status: 500 }
    );
  }
}
