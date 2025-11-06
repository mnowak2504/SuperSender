import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role

    if (!session || (role !== 'WAREHOUSE' && role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const packagesCount = formData.get('packagesCount')
    const condition = formData.get('condition')
    const notes = formData.get('notes')?.toString() || ''
    const location = formData.get('location')?.toString() || ''
    const photos = formData.getAll('photos') as File[]

    if (photos.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 photos are required' },
        { status: 400 }
      )
    }

    // In production, upload photos to cloud storage (S3, Cloudinary, etc.)
    // For MVP, we'll just store placeholder URLs
    const photoUrls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      // TODO: Implement actual file upload
      photoUrls.push(`/uploads/delivery-${params.id}-${i}.jpg`)
    }

    // Update delivery status
    const delivery = await prisma.deliveryExpected.update({
      where: { id: params.id },
      data: {
        status: 'RECEIVED',
        location: location || null,
        photos: {
          create: photoUrls.map((url) => ({
            url,
            kind: 'delivery_received',
          })),
        },
      },
    })

    // Create warehouse order
    const warehouseOrder = await prisma.warehouseOrder.create({
      data: {
        clientId: delivery.clientId,
        sourceDeliveryId: delivery.id,
        status: 'AT_WAREHOUSE',
      },
    })

    // Log the action
    await prisma.changeLog.create({
      data: {
        actorId: (session.user as any).id!,
        entityType: 'DeliveryExpected',
        entityId: delivery.id,
        action: 'RECEIVED',
        details: JSON.stringify({
          packagesCount,
          condition,
          notes,
          location,
        }),
      },
    })

    // TODO: Send notification to client

    return NextResponse.json({ delivery, warehouseOrder }, { status: 200 })
  } catch (error) {
    console.error('Error receiving delivery:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

