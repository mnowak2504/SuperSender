import { redirect } from 'next/navigation'

// Default landing page redirects to English version
export default function LandingPage() {
  redirect('/landing/en')
}

