import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function GET(req: NextRequest) {
  const dataAccess = createDataAccessLayer();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (!q) return NextResponse.json({ data: [] });
  const memberships = await dataAccess.executeQuery<{
    association_id: string;
  }>(
    `
    SELECT association_id FROM association_members 
    WHERE profile_id = <str>$1
  `,
    [session.user.id]
  );
  const assocIds = memberships.map(m => m.association_id);
  if (!assocIds.length) return NextResponse.json({ data: [] });

  const items = (await dataAccess.executeQuery(
    `
    SELECT id, name, association_id FROM items
    WHERE association_id = ANY(<str>$1) AND name ILIKE <str>$2
    LIMIT 10
  `,
    [assocIds, `%${q}%`]
  )) as unknown;

  const conventions = (await dataAccess.executeQuery(
    `
    SELECT id, name, association_id FROM conventions
    WHERE association_id = ANY(<str>$1) AND name ILIKE <str>$2
    LIMIT 10
  `,
    [assocIds, `%${q}%`]
  )) as unknown;
  return NextResponse.json({
    data: { items: items || [], conventions: conventions || [] },
  });
}
