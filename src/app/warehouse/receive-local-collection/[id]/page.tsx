import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import ReceiveLocalCollectionForm from './ReceiveLocalCollectionForm'

export const runtime = 'nodejs'

export default async function ReceiveLocalCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  // Pobierz szczegóły transportu lokalnego
  const { data: quote, error } = await supabase
    .from('LocalCollectionQuote')
    .select('*, Client:clientId(id, displayName, clientCode, email)')
    .eq('id', id)
    .single()

  if (error || !quote) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Nie znaleziono transportu lokalnego</p>
          <a href="/warehouse/local-collections" className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
            Powrót do listy transportów lokalnych
          </a>
        </div>
      </div>
    )
  }

  // Sprawdź czy status jest ACCEPTED lub SCHEDULED
  if (quote.status !== 'ACCEPTED' && quote.status !== 'SCHEDULED') {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Ten transport lokalny nie jest gotowy do odbioru (status: {quote.status})</p>
          <a href="/warehouse/local-collections" className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block">
            Powrót do listy transportów lokalnych
          </a>
        </div>
      </div>
    )
  }

  return <ReceiveLocalCollectionForm quote={quote} />
}

