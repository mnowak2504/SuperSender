import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    if (role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'day' // day, month, year
    const date = searchParams.get('date') // YYYY-MM-DD format

    // Calculate date range based on period
    let startDate: Date
    let endDate: Date = new Date()

    if (date) {
      const selectedDate = new Date(date)
      if (period === 'day') {
        startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)
      } else if (period === 'month') {
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999)
      } else {
        // year
        startDate = new Date(selectedDate.getFullYear(), 0, 1)
        endDate = new Date(selectedDate.getFullYear(), 11, 31, 23, 59, 59, 999)
      }
    } else {
      // Default to current period
      if (period === 'day') {
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        endDate.setHours(23, 59, 59, 999)
      } else if (period === 'month') {
        startDate = new Date()
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
      } else {
        // year
        startDate = new Date()
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
      }
    }

    // Get all visits in period
    const visits = await prisma.pageVisit.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    // Calculate statistics
    const totalVisits = visits.length
    const uniqueVisits = new Set(visits.map(v => v.sessionId)).size
    const uniqueVisitors = visits.filter(v => v.isUnique).length

    // Average time on page
    const visitsWithTime = visits.filter(v => v.timeOnPage !== null)
    const avgTimeOnPage = visitsWithTime.length > 0
      ? visitsWithTime.reduce((sum, v) => sum + (v.timeOnPage || 0), 0) / visitsWithTime.length
      : 0

    // Country statistics
    const countryStats: Record<string, { count: number; unique: number; name: string }> = {}
    
    visits.forEach(visit => {
      const country = visit.country || 'unknown'
      const countryName = visit.countryName || 'Unknown'
      
      if (!countryStats[country]) {
        countryStats[country] = { count: 0, unique: 0, name: countryName }
      }
      countryStats[country].count++
      if (visit.isUnique) {
        countryStats[country].unique++
      }
    })

    // Language statistics
    const languageStats: Record<string, number> = {}
    visits.forEach(visit => {
      const lang = visit.language || 'unknown'
      languageStats[lang] = (languageStats[lang] || 0) + 1
    })

    // Page path statistics
    const pageStats: Record<string, number> = {}
    visits.forEach(visit => {
      pageStats[visit.pagePath] = (pageStats[visit.pagePath] || 0) + 1
    })

    // Device type statistics
    const deviceStats: Record<string, number> = {}
    visits.forEach(visit => {
      const device = visit.deviceType || 'unknown'
      deviceStats[device] = (deviceStats[device] || 0) + 1
    })

    // Browser statistics
    const browserStats: Record<string, number> = {}
    visits.forEach(visit => {
      const browser = visit.browser || 'unknown'
      browserStats[browser] = (browserStats[browser] || 0) + 1
    })

    // Average scroll depth
    const visitsWithScroll = visits.filter(v => v.scrollDepth !== null)
    const avgScrollDepth = visitsWithScroll.length > 0
      ? visitsWithScroll.reduce((sum, v) => sum + (v.scrollDepth || 0), 0) / visitsWithScroll.length
      : 0

    // Top visited sections
    const sectionStats: Record<string, number> = {}
    visits.forEach(visit => {
      visit.visitedSections.forEach(section => {
        sectionStats[section] = (sectionStats[section] || 0) + 1
      })
    })

    // Convert country stats to array for pie chart
    const countryData = Object.entries(countryStats).map(([code, data]) => ({
      code,
      name: data.name,
      count: data.count,
      unique: data.unique,
      percentage: (data.count / totalVisits) * 100,
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalVisits,
        uniqueVisits,
        uniqueVisitors,
        avgTimeOnPage: Math.round(avgTimeOnPage),
        avgScrollDepth: Math.round(avgScrollDepth * 100) / 100,
      },
      countries: countryData,
      languages: Object.entries(languageStats).map(([lang, count]) => ({
        language: lang,
        count,
        percentage: (count / totalVisits) * 100,
      })).sort((a, b) => b.count - a.count),
      pages: Object.entries(pageStats).map(([path, count]) => ({
        path,
        count,
        percentage: (count / totalVisits) * 100,
      })).sort((a, b) => b.count - a.count),
      devices: Object.entries(deviceStats).map(([device, count]) => ({
        device,
        count,
        percentage: (count / totalVisits) * 100,
      })),
      browsers: Object.entries(browserStats).map(([browser, count]) => ({
        browser,
        count,
        percentage: (count / totalVisits) * 100,
      })).sort((a, b) => b.count - a.count),
      topSections: Object.entries(sectionStats)
        .map(([section, count]) => ({ section, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

