import type { FulfillmentStatus, PaymentStatus } from './orders'

export const paymentLabels: Record<PaymentStatus, string> = {
  pending: 'Pending Validation',
  confirmed: 'Payment Confirmed',
  rejected: 'Payment Rejected',
  refunded: 'Refunded',
}

export const fulfillmentLabels: Record<FulfillmentStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  packed: 'Packed',
  ready_for_pickup: 'Ready for Pickup',
  shipped: 'Shipped',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const paymentStatusOptions = Object.keys(paymentLabels) as PaymentStatus[]
export const fulfillmentStatusOptions = Object.keys(fulfillmentLabels) as FulfillmentStatus[]
