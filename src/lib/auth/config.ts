import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import { getDataAccess } from '@/lib/db/data-access'
import bcrypt from 'bcryptjs'
import speakeasy from 'speakeasy'

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
        const email = credentials?.email?.toString().toLowerCase()
        const password = credentials?.password?.toString() ?? ''
        const totpCode = credentials?.totpCode?.toString()
        if (!email || !password) throw new Error('Missing email or password')

        // Get data access layer
        const dataAccess = getDataAccess()

        // Fetch user by email
        const user = await dataAccess.getUserByEmail(email)

        if (!user?.hashed_password) throw new Error('Invalid credentials')
        const ok = await bcrypt.compare(password, user.hashed_password)
        if (!ok) throw new Error('Invalid credentials')

        // 2FA check (from profile)
        // Load profile + associations
        const profile = await dataAccess.getProfileByUserId(user.id)

        if (profile?.two_factor_enabled) {
          if (!totpCode) throw new Error('2FA code required')
          if (!profile.totp_secret) throw new Error('2FA not properly configured')
          const valid = speakeasy.totp.verify({
            secret: profile.totp_secret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
          })
          if (!valid) throw new Error('Invalid 2FA code')
        }

        const associations = await dataAccess.getAssociationMembersByProfileId(profile?.user_id ?? user.id)

        return {
          id: user.id,
          email: user.email,
          name: profile?.display_name ?? user.email,
          role: user.role,
          profile,
          associations: associations?.map(assoc => ({
            id: assoc.id,
            role: assoc.role,
            association: {
              id: assoc.association_id,
              name: assoc.association_name
            }
          })) ?? [],
        } as any
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
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as any).role
        token.profile = (user as any).profile
        token.associations = (user as any).associations
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).profile = (token as any).profile
        ;(session.user as any).associations = (token as any).associations
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}
