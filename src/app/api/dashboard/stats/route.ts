import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { geldb } from '@/lib/db/gel'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find one association for user (first membership) - could be driven by UI selector
  const memberships = await geldb.query(`
    SELECT association_id FROM association_members 
    WHERE profile_id = <str>$1 
    LIMIT 1
  `, [session.user.id]) as any
  const associationId = memberships?.[0]?.association_id

  if (!associationId) {
    return NextResponse.json({ data: { totalItems: 0, totalConventions: 0, activeConventions: 0, upcomingConventions: 0, itemsNeedingAttention: 0, associationMembers: 0, recentActivity: [], upcomingTasks: [] } })
  }

  const [itemsCount, convCount, activeCount, membersCount] = await Promise.all([
    geldb.querySingle(`SELECT COUNT(*) as count FROM items WHERE association_id = <str>$1`, [associationId]) as any,
    geldb.querySingle(`SELECT COUNT(*) as count FROM conventions WHERE association_id = <str>$1`, [associationId]) as any,
    geldb.querySingle(`SELECT COUNT(*) as count FROM conventions WHERE association_id = <str>$1 AND status = 'active'`, [associationId]) as any,
    geldb.querySingle(`SELECT COUNT(*) as count FROM association_members WHERE association_id = <str>$1`, [associationId]) as any,
  ])

  return NextResponse.json({
    data: {
      totalItems: itemsCount?.count ?? 0,
      totalConventions: convCount?.count ?? 0,
      activeConventions: activeCount?.count ?? 0,
      upcomingConventions: 0,
      itemsNeedingAttention: 0,
      associationMembers: membersCount?.count ?? 0,
      recentActivity: [],
      upcomingTasks: [],
    },
  })
}
