import nodemailer from 'nodemailer';

const host: string | undefined = process.env.SMTP_HOST;
const port: number = process.env.SMTP_PORT
  ? Number(process.env.SMTP_PORT)
  : 587;
const user: string | undefined = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || 'no-reply@konbase.local';

export function getTransport() {
  if (!host || !user || !pass) throw new Error('SMTP configuration missing');
  return nodemailer.createTransport({ host, port, auth: { user, pass } });
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const tx = getTransport();
  await tx.sendMail({ from, ...opts });
}
