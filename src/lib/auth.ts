import 'server-only'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db, type Role } from './db'
import { comparePassword } from './auth-password'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        console.log('[AUTH] Attempting to authorize:', credentials.email)
        const user = await db.findUserByEmail(credentials.email as string)

        if (!user) {
          console.log('[AUTH] User not found:', credentials.email)
          return null
        }

        const isValid = await comparePassword(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) {
          console.error('[AUTH] Password verification failed for user:', user.email)
          return null
        }

        console.log('[AUTH] User authorized successfully:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true, // Required for NextAuth v5 in localhost
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        console.log('[AUTH] JWT callback - user logged in:', user.email)
        token.id = user.id
        token.role = (user as any).role
        token.clientId = (user as any).clientId
        token.email = user.email
        token.name = user.name
      } else if (token.email) {
        // Refresh role from database on each request for superadmin email
        // This ensures role changes are reflected immediately
        if (token.email === 'm.nowak@makconsulting.pl') {
          try {
            const dbUser = await db.findUserByEmail(token.email)
            if (dbUser && dbUser.role !== token.role) {
              console.log('[AUTH] Role updated in database, refreshing token:', {
                old: token.role,
                new: dbUser.role,
              })
              token.role = dbUser.role
              token.clientId = dbUser.clientId
            }
          } catch (error) {
            console.error('[AUTH] Error refreshing role from database:', error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      console.log('[AUTH] Session callback - token exists:', !!token, 'session exists:', !!session)
      if (session.user && token) {
        (session.user as any).id = token.id as string
        ;(session.user as any).role = token.role as Role
        ;(session.user as any).clientId = token.clientId as string | undefined
        session.user.email = token.email as string
        session.user.name = token.name as string | null
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
})
