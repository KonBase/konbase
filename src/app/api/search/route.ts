import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { geldb } from '@/lib/db/gel'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  if (!q) return NextResponse.json({ data: [] })
  const memberships = await geldb.query(`
    SELECT association_id FROM association_members 
    WHERE profile_id = <str>$1
  `, [session.user.id]) as any
  const assocIds = (memberships || []).map((m: any) => m.association_id)
  if (!assocIds.length) return NextResponse.json({ data: [] })
  
  const items = await geldb.query(`
    SELECT id, name, association_id FROM items
    WHERE association_id = ANY(<str>$1) AND name ILIKE <str>$2
    LIMIT 10
  `, [assocIds, `%${q}%`]) as any
  
  const conventions = await geldb.query(`
    SELECT id, name, association_id FROM conventions
    WHERE association_id = ANY(<str>$1) AND name ILIKE <str>$2
    LIMIT 10
  `, [assocIds, `%${q}%`]) as any
  return NextResponse.json({ data: { items: items || [], conventions: conventions || [] } })
}
