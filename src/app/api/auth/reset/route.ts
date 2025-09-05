import { NextRequest, NextResponse } from 'next/server'
import { geldb } from '@/lib/db/gel'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const t = await geldb.querySingle(`
    SELECT * FROM password_reset_tokens 
    WHERE token = <str>$1 
      AND used = false 
      AND expires_at > NOW()
  `, [token]) as any
  if (!t) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  const hashed = await bcrypt.hash(password, 10)
  await geldb.query(`
    UPDATE users SET hashed_password = <str>$1 WHERE id = <str>$2
  `, [hashed, t.user_id])
  await geldb.query(`
    UPDATE password_reset_tokens SET used = true WHERE id = <str>$1
  `, [t.id])
  return NextResponse.json({ success: true })
}
