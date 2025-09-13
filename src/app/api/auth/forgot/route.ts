import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createDataAccessLayer } from '@/lib/db/data-access';
import { sendMail } from '@/lib/utils/mailer';

export async function POST(req: Request) {
  const dataAccess = createDataAccessLayer();
  try {
    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    const user = await dataAccess.executeQuerySingle<{ id: string }>(
      `
      SELECT * FROM users WHERE email = <str>$1
    `,
      [email]
    );
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 1000 * 60 * 30); // 30 min
      await dataAccess.executeQuery(
        `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (<str>$1, <str>$2, <timestamp>$3)
      `,
        [user.id, token, expires_at]
      );
      const url = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset?token=${token}`;
      await sendMail({
        to: email,
        subject: 'Reset your KonBase password',
        html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
      });
    }
    // Always succeed to avoid user enumeration
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
