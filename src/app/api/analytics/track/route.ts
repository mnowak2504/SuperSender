import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Hash IP address for privacy
function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
}

// Extract IP from request
function getIPAddress(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP.trim()
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      sessionId,
      pagePath,
      language,
      country,
      countryName,
      city,
      region,
      userAgent,
      referrer,
      timeOnPage,
      scrollDepth,
      viewportWidth,
      viewportHeight,
      deviceType,
      browser,
      os,
      visitedSections = [],
    } = body

    if (!sessionId || !pagePath) {
      return NextResponse.json(
        { error: 'sessionId and pagePath are required' },
        { status: 400 }
      )
    }

    const ipAddress = getIPAddress(req)
    const hashedIP = ipAddress ? hashIP(ipAddress) : null

    try {
      // Use dynamic access to pageVisit model (works even if table doesn't exist yet)
      // @ts-ignore - pageVisit model may not exist until migration is run
      const pageVisitModel = (prisma as any).pageVisit

      // Check if this is a unique visit (first visit in this session for this page)
      const existingVisit = await pageVisitModel.findFirst({
        where: {
          sessionId,
          pagePath,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      const isUnique = !existingVisit

      // Create visit record
      const visit = await pageVisitModel.create({
        data: {
          sessionId,
          pagePath,
          language: language || null,
          country: country || null,
          countryName: countryName || null,
          city: city || null,
          region: region || null,
          ipAddress: hashedIP,
          userAgent: userAgent || null,
          referrer: referrer || null,
          timeOnPage: timeOnPage || null,
          scrollDepth: scrollDepth || null,
          viewportWidth: viewportWidth || null,
          viewportHeight: viewportHeight || null,
          deviceType: deviceType || null,
          browser: browser || null,
          os: os || null,
          isUnique,
          visitedSections,
        },
      })

      return NextResponse.json({ success: true, id: visit.id })
    } catch (error: any) {
      // If table doesn't exist yet, return success but skip tracking
      if (error?.code === 'P2021' || error?.message?.includes('does not exist')) {
        return NextResponse.json({ success: true, skipped: true })
      }
      throw error
    }
  } catch (error) {
    console.error('Error tracking page visit:', error)
    return NextResponse.json(
      { error: 'Failed to track visit' },
      { status: 500 }
    )
  }
}

