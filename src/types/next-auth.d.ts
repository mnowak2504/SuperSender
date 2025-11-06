import type { Role } from '@/lib/db'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: Role
      clientId?: string | null
    }
  }

  interface User {
    role: Role
    clientId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    clientId?: string | null
  }
}

