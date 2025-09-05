import { geldb } from './gel'

export async function requireAssociationMember(userId: string, associationId: string) {
  const sql = `SELECT role FROM association_members WHERE profile_id = $1 AND association_id = $2`
  const result = await geldb.query(sql, [userId, associationId])
  const member = result[0] // Assuming result is an array; take first row for single-like behavior
  if (!member) throw new Error('Forbidden')
  return member
}

export function hasRoleOrAbove(role: string, required: string) {
  const order = ['guest','member','manager','admin','system_admin','super_admin']
  return order.indexOf(role) >= order.indexOf(required)
}
