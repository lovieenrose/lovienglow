import type { FulfillmentStatus, OrderStatus, PaymentStatus } from './orders'

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

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const orderStatusBadgeClass: Record<OrderStatus, string> = {
  pending_payment: 'dash-badge--order-pending_payment',
  processing: 'dash-badge--order-processing',
  shipped: 'dash-badge--order-shipped',
  delivered: 'dash-badge--order-delivered',
  cancelled: 'dash-badge--order-cancelled',
}

// The 4 primary steps an admin steps through; "cancelled" is a separate
// escape-hatch action, not part of the main sequence.
export const orderStatusSteps: OrderStatus[] = ['pending_payment', 'processing', 'shipped', 'delivered']
