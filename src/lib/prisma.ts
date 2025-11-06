import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Better connection management for Supabase
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Handle graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // In production, ensure proper cleanup
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

