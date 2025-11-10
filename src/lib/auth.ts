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
        
        // Get lastActivityAt from database if available
        const dbUser = await db.findUserById(user.id)
        const lastActivityAt = dbUser?.lastActivityAt || new Date().toISOString()
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          clientId: user.clientId,
          lastActivityAt,
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
        token.lastActivityAt = new Date().toISOString()
      } else if (token.email) {
        // Update lastActivityAt on each request
        const now = new Date()
        token.lastActivityAt = now.toISOString()

        // Update lastActivityAt in database (async, don't block)
        // Only update DB if it's been more than 1 minute to reduce writes
        if (token.id) {
          const lastDbUpdate = token.lastDbUpdate ? new Date(token.lastDbUpdate as string) : null
          const shouldUpdateDb = !lastDbUpdate || (now.getTime() - lastDbUpdate.getTime()) > 60000 // 1 minute
          
          if (shouldUpdateDb) {
            token.lastDbUpdate = now.toISOString()
            const { supabase } = await import('./db')
            // Update lastActivityAt in database (fire and forget)
            ;(async () => {
              const { error } = await supabase
                .from('User')
                .update({ lastActivityAt: now.toISOString() })
                .eq('id', token.id as string)
              
              if (error) {
                console.error('[AUTH] Error updating lastActivityAt:', error)
              }
            })()
          }
        }

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
      
      // Check for inactivity - auto sign out after 3 hours
      // Check database value to get accurate last activity time
      if (token.id) {
        try {
          const dbUser = await db.findUserById(token.id as string)
          if (dbUser?.lastActivityAt) {
            const lastActivity = new Date(dbUser.lastActivityAt)
            const now = new Date()
            const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
            
            if (hoursSinceActivity >= 3) {
              console.log('[AUTH] User inactive for 3+ hours, invalidating session')
              // Return null to invalidate session - NextAuth will handle redirect
              return null as any
            }
          }
        } catch (error) {
          console.error('[AUTH] Error checking lastActivityAt:', error)
          // On error, allow session to continue (fail open for availability)
        }
      }
      
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
