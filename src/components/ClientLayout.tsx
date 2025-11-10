'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/lib/use-language'
import LanguageSelector from '@/components/LanguageSelector'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { t } = useLanguage()

  const navItems = [
    { href: '/client/dashboard', label: t('client_dashboard'), key: 'client_dashboard' },
    { href: '/client/deliveries', label: t('client_deliveries'), key: 'client_deliveries' },
    { href: '/client/warehouse-orders', label: t('client_warehouse_orders'), key: 'client_warehouse_orders' },
    { href: '/client/invoices', label: t('client_invoices'), key: 'client_invoices' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo & Branding - matching ClientHeader */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/client/dashboard" 
                className="flex items-center gap-3"
                title="MAK Consulting - For Better Business Results"
              >
                <div className="relative" style={{ width: 144, height: 144, minWidth: 144, minHeight: 144 }}>
                  <Image
                    src="/logo-mak.png"
                    alt="MAK Consulting Logo"
                    width={144}
                    height={144}
                    className="object-contain w-full h-full"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-gray-900">Supersender</span>
                  <span className="text-xs text-gray-500">by MAK Consulting</span>
                </div>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || session?.user?.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t('client_active')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: 'https://www.supersender.eu' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {t('client_sign_out')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <main>{children}</main>
    </div>
  )
}

