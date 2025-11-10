import { auth, signOut } from '@/lib/auth'
import MAKLogo from '@/components/MAKLogo'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ClientHeaderProps {
  title?: string
  showBackButton?: boolean
  backButtonHref?: string
  backButtonLabel?: string
}

export default async function ClientHeader({
  title,
  showBackButton = false,
  backButtonHref = '/client/dashboard',
  backButtonLabel = 'Dashboard',
}: ClientHeaderProps) {
  const session = await auth()
  let client: any = null

  if (session?.user) {
    const { supabase } = await import('@/lib/db')
    const clientId = (session.user as any)?.clientId

    if (clientId) {
      const { data: clientData } = await supabase
        .from('Client')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientData) {
        client = clientData
      }
    }
  }

  const accountStatus = client?.status || 'Active'

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MAKLogo size="default" showTagline={false} useImageFile={true} imagePath="/logo-mak.png" />
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">Supersender</span>
              <span className="text-xs text-gray-500">by MAK Consulting</span>
            </div>
            {title && (
              <div className="ml-4 pl-4 border-l border-gray-300">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link
                href={backButtonHref}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to {backButtonLabel}</span>
              </Link>
            )}
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name || session?.user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    accountStatus === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : accountStatus === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {accountStatus}
                </span>
                {client?.clientCode && (
                  <span className="text-xs text-gray-500 font-mono">
                    {client.clientCode}
                  </span>
                )}
              </div>
            </div>
            <a
              href="/api/auth/signout"
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

