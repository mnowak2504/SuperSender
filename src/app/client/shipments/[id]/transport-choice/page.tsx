import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/db'
import TransportChoicePanel from '@/components/shipments/TransportChoicePanel'

export const runtime = 'nodejs'

export default async function TransportChoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  const { id } = await params

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const role = (session.user as any)?.role
  if (role !== 'CLIENT') {
    redirect('/unauthorized')
  }

  // Get shipment details
  const { data: shipment, error } = await supabase
    .from('ShipmentOrder')
    .select(`
      *,
      Client:clientId(*),
      items: ShipmentItem(
        warehouseOrder:WarehouseOrder(
          id,
          packages:Package(*)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !shipment) {
    redirect('/client/shipments')
  }

  // Check if client owns this shipment
  const clientId = (session.user as any)?.clientId
  if (shipment.clientId !== clientId) {
    redirect('/unauthorized')
  }

  // Check if warehouse has packed and calculated price
  // Status should be QUOTED (after packing) or AWAITING_ACCEPTANCE (after transport choice)
  if (shipment.status === 'REQUESTED' || (!shipment.calculatedPriceEur && shipment.status !== 'QUOTED')) {
    // Warehouse is still packing - show waiting message
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white shadow rounded-lg p-8 max-w-md text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for Warehouse</h2>
          <p className="text-gray-600 mb-4">
            Your shipment is being packed by the warehouse. Once they enter the shipping dimensions and calculate the transport price, you'll be able to choose your delivery options.
          </p>
          <p className="text-sm text-gray-500">
            We'll notify you when the shipment is ready for transport selection.
          </p>
          <div className="mt-6">
            <a
              href="/client/dashboard"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Calculate totals from packages linked to ShipmentOrder (not WarehouseOrder)
  let totalVolume = 0
  let totalWeight = 0
  let totalPallets = 0
  let shipmentTypeFromPackages: 'PALLET' | 'PACKAGE' = 'PACKAGE'
  
  const { data: shipmentPackages } = await supabase
    .from('Package')
    .select('type, volumeCbm, weightKg')
    .eq('shipmentId', id)

  if (shipmentPackages && shipmentPackages.length > 0) {
    for (const pkg of shipmentPackages) {
      totalVolume += pkg.volumeCbm || 0
      totalWeight += pkg.weightKg || 0
      if (pkg.type === 'PALLET') {
        totalPallets++
        shipmentTypeFromPackages = 'PALLET'
      }
    }
  }

  return (
    <TransportChoicePanel
      shipmentId={id}
      calculatedPrice={shipment.calculatedPriceEur || 0}
      totalVolume={totalVolume}
      totalWeight={totalWeight}
      totalPallets={totalPallets}
      shipmentType={shipmentTypeFromPackages}
      currentChoice={shipment.clientTransportChoice}
      warehousePhone="+48 534 759 809"
    />
  )
}

