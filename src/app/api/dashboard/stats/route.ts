import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { getDataAccess } from '@/lib/db/data-access'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dataAccess = getDataAccess()

  // Find one association for user (first membership) - could be driven by UI selector
  const memberships = await dataAccess.getAssociationMembersByProfileId(session.user.id)
  const associationId = memberships?.[0]?.association_id

  if (!associationId) {
    return NextResponse.json({ data: { totalItems: 0, totalConventions: 0, activeConventions: 0, upcomingConventions: 0, itemsNeedingAttention: 0, associationMembers: 0, recentActivity: [], upcomingTasks: [] } })
  }

  // Get conventions for the association
  const conventions = await dataAccess.getConventionsByAssociation(associationId)
  const activeConventions = conventions.filter(conv => conv.status === 'active')
  
  // Get association members count
  const associationMembers = await dataAccess.getAssociationMembersByProfileId(associationId)

  return NextResponse.json({
    data: {
      totalItems: 0, // TODO: Implement items count
      totalConventions: conventions.length,
      activeConventions: activeConventions.length,
      upcomingConventions: 0, // TODO: Calculate upcoming conventions
      itemsNeedingAttention: 0, // TODO: Calculate items needing attention
      associationMembers: associationMembers.length,
      recentActivity: [], // TODO: Implement recent activity
      upcomingTasks: [], // TODO: Implement upcoming tasks
    },
  })
}
