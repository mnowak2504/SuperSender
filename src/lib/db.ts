import 'server-only'
import { createClient } from '@supabase/supabase-js'

// Supabase client for server-side operations
// Uses service role key for admin access (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Type definitions (replace Prisma types)
export type Role = 'CLIENT' | 'WAREHOUSE' | 'ADMIN' | 'SUPERADMIN'

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string | null
  phone: string | null
  role: Role
  clientId: string | null
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  displayName: string
  email: string
  phone: string | null
  country: string
  clientCode: string
  salesOwnerCode: string
  planId: string | null
  status: string
  spaceUsagePct: number
  caretakerName: string | null
  caretakerContact: string | null
  creditHold: boolean
  storageOvercharge: number
  deliveriesThisMonth: number
  lastInvoiceDate: string | null
  invoiceName: string | null
  businessName: string | null
  vatNumber: string | null
  invoiceAddress: string | null
  createdAt: string
  updatedAt: string
}

export interface DeliveryExpected {
  id: string
  clientId: string
  supplierName: string
  goodsDescription: string
  orderNumber: string | null
  clientReference: string | null
  eta: string | null
  status: 'EXPECTED' | 'RECEIVED' | 'REJECTED' | 'DAMAGED'
  location: string | null
  quantity: number | null
  condition: string | null
  notes: string | null
  warehouseLocation: string | null
  receivedAt: string | null
  receivedById: string | null
  createdAt: string
}

export interface WarehouseOrder {
  id: string
  clientId: string
  sourceDeliveryId: string | null
  status: 'AT_WAREHOUSE' | 'TO_PACK' | 'PACKED' | 'READY_FOR_QUOTE' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED'
  packedLengthCm: number | null
  packedWidthCm: number | null
  packedHeightCm: number | null
  packedWeightKg: number | null
  warehouseLocation: string | null
  storageDays: number
  notes: string | null
  receivedAt: string | null
  packedAt: string | null
  createdAt: string
}

export interface ShipmentOrder {
  id: string
  clientId: string
  deliveryAddressId: string
  transportMode: 'MAK' | 'CLIENT_OWN'
  timeWindowFrom: string | null
  timeWindowTo: string | null
  status: 'REQUESTED' | 'QUOTED' | 'AWAITING_ACCEPTANCE' | 'AWAITING_PAYMENT' | 'READY_FOR_LOADING' | 'IN_TRANSIT' | 'DELIVERED'
  proposedPriceEur: number | null
  acceptedAt: string | null
  loadingSlotBooked: boolean
  loadingSlotFrom: string | null
  loadingSlotTo: string | null
  paymentConfirmedAt: string | null
  quotedAt: string | null
  quotedById: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  clientId: string
  type: 'SUBSCRIPTION' | 'TRANSPORT' | 'OPERATIONS'
  amountEur: number
  currency: string
  status: 'ISSUED' | 'PAID' | 'OVERDUE'
  revolutLink: string | null
  revolutPaymentId: string | null
  paymentWebhookReceivedAt: string | null
  invoiceNumber: string | null
  periodStart: string | null
  periodEnd: string | null
  dueDate: string
  shipmentOrderId: string | null
  createdAt: string
  paidAt: string | null
}

export interface Address {
  id: string
  clientId: string
  contactName: string
  contactPhone: string
  line1: string
  line2: string | null
  city: string
  postalCode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Helper functions for common queries
export const db = {
  // User operations
  async findUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error || !data) return null
    return data as User
  },

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    return data as User
  },

  async createUser(userData: {
    email: string
    passwordHash: string
    name?: string | null
    phone?: string | null
    role?: Role
  }): Promise<User> {
    // Use RPC function for reliable user creation (works even with anon key)
    console.log('Calling insert_user RPC function (passwordHash hidden)')
    
    const { data, error } = await supabase.rpc('insert_user', {
      p_email: userData.email,
      p_password_hash: userData.passwordHash,
      p_name: userData.name || null,
      p_phone: userData.phone || null,
      p_role: userData.role || 'CLIENT',
    })
    
    if (error) {
      console.error('Supabase RPC error creating user:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('No data returned from Supabase RPC function')
    }
    
    const user = data[0] as any
    
    console.log('User created successfully via Supabase RPC:', {
      id: user.id,
      email: user.email,
      role: user.role,
    })
    
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      phone: user.phone,
      role: user.role as Role,
      clientId: user.clientId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as User
  },

  // Client operations
  async findClientById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) return null
    return data as Client
  },

  // Generic query helper
  async query<T = any>(table: string, filters?: Record<string, any>): Promise<T[]> {
    let query = supabase.from(table).select('*')
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return (data || []) as T[]
  },
}

// supabase is already exported above

