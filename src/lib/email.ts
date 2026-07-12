import { Resend } from 'resend'
import { formatPrice } from '@/data/products'
import { logEmail, type OrderWithRelations } from './orders'

let cached: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key || key.startsWith('re_xxxx')) return null
  if (!cached) cached = new Resend(key)
  return cached
}

function baseTemplate(title: string, bodyHtml: string) {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#fff5f8;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f3d7e2;">
      <div style="background:#8c2847;padding:24px 32px;">
        <span style="color:#ffffff;font-size:20px;letter-spacing:0.04em;">LovieNGlow</span>
      </div>
      <div style="padding:32px;color:#3a2430;">
        <h1 style="font-size:20px;margin:0 0 16px;color:#8c2847;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px;background:#fff4f7;color:#a97b8c;font-size:12px;">
        LovieNGlow &mdash; questions? reply to this email or reach us at lovin.glow.ph@gmail.com
      </div>
    </div>
  </div>`
}

function itemsTable(order: OrderWithRelations) {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;">${item.product_name} &times; ${item.quantity}</td><td style="padding:6px 0;text-align:right;">${formatPrice(item.line_total)}</td></tr>`,
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    ${rows}
    <tr><td style="padding-top:10px;border-top:1px solid #f3d7e2;">Subtotal</td><td style="padding-top:10px;border-top:1px solid #f3d7e2;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right;">${formatPrice(order.shipping_fee)}</td></tr>
    <tr><td style="font-weight:bold;padding-top:6px;">Total</td><td style="font-weight:bold;padding-top:6px;text-align:right;">${formatPrice(order.total)}</td></tr>
  </table>`
}

async function send(to: string, subject: string, html: string, orderId: string, emailType: string) {
  const resend = getResend()
  if (!resend) {
    await logEmail(orderId, emailType, to, subject, false)
    return
  }
  const from = process.env.RESEND_FROM_EMAIL ?? 'no-reply@lovienglow.com'
  try {
    await resend.emails.send({ from, to, subject, html })
    await logEmail(orderId, emailType, to, subject, true)
  } catch {
    await logEmail(orderId, emailType, to, subject, false)
  }
}

export async function sendOrderReceived(order: OrderWithRelations) {
  if (!order.email) return
  const html = baseTemplate(
    'We got your order! 💕',
    `<p>Hi ${order.full_name.split(' ')[0]}, thank you for ordering from LovieNGlow. We're verifying your payment now.</p>
     <p><b>Order Reference:</b> ${order.reference}</p>
     ${itemsTable(order)}`,
  )
  await send(order.email, 'We got your order! 💕', html, order.id, 'order_received')
}

export async function sendPaymentConfirmed(order: OrderWithRelations) {
  if (!order.email) return
  const html = baseTemplate(
    'Your payment is confirmed! 🎉',
    `<p>Hi ${order.full_name.split(' ')[0]}, your payment for order <b>${order.reference}</b> has been confirmed. We're getting your order ready.</p>
     ${itemsTable(order)}`,
  )
  await send(order.email, 'Your payment is confirmed! 🎉', html, order.id, 'payment_confirmed')
}

export async function sendOrderPacked(order: OrderWithRelations) {
  if (!order.email) return
  const html = baseTemplate(
    'Your order is packed and ready! 📦',
    `<p>Hi ${order.full_name.split(' ')[0]}, order <b>${order.reference}</b> has been packed and is ready to ship.</p>`,
  )
  await send(order.email, 'Your order is packed and ready! 📦', html, order.id, 'packed')
}

export async function sendOrderShipped(order: OrderWithRelations, trackingNumber: string) {
  if (!order.email) return
  const html = baseTemplate(
    'Your order is on its way! 🚚',
    `<p>Hi ${order.full_name.split(' ')[0]}, order <b>${order.reference}</b> has shipped via ${order.courier === 'lalamove' ? 'Lalamove' : 'J&T Express'}.</p>
     ${trackingNumber ? `<p><b>Tracking Number:</b> ${trackingNumber}</p>` : ''}`,
  )
  await send(order.email, 'Your order is on its way! 🚚', html, order.id, 'shipped')
}

export async function sendAdminNotification(order: OrderWithRelations) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  const siteUrl = process.env.PUBLIC_SITE_URL ?? ''
  const html = baseTemplate(
    `New Order Received — ${order.reference}`,
    `<p><b>${order.full_name}</b> just placed an order.</p>
     ${itemsTable(order)}
     <p><a href="${siteUrl}/dashboard/orders/${order.reference}">View order in dashboard</a></p>`,
  )
  await send(adminEmail, `New Order Received — ${order.reference}`, html, order.id, 'admin_notification')
}
