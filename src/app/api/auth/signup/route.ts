import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function POST(req: Request) {
  const dataAccess = createDataAccessLayer();
  try {
    const { email, password, displayName, firstName, lastName } =
      await req.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    // Create user and profile records
    const user = await dataAccess.executeQuerySingle<{ id: string }>(
      `
      INSERT INTO users (email, hashed_password)
      VALUES ($1, $2)
      RETURNING id
    `,
      [email, hashed]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Extract first and last name from displayName if not provided separately
    const finalFirstName = firstName || displayName?.split(' ')[0] || 'User';
    const finalLastName =
      lastName || displayName?.split(' ').slice(1).join(' ') || '';

    await dataAccess.executeQuery(
      `
      INSERT INTO profiles (user_id, first_name, last_name, display_name)
      VALUES ($1, $2, $3, $4)
    `,
      [user.id, finalFirstName, finalLastName, displayName ?? email]
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to sign up';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
