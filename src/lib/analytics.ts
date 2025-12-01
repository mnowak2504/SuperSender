// Analytics tracking script for landing page

interface VisitData {
  sessionId: string
  pagePath: string
  language?: string
  country?: string
  countryName?: string
  city?: string
  region?: string
  userAgent?: string
  referrer?: string
  timeOnPage?: number
  scrollDepth?: number
  viewportWidth?: number
  viewportHeight?: number
  deviceType?: string
  browser?: string
  os?: string
  visitedSections?: string[]
}

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

// Parse user agent
function parseUserAgent(): { browser: string; os: string } {
  if (typeof window === 'undefined') return { browser: 'unknown', os: 'unknown' }
  
  const ua = navigator.userAgent
  let browser = 'unknown'
  let os = 'unknown'

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  // OS detection
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return { browser, os }
}

// Get geolocation from IP (using free API)
async function getGeoLocation(): Promise<{
  country?: string
  countryName?: string
  city?: string
  region?: string
}> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    
    return {
      country: data.country_code || undefined,
      countryName: data.country_name || undefined,
      city: data.city || undefined,
      region: data.region || undefined,
    }
  } catch (error) {
    console.error('Error fetching geolocation:', error)
    return {}
  }
}

// Track scroll depth
let maxScrollDepth = 0
let scrollTrackingInterval: NodeJS.Timeout | null = null

function trackScrollDepth() {
  if (typeof window === 'undefined') return

  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const clientHeight = document.documentElement.clientHeight
  
  const scrollDepth = ((scrollTop + clientHeight) / scrollHeight) * 100
  maxScrollDepth = Math.max(maxScrollDepth, scrollDepth)
}

// Track visited sections
const visitedSections = new Set<string>()

function trackSectionVisibility() {
  if (typeof window === 'undefined') return

  const sections = document.querySelectorAll('[data-section-id]')
  sections.forEach(section => {
    const rect = section.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0
    
    if (isVisible) {
      const sectionId = section.getAttribute('data-section-id')
      if (sectionId) {
        visitedSections.add(sectionId)
      }
    }
  })
}

// Track page visit
let startTime = Date.now()
let timeOnPage = 0

export async function trackPageVisit(pagePath: string, language?: string) {
  if (typeof window === 'undefined') return

  try {
    // Get geolocation
    const geo = await getGeoLocation()
    
    // Parse user agent
    const { browser, os } = parseUserAgent()
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Get device type
    const deviceType = getDeviceType()
    
    // Get referrer
    const referrer = document.referrer || undefined
    
    // Prepare visit data
    const visitData: VisitData = {
      sessionId: getSessionId(),
      pagePath,
      language,
      ...geo,
      userAgent: navigator.userAgent,
      referrer,
      viewportWidth,
      viewportHeight,
      deviceType,
      browser,
      os,
      visitedSections: Array.from(visitedSections),
    }

    // Send initial visit
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visitData),
    })

    // Set up scroll tracking
    window.addEventListener('scroll', trackScrollDepth)
    
    // Set up section visibility tracking
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id')
            if (sectionId) {
              visitedSections.add(sectionId)
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    document.querySelectorAll('[data-section-id]').forEach(section => {
      sectionObserver.observe(section)
    })

    // Track time on page before unload
    window.addEventListener('beforeunload', async () => {
      timeOnPage = Math.floor((Date.now() - startTime) / 1000)
      
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...visitData,
          timeOnPage,
          scrollDepth: maxScrollDepth,
          visitedSections: Array.from(visitedSections),
        }),
      })
    })

    // Periodic update (every 30 seconds)
    scrollTrackingInterval = setInterval(async () => {
      timeOnPage = Math.floor((Date.now() - startTime) / 1000)
      
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...visitData,
          timeOnPage,
          scrollDepth: maxScrollDepth,
          visitedSections: Array.from(visitedSections),
        }),
      })
    }, 30000)
  } catch (error) {
    console.error('Error tracking page visit:', error)
  }
}

// Cleanup function
export function cleanupAnalytics() {
  if (scrollTrackingInterval) {
    clearInterval(scrollTrackingInterval)
    scrollTrackingInterval = null
  }
}

