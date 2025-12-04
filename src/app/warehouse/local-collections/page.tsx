import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'
import { Truck, MapPin, Package, Calendar, Phone, User } from 'lucide-react'
import { adminTranslations } from '@/lib/admin-translations'

export const runtime = 'nodejs'

export default async function LocalCollectionsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'WAREHOUSE' && role !== 'SUPERADMIN') {
    redirect('/unauthorized')
  }

  // Pobierz transporty lokalne gotowe do odbioru (ACCEPTED lub SCHEDULED)
  const { data: localCollections, error } = await supabase
    .from('LocalCollectionQuote')
    .select('*, Client:clientId(displayName, clientCode, email)')
    .in('status', ['ACCEPTED', 'SCHEDULED'])
    .order('collectionDateFrom', { ascending: true }) // Sortuj po najbliższej dacie odbioru

  if (error) {
    console.error('Error fetching local collections:', error)
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transporty lokalne - Gotowe do odbioru</h1>
          <p className="mt-1 text-sm text-gray-500">Transporty lokalne zaakceptowane przez klienta, gotowe do odbioru</p>
        </div>
        <Link
          href="/warehouse/dashboard"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Powrót do dashboardu
        </Link>
      </div>

      {localCollections && localCollections.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {localCollections.map((quote: any) => (
              <li key={quote.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Transport #{quote.id.slice(-8).toUpperCase()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-600">
                              {(quote.Client as any)?.displayName || 'Klient'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {(quote.Client as any)?.clientCode || 'Brak kodu'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Package Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="w-4 h-4" />
                            <span className="font-medium">Wymiary:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {quote.widthCm} × {quote.lengthCm} × {quote.heightCm} cm
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            Objętość: {quote.volumeCbm.toFixed(3)} m³ | Waga: {quote.weightKg} kg
                          </p>
                        </div>

                        {/* Collection Address */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium">Adres odbioru:</span>
                          </div>
                          <p className="text-sm text-gray-900 ml-6">
                            {quote.collectionAddressLine1}
                            {quote.collectionAddressLine2 && `, ${quote.collectionAddressLine2}`}
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            {quote.collectionCity}, {quote.collectionPostCode}
                            {quote.collectionCountry && `, ${quote.collectionCountry}`}
                          </p>
                        </div>

                        {/* Collection Date */}
                        {quote.collectionDateFrom && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">Termin odbioru:</span>
                            </div>
                            <p className="text-sm text-gray-900 ml-6">
                              {new Date(quote.collectionDateFrom).toLocaleDateString('pl-PL', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {quote.collectionDateTo && (
                                <> - {new Date(quote.collectionDateTo).toLocaleDateString('pl-PL', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}</>
                              )}
                            </p>
                          </div>
                        )}

                        {/* Contact Info */}
                        {(quote.collectionContactName || quote.collectionContactPhone) && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="font-medium">Kontakt:</span>
                            </div>
                            {quote.collectionContactName && (
                              <p className="text-sm text-gray-900 ml-6">{quote.collectionContactName}</p>
                            )}
                            {quote.collectionContactPhone && (
                              <div className="flex items-center gap-2 ml-6">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <p className="text-sm text-gray-900">{quote.collectionContactPhone}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Order Details */}
                      {(quote.orderNumber || quote.orderDetails || quote.pinCode) && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2">Dokumentacja zamówienia:</p>
                          <div className="space-y-1 text-xs text-gray-600">
                            {quote.orderNumber && (
                              <p><span className="font-medium">Numer zamówienia:</span> {quote.orderNumber}</p>
                            )}
                            {quote.orderDetails && (
                              <p><span className="font-medium">Szczegóły:</span> {quote.orderDetails}</p>
                            )}
                            {quote.pinCode && (
                              <p><span className="font-medium">PIN:</span> {quote.pinCode}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Admin Notes */}
                      {quote.adminNotes && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-medium text-yellow-800 mb-1">Uwagi:</p>
                          <p className="text-sm text-yellow-900">{quote.adminNotes}</p>
                        </div>
                      )}

                      {/* Price */}
                      {quote.quotedPriceEur && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Cena:</span>{' '}
                            <span className="text-lg font-bold text-green-600">€{quote.quotedPriceEur.toFixed(2)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        href={`/warehouse/receive-local-collection/${quote.id}`}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Przyjmij na magazynie
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">Brak transportów lokalnych gotowych do odbioru</p>
          <Link
            href="/warehouse/dashboard"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Powrót do dashboardu
          </Link>
        </div>
      )}
    </div>
  )
}

