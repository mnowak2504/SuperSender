import { Metadata } from 'next'
import ProcessPageContent from '@/components/process/ProcessPageContent'

export const metadata: Metadata = {
  title: 'How Supersender Works | Step-by-Step Guide to Smart Logistics',
  description: 'Learn how Supersender helps you manage, store, and ship your goods effortlessly — from registration to delivery.',
}

export default function ProcessPage() {
  return <ProcessPageContent />
}

