import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string | null;
      role?: string | null;
      profile?: Record<string, unknown>;
      associations?: { association: { id: string } }[];
    };
  }
}
