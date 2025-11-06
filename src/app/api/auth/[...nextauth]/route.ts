// This route handler must use Node.js runtime for bcrypt
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Import auth configuration (server-only)
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
