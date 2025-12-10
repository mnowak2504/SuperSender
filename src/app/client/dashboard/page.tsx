import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/db'
import { Package, Truck, FileText, Plus, Building2, Box, Activity, Settings, AlertCircle, Euro } from 'lucide-react'
import CopyButton from '@/components/CopyButton'
import ClientHeader from '@/components/ClientHeader'
import ShipmentsInPreparation from '@/components/shipments/ShipmentsInPreparation'
import ShipmentsInTransit from '@/components/shipments/ShipmentsInTransit'
import Archive from '@/components/shipments/Archive'

export const runtime = 'nodejs'

function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function ClientDashboard() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get clientId from session or find by email
  let clientId = (session.user as any)?.clientId
  let client: any = null

  if (!clientId) {
    const { data: clientData } = await supabase
      .from('Client')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (clientData) {
      clientId = clientData.id
      client = clientData
    }
  } else {
    const { data: clientData } = await supabase
      .from('Client')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientData) {
      client = clientData
    }
  }

  // Fetch expected deliveries (status: EXPECTED)
  let expectedDeliveries: any[] = []
  if (clientId) {
    const { data, error } = await supabase
      .from('DeliveryExpected')
      .select('id, supplierName, goodsDescription, eta, createdAt, status')
      .eq('clientId', clientId)
      .eq('status', 'EXPECTED')
      .order('createdAt', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[DASHBOARD] Error fetching expected deliveries:', error)
    } else {
      expectedDeliveries = data || []
    }
  }

  // Fetch warehouse orders (status: AT_WAREHOUSE)
  let warehouseOrders: any[] = []
  if (clientId) {
    const { data: ordersData, error: ordersError } = await supabase
      .from('WarehouseOrder')
      .select('id, status, warehouseLocation, receivedAt, sourceDeliveryId')
      .eq('clientId', clientId)
      .eq('status', 'AT_WAREHOUSE')
      .order('receivedAt', { ascending: false })
      .limit(5)

    if (ordersError) {
      console.error('[DASHBOARD] Error fetching warehouse orders:', ordersError)
    } else if (ordersData && ordersData.length > 0) {
      const deliveryIds = ordersData.map(o => o.sourceDeliveryId).filter(Boolean)
      
      if (deliveryIds.length > 0) {
        const { data: deliveriesData } = await supabase
          .from('DeliveryExpected')
          .select('id, supplierName, goodsDescription')
          .in('id', deliveryIds)

        warehouseOrders = ordersData.map(order => {
          const delivery = deliveriesData?.find(d => d.id === order.sourceDeliveryId)
          return {
            ...order,
            delivery,
          }
        })
      } else {
        warehouseOrders = ordersData
      }
    }
  }

  // Get plan name if available
  let planName = 'N/A'
  if (client?.planId) {
    const { data: planData } = await supabase
      .from('Plan')
      .select('name')
      .eq('id', client.planId)
      .single()
    
    if (planData) {
      planName = planData.name
    }
  }

  // Get warehouse capacity
  let warehouseCapacity: any = null
  if (clientId) {
    const { data: capacityData } = await supabase
      .from('WarehouseCapacity')
      .select('*')
      .eq('clientId', clientId)
      .single()

    if (capacityData) {
      warehouseCapacity = capacityData
    }
  }

  // Get base limit from plan if not in capacity
  let baseLimitCbm = warehouseCapacity?.limitCbm || client?.limitCbm || 0
  let bufferCbm = 0
  if (!baseLimitCbm && client?.planId) {
    const { data: planData } = await supabase
      .from('Plan')
      .select('spaceLimitCbm, bufferCbm')
      .eq('id', client.planId)
      .single()
    if (planData) {
      baseLimitCbm = planData.spaceLimitCbm || 0
      bufferCbm = planData.bufferCbm || 0
    }
  } else if (client?.planId) {
    // Get buffer even if we have baseLimitCbm
    const { data: planData } = await supabase
      .from('Plan')
      .select('bufferCbm')
      .eq('id', client.planId)
      .single()
    if (planData) {
      bufferCbm = planData.bufferCbm || 0
    }
  }
  
  // Effective limit = base limit + buffer (buffer is free, overspace doesn't increase limit anymore)
  const limitCbm = baseLimitCbm + bufferCbm

  const usedCbm = warehouseCapacity?.usedCbm || client?.usedCbm || 0
  const spaceUsagePct = limitCbm > 0 ? (usedCbm / limitCbm) * 100 : 0
  const isOverLimit = usedCbm > limitCbm
  const shouldShowSpaceWarning = spaceUsagePct >= 90 && spaceUsagePct <= 120
  const deliveriesThisMonth = client?.deliveriesThisMonth || 0
  const deliveriesLimit = client?.planId ? 0 : 0 // TODO: Get from plan if needed
  
  // Check subscription status with dates
  const now = new Date()
  
  // Check if there's a subscription invoice with PAYMENT_LINK_REQUESTED status
  // If so, subscription should be active even if not yet paid
  let hasPaymentLinkRequested = false
  let paymentLinkRequestedInvoice: any = null
  if (clientId) {
    const { data: subscriptionInvoice } = await supabase
      .from('Invoice')
      .select('paymentMethod, status, subscriptionStartDate, subscriptionEndDate, subscriptionPlanId, subscriptionPeriod')
      .eq('clientId', clientId)
      .eq('type', 'PROFORMA')
      .not('subscriptionPlanId', 'is', null) // Has subscriptionPlanId = subscription invoice
      .eq('paymentMethod', 'PAYMENT_LINK_REQUESTED')
      .neq('status', 'PAID')
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (subscriptionInvoice) {
      hasPaymentLinkRequested = true
      paymentLinkRequestedInvoice = subscriptionInvoice
    }
  }
  
  // Subscription is active if has planId OR payment link requested
  const hasActiveSubscription = !!client?.planId || hasPaymentLinkRequested
  
  // Use dates from payment link requested invoice if available, otherwise from client
  let subscriptionEndDate = client?.subscriptionEndDate ? new Date(client.subscriptionEndDate) : null
  let subscriptionStartDate = client?.subscriptionStartDate ? new Date(client.subscriptionStartDate) : null
  
  if (hasPaymentLinkRequested && paymentLinkRequestedInvoice) {
    if (paymentLinkRequestedInvoice.subscriptionStartDate) {
      subscriptionStartDate = new Date(paymentLinkRequestedInvoice.subscriptionStartDate)
    }
    if (paymentLinkRequestedInvoice.subscriptionEndDate) {
      subscriptionEndDate = new Date(paymentLinkRequestedInvoice.subscriptionEndDate)
    } else if (paymentLinkRequestedInvoice.subscriptionStartDate && paymentLinkRequestedInvoice.subscriptionPeriod) {
      // Calculate end date from start date and period
      const startDate = new Date(paymentLinkRequestedInvoice.subscriptionStartDate)
      const months = parseInt(paymentLinkRequestedInvoice.subscriptionPeriod) || 1
      subscriptionEndDate = new Date(startDate)
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + months)
    }
  }
  
  const isSubscriptionExpired = subscriptionEndDate ? subscriptionEndDate < now : false
  const isSubscriptionPending = subscriptionStartDate ? subscriptionStartDate > now : false
  const daysUntilExpiry = subscriptionEndDate ? Math.ceil((subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
  const hasReceivedItems = warehouseOrders.length > 0

  // Fetch additional charges for current month
  let currentMonthCharges: any = null
  if (clientId) {
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const { data: charges } = await supabase
      .from('MonthlyAdditionalCharges')
      .select('*')
      .eq('clientId', clientId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single()
    
    if (charges) {
      currentMonthCharges = charges
    }
  }

  // Fetch pending proformas
  let pendingProformas: any[] = []
  if (clientId) {
    const { data: proformas } = await supabase
      .from('ProformaInvoice')
      .select('*')
      .eq('clientId', clientId)
      .eq('status', 'PENDING')
      .order('dueDate', { ascending: true })
    
    if (proformas) {
      pendingProformas = proformas
    }
  }

  // Fetch all outstanding PROFORMA invoices (status ISSUED, not paid)
  // Sum all proformas waiting for payment
  let totalOutstanding = 0
  if (clientId) {
    const { data: outstandingInvoices } = await supabase
      .from('Invoice')
      .select('amountEur, status, type')
      .eq('clientId', clientId)
      .eq('type', 'PROFORMA')
      .eq('status', 'ISSUED')
    
    if (outstandingInvoices) {
      totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.amountEur || 0), 0)
    }
  }

  // Fetch shipments in preparation (status: REQUESTED), ready (status: AWAITING_ACCEPTANCE), and own transport (READY_FOR_LOADING)
  let shipmentsInPrep: any[] = []
  // Fetch shipments in transit (status: IN_TRANSIT)
  let shipmentsInTransit: any[] = []
  // Fetch archived shipments (status: DELIVERED)
  let archivedShipments: any[] = []
  
  // Fetch local collection quotes (status: QUOTED, ACCEPTED, SCHEDULED)
  let localCollectionQuotes: any[] = []
  
  if (clientId) {
    // Shipments in preparation
    const { data: shipmentsData, error: shipmentsError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        createdAt,
        status,
        calculatedPriceEur,
        clientTransportChoice,
        ownTransportVehicleReg,
        ownTransportTrailerReg,
        ownTransportCarrier,
        ownTransportTrackingNumber,
        ownTransportPlannedLoadingDate,
        items: ShipmentItem(
          id,
          warehouseOrder: WarehouseOrder(
            id,
            status,
            sourceDelivery: DeliveryExpected(
              deliveryNumber,
              supplierName,
              goodsDescription
            )
          )
        )
      `)
      .eq('clientId', clientId)
      .in('status', ['REQUESTED', 'QUOTED', 'AWAITING_ACCEPTANCE', 'AWAITING_PAYMENT', 'READY_FOR_LOADING'])
      .order('createdAt', { ascending: false })

    if (!shipmentsError && shipmentsData) {
      const allShipments = shipmentsData.map((shipment: any) => ({
        ...shipment,
        items: shipment.items?.map((item: any) => ({
          ...item,
          warehouseOrder: {
            ...item.warehouseOrder,
            delivery: item.warehouseOrder?.sourceDelivery,
          },
        })) || [],
      }))

      // Combine both statuses - show all shipments together
      shipmentsInPrep = allShipments
    }

    // Shipments in transit
    const { data: transitData, error: transitError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        createdAt,
        status,
        calculatedPriceEur,
        clientTransportChoice,
        ownTransportVehicleReg,
        ownTransportTrailerReg,
        ownTransportCarrier,
        transportCompanyName,
        items: ShipmentItem(
          id,
          warehouseOrder: WarehouseOrder(
            id,
            status,
            sourceDelivery: DeliveryExpected(
              deliveryNumber,
              supplierName,
              goodsDescription
            )
          )
        )
      `)
      .eq('clientId', clientId)
      .eq('status', 'IN_TRANSIT')
      .order('createdAt', { ascending: false })

    if (!transitError && transitData) {
      shipmentsInTransit = transitData.map((shipment: any) => ({
        ...shipment,
        items: shipment.items?.map((item: any) => ({
          ...item,
          warehouseOrder: {
            ...item.warehouseOrder,
            delivery: item.warehouseOrder?.sourceDelivery,
          },
        })) || [],
      }))
    }

    // Archived shipments (DELIVERED)
    const { data: archiveData, error: archiveError } = await supabase
      .from('ShipmentOrder')
      .select(`
        id,
        createdAt,
        status,
        calculatedPriceEur,
        items: ShipmentItem(
          id,
          warehouseOrder: WarehouseOrder(
            id,
            status,
            sourceDelivery: DeliveryExpected(
              deliveryNumber,
              supplierName,
              goodsDescription
            )
          )
        )
      `)
      .eq('clientId', clientId)
      .eq('status', 'DELIVERED')
      .order('createdAt', { ascending: false })

    if (!archiveError && archiveData) {
      archivedShipments = archiveData.map((shipment: any) => ({
        ...shipment,
        items: shipment.items?.map((item: any) => ({
          ...item,
          warehouseOrder: {
            ...item.warehouseOrder,
            delivery: item.warehouseOrder?.sourceDelivery,
          },
        })) || [],
      }))
    }

    // Fetch local collection quotes
    const { data: quotesData, error: quotesError } = await supabase
      .from('LocalCollectionQuote')
      .select('id, status, quotedPriceEur, quotedAt, collectionAddressLine1, collectionCity, collectionPostCode, createdAt')
      .eq('clientId', clientId)
      .in('status', ['QUOTED', 'ACCEPTED', 'SCHEDULED'])
      .order('createdAt', { ascending: false })
      .limit(5)

    if (!quotesError && quotesData) {
      localCollectionQuotes = quotesData || []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Summary - KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          {/* Storage Usage - m³ */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Box className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Warehouse</span>
              {isOverLimit && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Over Limit</span>
              )}
            </div>
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">{usedCbm.toFixed(2)} / {limitCbm.toFixed(2)} m³</p>
              <p className="text-xs text-gray-500 mt-1">{spaceUsagePct.toFixed(1)}% used</p>
              {isOverLimit && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  Over by {(usedCbm - limitCbm).toFixed(2)} m³
                </p>
              )}
              {shouldShowSpaceWarning && !isOverLimit && (
                <p className="text-xs text-yellow-600 mt-1 font-medium">
                  ⚠️ Approaching storage limit ({spaceUsagePct.toFixed(1)}%)
                </p>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  spaceUsagePct > 100
                    ? 'bg-red-500'
                    : spaceUsagePct > 80
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(spaceUsagePct, 100)}%` }}
              />
              {spaceUsagePct > 100 && (
                <div className="mt-1 text-xs text-gray-500">
                  <span className="text-red-600 font-medium">+5% buffer included in calculations</span>
                </div>
              )}
            </div>
          </div>

          {/* Deliveries This Month */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">This Month</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{deliveriesThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">Deliveries received</p>
            </div>
          </div>

          {/* Plan */}
          <Link
            href="/client/upgrade"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Plan</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{planName}</p>
              <p className="text-xs text-gray-500 mt-1">Current subscription</p>
              {subscriptionEndDate && (
                <p className="text-xs text-gray-600 mt-2">
                  Expires: {subscriptionEndDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </Link>
        </div>

      {/* Additional Charges Due Now */}
      {totalOutstanding > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-300 p-4 rounded-r-lg mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-orange-800">Charges due now</h3>
              <p className="mt-1 text-lg font-bold text-orange-900">
                €{totalOutstanding.toFixed(2)}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Please settle your account now.
              </p>
              <Link
                href="/client/invoices"
                className="inline-block mt-2 text-sm font-medium text-orange-800 hover:text-orange-900 underline"
              >
                View Invoices →
              </Link>
            </div>
          </div>
        </div>
      )}

        {/* Shipments in Preparation */}
        {shipmentsInPrep.length > 0 && (
          <div className="mb-8">
            <ShipmentsInPreparation shipments={shipmentsInPrep} />
          </div>
        )}

        {/* Shipments in Transit */}
        {shipmentsInTransit.length > 0 && (
          <div className="mb-8">
            <ShipmentsInTransit shipments={shipmentsInTransit} />
          </div>
        )}

        {/* Local Collection Quotes Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Local Collection Service</h3>
                  <p className="text-sm text-gray-500">Request a quote for local collection from your supplier</p>
                </div>
              </div>
              <Link
                href="/client/local-collection-quote"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Request Quote
              </Link>
            </div>

            {/* Active Quotes List */}
            {localCollectionQuotes.length > 0 && (
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Quotes</h4>
                {localCollectionQuotes.map((quote: any) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          Quote #{quote.id.slice(-8).toUpperCase()}
                        </span>
                        {quote.status === 'QUOTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Ready for Review
                          </span>
                        )}
                        {quote.status === 'ACCEPTED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Accepted
                          </span>
                        )}
                        {quote.status === 'SCHEDULED' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Scheduled
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {quote.collectionAddressLine1}, {quote.collectionCity}, {quote.collectionPostCode}
                        {quote.quotedPriceEur && (
                          <span className="ml-2 font-medium text-gray-700">€{quote.quotedPriceEur.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/client/local-collection-quote"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Inactive Banner */}
        {!hasActiveSubscription && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Activity className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Subscription inactive</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Start a plan to use your warehouse address and report deliveries.
                </p>
                <div className="mt-3">
                  <Link
                    href="/client/settings?tab=billing"
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Choose a plan →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Charges & Proformas */}
        {(currentMonthCharges?.totalAmountEur > 0 || pendingProformas.length > 0) && (
          <div className="mb-8 space-y-4">
            {/* Current Month Additional Charges */}
            {currentMonthCharges && currentMonthCharges.totalAmountEur > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-yellow-800">Additional Charges This Month</h3>
                    <div className="mt-2 space-y-1 text-sm text-yellow-700">
                      {currentMonthCharges.overSpaceAmountEur > 0 && (
                        <div className="flex justify-between">
                          <span>Over-space storage:</span>
                          <span className="font-medium">€{currentMonthCharges.overSpaceAmountEur.toFixed(2)}</span>
                        </div>
                      )}
                      {currentMonthCharges.additionalServicesAmountEur > 0 && (
                        <div className="flex justify-between">
                          <span>Additional services (local collection, etc.):</span>
                          <span className="font-medium">€{currentMonthCharges.additionalServicesAmountEur.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-yellow-200">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold">€{currentMonthCharges.totalAmountEur.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      These charges will be included in your invoice when you request a shipment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Proformas */}
            {pendingProformas.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">Proforma Invoices Pending Payment</h3>
                    <div className="mt-2 space-y-2">
                      {pendingProformas.map((proforma: any) => {
                        const dueDate = new Date(proforma.dueDate)
                        const isOverdue = dueDate < now
                        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        
                        return (
                          <div key={proforma.id} className="bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Proforma for {new Date(proforma.year, proforma.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Amount: <span className="font-semibold">€{proforma.amountEur.toFixed(2)}</span>
                                </div>
                                <div className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                  Due: {dueDate.toLocaleDateString()} 
                                  {isOverdue ? ' (Overdue)' : daysUntilDue >= 0 ? ` (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining)` : ''}
                                </div>
                              </div>
                              {proforma.paymentLink ? (
                                <a
                                  href={proforma.paymentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                                >
                                  Pay Now
                                </a>
                              ) : (
                                <span className="px-4 py-2 bg-gray-300 text-gray-600 text-sm font-medium rounded-lg cursor-not-allowed">
                                  Payment Link Coming Soon
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Please pay within 7 days of receiving the proforma invoice.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {hasActiveSubscription ? (
              <Link
                href="/client/deliveries/new"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:scale-[1.02]"
                title="Report a new supplier delivery"
              >
                <Plus className="w-5 h-5" />
                <span>Report Delivery</span>
              </Link>
            ) : (
              <div className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-xl cursor-not-allowed">
                <Plus className="w-5 h-5" />
                <span>Report Delivery</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Activate your subscription to report deliveries.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            {hasActiveSubscription && hasReceivedItems ? (
              <Link
                href="/client/warehouse-orders"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all hover:shadow-lg hover:scale-[1.02]"
                title="Request shipment of your warehouse orders"
              >
                <Truck className="w-5 h-5" />
                <span>Request Shipment</span>
              </Link>
            ) : (
              <div className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-xl cursor-not-allowed">
                <Truck className="w-5 h-5" />
                <span>Request Shipment</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {!hasActiveSubscription 
                    ? 'Activate your subscription to request shipments.'
                    : 'You need at least one received item to request a shipment.'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
            <Link
              href="/client/settings?tab=billing"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all"
              title="View and manage your billing and subscription"
            >
              <Settings className="w-5 h-5" />
              <span>Settings & Billing</span>
            </Link>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Link
              href="/client/deliveries"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              <Package className="w-4 h-4" />
              <span>View All Deliveries</span>
            </Link>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Your Delivery Address</h2>
                {client?.clientCode && (
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Client Code: {client.clientCode}
                  </p>
                )}
              </div>
            </div>
            <CopyButton
              text={`MAK Consulting
ul. Plebiscytowa 3
41-100 Siemianowice Śląskie
Polska
Tel. +48 534 759 809 (for couriers only)`}
              label="address"
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="space-y-1 text-sm">
              <div className="font-semibold text-gray-900">MAK Consulting</div>
              <div className="text-gray-700">ul. Plebiscytowa 3</div>
              <div className="text-gray-700">41-100 Siemianowice Śląskie, Polska</div>
              <div className="text-gray-600 text-xs mt-2">
                📞 +48 534 759 809 <span className="text-gray-400">(for couriers only)</span>
              </div>
            </div>
            {!hasActiveSubscription && (
              <p className="text-xs text-gray-500 mt-3 italic">
                Use of this address requires an active subscription.
              </p>
            )}
          </div>
        </div>

        {/* Activity Overview - Expected Deliveries & At Warehouse */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
          {/* Expected Deliveries */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Truck className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Expected Deliveries</h2>
                  <p className="text-xs text-gray-500">
                    {expectedDeliveries.length} {expectedDeliveries.length === 1 ? 'delivery' : 'deliveries'} expected
                  </p>
                </div>
              </div>
              <Link
                href="/client/deliveries"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            {!clientId ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No client account linked</p>
                <p className="text-xs text-gray-400 mt-2">
                  Please contact support to link your account.
                </p>
              </div>
            ) : expectedDeliveries.length === 0 ? (
              <div className="py-8 text-center">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No expected deliveries</p>
                {!hasActiveSubscription ? (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Activate your plan to start.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">
                    Deliveries you report will appear here.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {expectedDeliveries.slice(0, 3).map((delivery: any) => (
                  <div
                    key={delivery.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{delivery.supplierName}</p>
                        <p className="text-xs text-gray-600 mt-1">{delivery.goodsDescription}</p>
                        {delivery.eta && (
                          <p className="text-xs text-blue-600 mt-2">
                            Expected: {formatDate(delivery.eta)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/client/deliveries/${delivery.id}`}
                        className="ml-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                ))}
                {expectedDeliveries.length > 3 && (
                  <Link
                    href="/client/deliveries"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                  >
                    View {expectedDeliveries.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* At Warehouse */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Box className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">At Warehouse</h2>
                  <p className="text-xs text-gray-500">
                    {warehouseOrders.length} {warehouseOrders.length === 1 ? 'item' : 'items'} stored
                  </p>
                </div>
              </div>
              <Link
                href="/client/warehouse-orders"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </Link>
            </div>
            {!clientId ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500">No client account linked</p>
                <p className="text-xs text-gray-400 mt-2">
                  Please contact support to link your account.
                </p>
              </div>
            ) : warehouseOrders.length === 0 ? (
              <div className="py-8 text-center">
                <Box className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No items at warehouse</p>
                {!hasActiveSubscription ? (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    Activate your plan to start.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">
                    Items will appear here once deliveries are received.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {warehouseOrders.slice(0, 3).map((order: any) => {
                  const delivery = order.delivery
                  return (
                    <div
                      key={order.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {delivery?.supplierName || 'Unknown Supplier'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {delivery?.goodsDescription || 'No description'}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {order.warehouseLocation && (
                              <span className="text-xs text-gray-500">
                                📍 {order.warehouseLocation}
                              </span>
                            )}
                            {order.receivedAt && (
                              <span className="text-xs text-gray-500">
                                Received: {formatDate(order.receivedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                        {order.sourceDeliveryId && (
                          <Link
                            href={`/client/deliveries/${order.sourceDeliveryId}`}
                            className="ml-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
                {warehouseOrders.length > 3 && (
                  <Link
                    href="/client/warehouse-orders"
                    className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium pt-2"
                  >
                    View {warehouseOrders.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Archive - at the bottom, collapsible */}
        {archivedShipments.length > 0 && (
          <div className="mb-8">
            <Archive shipments={archivedShipments} />
          </div>
        )}
      </div>
    </div>
  )
}
