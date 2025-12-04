'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Truck, Euro } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AlertBanner from '@/components/dashboard/AlertBanner'
import { formatVolumeCbm } from '@/lib/warehouse-calculations'

interface TransportChoicePanelProps {
  shipmentId: string
  calculatedPrice: number
  totalVolume: number
  totalWeight: number
  totalPallets: number
  shipmentType: 'PALLET' | 'PACKAGE'
  currentChoice?: string | null
  warehousePhone?: string
}

export default function TransportChoicePanel({
  shipmentId,
  calculatedPrice,
  totalVolume,
  totalWeight,
  totalPallets,
  shipmentType,
  currentChoice,
  warehousePhone = '[Contact number]',
}: TransportChoicePanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choice, setChoice] = useState<string | null>(currentChoice || null)
  const [showOwnTransportForm, setShowOwnTransportForm] = useState(false)
  
  // Fetch existing transport details if OWN_TRANSPORT is already selected
  const [existingDetails, setExistingDetails] = useState<any>(null)
  
  // Own transport form fields
  const [vehicleReg, setVehicleReg] = useState('')
  const [trailerReg, setTrailerReg] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [plannedLoadingDate, setPlannedLoadingDate] = useState('')

  // Fetch existing details when component mounts and OWN_TRANSPORT is selected
  useEffect(() => {
    if (currentChoice === 'OWN_TRANSPORT') {
      fetch(`/api/client/shipments/${shipmentId}`)
        .then(res => {
          if (res.ok) {
            return res.json()
          }
          return null
        })
        .then(data => {
          if (data) {
            setExistingDetails(data)
            setVehicleReg(data.ownTransportVehicleReg || '')
            setTrailerReg(data.ownTransportTrailerReg || '')
            setCarrier(data.ownTransportCarrier || '')
            setTrackingNumber(data.ownTransportTrackingNumber || '')
            setPlannedLoadingDate(
              data.ownTransportPlannedLoadingDate
                ? new Date(data.ownTransportPlannedLoadingDate).toISOString().split('T')[0]
                : ''
            )
            // Show form if already selected to allow adding/updating details
            setShowOwnTransportForm(true)
          }
        })
        .catch(() => {})
    }
  }, [currentChoice, shipmentId])

  const handleChoice = async (transportChoice: string, paymentMethod?: string) => {
    if (transportChoice === 'OWN_TRANSPORT' && !showOwnTransportForm && choice !== 'OWN_TRANSPORT') {
      // First time selecting - can save without details
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/client/shipments/${shipmentId}/transport-choice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transportChoice }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to save choice')
        }

        setChoice('OWN_TRANSPORT')
        setLoading(false)
        // Don't show form immediately - let user add details later
        router.push('/client/dashboard')
        return
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save choice')
        setLoading(false)
        return
      }
    }

    // If form is shown, save with details (optional for pallets, required for packages)
    if (transportChoice === 'OWN_TRANSPORT' && showOwnTransportForm) {
      setLoading(true)
      setError(null)

      try {
        const body: any = { transportChoice }
        
        // Include own transport details if provided
        if (shipmentType === 'PALLET') {
          // For pallets, details are optional - can be added later
          body.ownTransportVehicleReg = vehicleReg.trim() || null
          body.ownTransportTrailerReg = trailerReg.trim() || null
        } else {
          // For packages, carrier and tracking are required when saving details
          if (vehicleReg.trim() || carrier.trim() || trackingNumber.trim()) {
            if (!carrier.trim() || !trackingNumber.trim()) {
              setError('Both carrier name and tracking number are required')
              setLoading(false)
              return
            }
          }
          body.ownTransportCarrier = carrier.trim() || null
          body.ownTransportTrackingNumber = trackingNumber.trim() || null
        }
        
        // Add planned loading date if provided
        if (plannedLoadingDate) {
          body.ownTransportPlannedLoadingDate = new Date(plannedLoadingDate).toISOString()
        }

        const res = await fetch(`/api/client/shipments/${shipmentId}/transport-choice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to save details')
        }

        setLoading(false)
        router.push('/client/dashboard')
        return
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save details')
        setLoading(false)
        return
      }
    }

    // For other choices (ACCEPT, REQUEST_CUSTOM)
    setLoading(true)
    setError(null)

    try {
      const body: any = { transportChoice }
      if (paymentMethod) {
        body.paymentMethod = paymentMethod
      }

      const res = await fetch(`/api/client/shipments/${shipmentId}/transport-choice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save choice')
      }

      setChoice(transportChoice)
      
      if (transportChoice === 'ACCEPT') {
        // Show success message and redirect to dashboard
        // Payment link will be sent by admin/superadmin
        router.push('/client/dashboard')
      } else {
        // Redirect to dashboard after saving transport choice
        router.push('/client/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save choice')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Transport Choice</h1>
        <p className="mt-2 text-sm text-gray-600">Choose how to proceed with your shipment</p>
      </div>

      {error && (
        <AlertBanner type="error" title={error} dismissible onDismiss={() => setError(null)} />
      )}

      {/* Shipment Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium">{shipmentType === 'PALLET' ? 'Pallets' : 'Packages'}</span>
          </div>
          {shipmentType === 'PALLET' ? (
            <>
              <div>
                <span className="text-gray-600">Pallet Count:</span>
                <span className="ml-2 font-medium">{totalPallets}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Weight:</span>
                <span className="ml-2 font-medium">{totalWeight.toFixed(2)} kg</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-gray-600">Total Volume:</span>
                <span className="ml-2 font-medium">{formatVolumeCbm(totalVolume)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Weight:</span>
                <span className="ml-2 font-medium">{totalWeight.toFixed(2)} kg</span>
              </div>
            </>
          )}
          <div className="col-span-2">
            <span className="text-gray-600">Calculated Transport Price:</span>
            <span className="ml-2 font-semibold text-lg text-blue-600">€{calculatedPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Choice Options */}
      <div className="space-y-4">
        {/* Accept Price */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Accept & Pay</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Accept the calculated transport price of <strong>€{calculatedPrice.toFixed(2)}</strong>.
                A proforma invoice will be created which you can pay by bank transfer or payment link.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-4">
                <strong>Account activated immediately.</strong> You will receive a proforma invoice that can be paid via bank transfer or by requesting a payment link.
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleChoice('ACCEPT')}
              disabled={loading || choice === 'ACCEPT'}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Accept & Pay
            </button>
          </div>
        </div>

        {/* Request Custom Quote */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-yellow-500 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Request Custom Quote</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Request an individual quote from your sales representative. They will contact you with a custom price.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Your sales representative will be notified</span>
              </div>
            </div>
            <button
              onClick={() => handleChoice('REQUEST_CUSTOM')}
              disabled={loading || choice === 'REQUEST_CUSTOM'}
              className="ml-4 px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request Quote
            </button>
          </div>
        </div>

        {/* Own Transport */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-500 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="w-6 h-6 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Organize Own Transport</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                You will organize your own transport. For your safety, we will only release the goods if the vehicle and trailer (if applicable) registration numbers match the details provided.
              </p>
              {shipmentType === 'PALLET' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800 mb-4">
                  <strong>Important:</strong> Please provide the vehicle registration number and trailer registration number (if applicable) of the truck picking up the pallets. We will verify these details before releasing the shipment.
                </div>
              )}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800 mb-4">
                <strong>Loading window:</strong> Monday-Friday, 8:00-16:00
                <br />
                <strong>Warehouse contact:</strong> {warehousePhone} - Please provide this number to your transport company for pickup coordination
              </div>
              
              {showOwnTransportForm && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {shipmentType === 'PALLET' ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="vehicleReg" className="block text-sm font-medium text-gray-700 mb-1">
                          Vehicle Registration Number
                        </label>
                        <input
                          type="text"
                          id="vehicleReg"
                          value={vehicleReg}
                          onChange={(e) => setVehicleReg(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="e.g., AB123CD"
                        />
                        <p className="mt-1 text-xs text-gray-500">Required before shipment release</p>
                      </div>
                      <div>
                        <label htmlFor="trailerReg" className="block text-sm font-medium text-gray-700 mb-1">
                          Trailer Registration Number (if applicable)
                        </label>
                        <input
                          type="text"
                          id="trailerReg"
                          value={trailerReg}
                          onChange={(e) => setTrailerReg(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="e.g., XY456EF"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="carrier" className="block text-sm font-medium text-gray-700 mb-1">
                          Carrier Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="carrier"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="e.g., DHL, FedEx, UPS"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                          Tracking Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="trackingNumber"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          placeholder="e.g., 1234567890"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Planned loading date - for both pallets and packages */}
                  <div className="mt-4">
                    <label htmlFor="plannedLoadingDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Planned Loading Date (Optional)
                    </label>
                    <input
                      type="date"
                      id="plannedLoadingDate"
                      value={plannedLoadingDate}
                      onChange={(e) => setPlannedLoadingDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="mt-1 text-xs text-gray-500">When do you plan to pick up the shipment?</p>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleChoice('OWN_TRANSPORT')}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Transport Details'}
                    </button>
                    <button
                      onClick={() => {
                        setShowOwnTransportForm(false)
                        // Don't reset fields if choice is already OWN_TRANSPORT
                        if (choice !== 'OWN_TRANSPORT') {
                          setVehicleReg('')
                          setTrailerReg('')
                          setCarrier('')
                          setTrackingNumber('')
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                    >
                      {choice === 'OWN_TRANSPORT' ? 'Close' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
              
              {!showOwnTransportForm && (
                <>
                  <button
                    onClick={() => {
                      if (choice === 'OWN_TRANSPORT') {
                        // Show form to add/update details
                        setShowOwnTransportForm(true)
                      } else {
                        // First time - save choice without details
                        handleChoice('OWN_TRANSPORT')
                      }
                    }}
                    disabled={loading}
                    className="mt-4 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {choice === 'OWN_TRANSPORT' ? 'Add/Update Transport Details' : 'Use Own Transport'}
                  </button>
                  
                  {choice === 'OWN_TRANSPORT' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                      ✓ Own transport selected. Click above to add vehicle registration details before the shipment is released.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {choice && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Choice saved:</strong> {
              choice === 'ACCEPT' ? 'Accepted calculated price' :
              choice === 'REQUEST_CUSTOM' ? 'Requested custom quote' :
              'Own transport selected'
            }
          </p>
        </div>
      )}
    </div>
  )
}

