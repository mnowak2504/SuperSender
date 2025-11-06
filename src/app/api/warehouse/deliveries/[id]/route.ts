import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    const role = (session?.user as any)?.role

    if (!session || (role !== 'WAREHOUSE' && role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const delivery = await prisma.deliveryExpected.findUnique({
      where: { id },
      include: {
        client: true,
        photos: true,
      },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return NextResponse.json(delivery)
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

