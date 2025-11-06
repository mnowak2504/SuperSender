import { Metadata } from 'next'
import AboutUsContent from '@/components/about/AboutUsContent'

export const metadata: Metadata = {
  title: 'About MAK Consulting | Our Story, Vision & Supersender Integration',
  description: 'Discover how MAK Consulting connects European builders and suppliers through ImportFromPoland and Supersender — logistics made simple, transparent, and human.',
}

export default function AboutPage() {
  return <AboutUsContent />
}

