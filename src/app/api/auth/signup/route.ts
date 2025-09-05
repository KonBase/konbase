import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { geldb } from '@/lib/db/gel'

export async function POST(req: Request) {
  try {
    const { email, password, displayName } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    // Create user and profile records
    const user = await geldb.querySingle(`
      INSERT INTO users (email, hashed_password)
      VALUES (<str>$1, <str>$2)
      RETURNING *
    `, [email, hashed]) as any

    await geldb.query(`
      INSERT INTO profiles (user_id, display_name)
      VALUES (<str>$1, <str>$2)
    `, [user.id, displayName ?? email])

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Failed to sign up' }, { status: 500 })
  }
}
