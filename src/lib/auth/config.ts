import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import DiscordProvider from 'next-auth/providers/discord';
import { getDataAccess } from '@/lib/db/data-access';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'TOTP Code', type: 'text', placeholder: '123456' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase();
        const password = credentials?.password?.toString() ?? '';
        const totpCode = credentials?.totpCode?.toString();
        if (!email || !password) throw new Error('Missing email or password');

        // Get data access layer
        const dataAccess = getDataAccess();

        // Fetch user by email
        const user = await dataAccess.getUserByEmail(email);

        if (!user?.hashed_password) throw new Error('Invalid credentials');
        const ok = await bcrypt.compare(password, user.hashed_password);
        if (!ok) throw new Error('Invalid credentials');

        // 2FA check (from profile)
        // Load profile + associations
        const profile = await dataAccess.getProfileByUserId(user.id);

        if (profile?.two_factor_enabled) {
          if (!totpCode) throw new Error('2FA code required');
          if (!profile.totp_secret)
            throw new Error('2FA not properly configured');
          const valid = speakeasy.totp.verify({
            secret: profile.totp_secret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
          });
          if (!valid) throw new Error('Invalid 2FA code');
        }

        const associations = await dataAccess.getAssociationMembersByProfileId(
          profile?.user_id ?? user.id
        );

        return {
          id: user.id,
          email: user.email,
          name: profile?.display_name ?? user.email,
          role: user.role,
          profile,
          associations:
            associations?.map(assoc => ({
              id: assoc.id,
              role: assoc.role,
              association: {
                id: assoc.association_id,
                name: assoc.association_name,
              },
            })) ?? [],
        } as {
          id: string;
          name: string;
          email: string;
          role: string;
          profile: unknown;
          associations: Array<{
            id: string;
            role: string;
            association: {
              id: string;
              name: string;
            };
          }>;
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role;
        token.profile = (user as unknown as { profile: unknown }).profile;
        token.associations = (
          user as unknown as { associations: unknown[] }
        ).associations;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub || '';
        (session.user as { role: string }).role = (
          token as { role: string }
        ).role;
        (session.user as { profile: unknown }).profile = (
          token as { profile: unknown }
        ).profile;
        (session.user as { associations: unknown[] }).associations = (
          token as { associations: unknown[] }
        ).associations;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
