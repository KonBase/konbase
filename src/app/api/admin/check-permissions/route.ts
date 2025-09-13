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

    // Check if user has super admin role
    const user = (await dataAccess.executeQuerySingle(
      `
      SELECT role FROM users WHERE id = $1
    `,
      [session.user.id]
    )) as { role: string } | null;

    const isSuperAdmin = user?.role === 'super_admin';

    return NextResponse.json({
      isSuperAdmin,
      role: user?.role,
      success: true,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions', success: false },
      { status: 500 }
    );
  }
}
