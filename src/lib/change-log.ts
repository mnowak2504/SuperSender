import { supabase } from './db'

export interface ChangeLogEntry {
  actorId: string
  entityType: 'CLIENT' | 'PLAN' | 'USER' | 'SUBSCRIPTION'
  entityId: string
  action: string
  details?: string
}

/**
 * Log a change to the ChangeLog table
 */
export async function logChange(entry: ChangeLogEntry): Promise<void> {
  try {
    const { error } = await supabase
      .from('ChangeLog')
      .insert({
        actorId: entry.actorId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        details: entry.details || null,
      })

    if (error) {
      console.error('Error logging change:', error)
      // Don't throw - logging failures shouldn't break the main operation
    }
  } catch (error) {
    console.error('Error in logChange:', error)
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Format discount change details
 */
export function formatDiscountChange(
  oldSubscriptionDiscount: number | null,
  newSubscriptionDiscount: number | null,
  oldAdditionalDiscount: number | null,
  newAdditionalDiscount: number | null
): string {
  const changes: string[] = []
  
  if (oldSubscriptionDiscount !== newSubscriptionDiscount) {
    changes.push(`Zniżka subskrypcji: ${oldSubscriptionDiscount || 0}% → ${newSubscriptionDiscount || 0}%`)
  }
  
  if (oldAdditionalDiscount !== newAdditionalDiscount) {
    changes.push(`Zniżka usług dodatkowych: ${oldAdditionalDiscount || 0}% → ${newAdditionalDiscount || 0}%`)
  }
  
  return changes.join(', ')
}

/**
 * Format individual plan change details
 */
export function formatIndividualPlanChange(
  oldValues: {
    cbm?: number | null
    deliveries?: number | null
    shipments?: number | null
    operationsRate?: number | null
    overSpaceRate?: number | null
    additionalServicesRate?: number | null
  },
  newValues: {
    cbm?: number | null
    deliveries?: number | null
    shipments?: number | null
    operationsRate?: number | null
    overSpaceRate?: number | null
    additionalServicesRate?: number | null
  }
): string {
  const changes: string[] = []
  
  if (oldValues.cbm !== newValues.cbm) {
    changes.push(`CBM: ${oldValues.cbm || 'brak'} → ${newValues.cbm || 'brak'}`)
  }
  if (oldValues.deliveries !== newValues.deliveries) {
    changes.push(`Dostawy/miesiąc: ${oldValues.deliveries || 'brak'} → ${newValues.deliveries || 'brak'}`)
  }
  if (oldValues.shipments !== newValues.shipments) {
    changes.push(`Wysyłki/miesiąc: ${oldValues.shipments || 'brak'} → ${newValues.shipments || 'brak'}`)
  }
  if (oldValues.operationsRate !== newValues.operationsRate) {
    changes.push(`Stawka operacyjna: €${oldValues.operationsRate || 0} → €${newValues.operationsRate || 0}`)
  }
  if (oldValues.overSpaceRate !== newValues.overSpaceRate) {
    changes.push(`Stawka za przekroczenie: €${oldValues.overSpaceRate || 0} → €${newValues.overSpaceRate || 0}`)
  }
  if (oldValues.additionalServicesRate !== newValues.additionalServicesRate) {
    changes.push(`Stawka usług dodatkowych: €${oldValues.additionalServicesRate || 0} → €${newValues.additionalServicesRate || 0}`)
  }
  
  return changes.join(', ')
}

