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

    // Check if user has super admin role
    const user = await geldb.querySingle(`
      SELECT role FROM users WHERE id = <str>$1
    `, [session.user.id]) as any;

    const isSuperAdmin = user?.role === 'super_admin';

    return NextResponse.json({ 
      isSuperAdmin,
      role: user?.role,
      success: true 
    });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions', success: false },
      { status: 500 }
    );
  }
}
