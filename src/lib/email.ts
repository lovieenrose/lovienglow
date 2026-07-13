import nodemailer, { type Transporter } from 'nodemailer'
import { formatPrice } from '@/lib/currency'
import paymentMethods from '@/data/paymentMethods'
import { shippingRegions } from '@/data/shipping'
import { hasEmailBeenSent, logEmail, type OrderWithRelations } from './orders'

let cached: Transporter | null = null

// Sends through the store owner's own Gmail account via SMTP, using a
// Google "App Password" (Google Account -> Security -> 2-Step Verification
// -> App Passwords). Requires 2-Step Verification to be enabled first.
function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_EMAIL
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')
  if (!user || !pass) return null
  if (!cached) {
    cached = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }
  return cached
}

function siteUrl() {
  return process.env.PUBLIC_SITE_URL ?? ''
}

function baseTemplate(title: string, bodyHtml: string) {
  return `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#fff5f8;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #f3d7e2;">
      <div style="background:#8c2847;padding:20px 32px;text-align:center;">
        <img src="${siteUrl()}/lovieNglow-logo-banner.png" alt="LovieNGlow" style="height:32px;" />
      </div>
      <div style="padding:32px;color:#3a2430;">
        <h1 style="font-size:20px;margin:0 0 16px;color:#8c2847;">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:20px 32px;background:#fff4f7;color:#a97b8c;font-size:12px;line-height:1.6;">
        <b style="color:#8c2847;">LovieNGlow</b><br/>
        Questions? Reply to this email or reach us at <a href="mailto:lovin.glow.ph@gmail.com" style="color:#8c2847;">lovin.glow.ph@gmail.com</a>
      </div>
    </div>
  </div>`
}

type StatusTone = 'pending' | 'processing' | 'shipped' | 'delivered'

function statusPill(label: string, tone: StatusTone) {
  const colors: Record<StatusTone, string> = {
    pending: '#a06a10;background:#fdeecb',
    processing: '#2a5f9e;background:#d9e8f9',
    shipped: '#2a5f9e;background:#d9e8f9',
    delivered: '#1f7a3d;background:#dcf3e2',
  }
  return `<p style="margin:16px 0;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;font-weight:bold;font-size:13px;color:${colors[tone]};">${label}</span></p>`
}

function itemsTable(order: OrderWithRelations) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:6px 0;">${item.product_name}</td>
        <td style="padding:6px 0;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;text-align:right;">${formatPrice(item.unit_price)}</td>
        <td style="padding:6px 0;text-align:right;">${formatPrice(item.line_total)}</td>
      </tr>`,
    )
    .join('')
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    <tr style="color:#a97b8c;font-size:12px;text-transform:uppercase;letter-spacing:.03em;">
      <td style="padding-bottom:6px;">Product</td>
      <td style="padding-bottom:6px;text-align:center;">Qty</td>
      <td style="padding-bottom:6px;text-align:right;">Unit Price</td>
      <td style="padding-bottom:6px;text-align:right;">Total</td>
    </tr>
    ${rows}
    <tr><td colspan="3" style="padding-top:10px;border-top:1px solid #f3d7e2;">Subtotal</td><td style="padding-top:10px;border-top:1px solid #f3d7e2;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
    <tr><td colspan="3">Shipping</td><td style="text-align:right;">${formatPrice(order.shipping_fee)}</td></tr>
    <tr><td colspan="3" style="font-weight:bold;padding-top:6px;">Total Amount</td><td style="font-weight:bold;padding-top:6px;text-align:right;">${formatPrice(order.total)}</td></tr>
  </table>`
}

function shippingInfoBlock(order: OrderWithRelations) {
  const region = shippingRegions.find((item) => item.id === order.region)
  const courierLabel = order.courier === 'lalamove' ? 'Lalamove' : 'J&T Express'
  return `<div style="background:#fff4f7;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">
    <b>Shipping Information</b><br/>
    ${order.address}${region ? `, ${region.label}` : ''}<br/>
    <span style="color:#a97b8c;">Courier: ${courierLabel}</span>
  </div>`
}

function paymentMethodBlock(order: OrderWithRelations) {
  const method = paymentMethods.find((item) => item.id === order.payment_method)
  return `<div style="background:#fff4f7;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">
    <b>Payment Method</b><br/>
    ${method?.label ?? order.payment_method}
  </div>`
}

function trackingLink(order: OrderWithRelations) {
  return `<p style="font-size:13px;">Tracking Number: <b>${order.tracking_code}</b><br/>
    <a href="${siteUrl()}/track?code=${encodeURIComponent(order.tracking_code)}" style="color:#8c2847;">Track your order status</a></p>`
}

async function send(to: string, subject: string, html: string, orderId: string, emailType: string) {
  const transporter = getTransporter()
  if (!transporter) {
    console.error(`[email] ${emailType} to ${to} skipped: GMAIL_EMAIL/GMAIL_APP_PASSWORD not set`)
    await logEmail(orderId, emailType, to, subject, false)
    return
  }
  const from = process.env.GMAIL_EMAIL!
  try {
    await transporter.sendMail({ from: `LovieNGlow <${from}>`, to, subject, html })
    await logEmail(orderId, emailType, to, subject, true)
  } catch (err) {
    console.error(`[email] ${emailType} to ${to} failed:`, err)
    await logEmail(orderId, emailType, to, subject, false)
  }
}

// ── Content builders (pure — no side effects, reused by both the guarded
// automatic triggers below and the manual retry path) ───────────────────

function buildOrderReceived(order: OrderWithRelations) {
  const placedAt = new Date(order.placed_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
  return {
    subject: 'Order Confirmation – Thank you for your order!',
    html: baseTemplate(
      'Thank you for your order! 💕',
      `<p>Hi ${order.full_name.split(' ')[0]}, we've received your order and can't wait for you to try it.</p>
       <p><b>Order Number:</b> ${order.reference}<br/><b>Date &amp; Time:</b> ${placedAt}</p>
       ${itemsTable(order)}
       ${shippingInfoBlock(order)}
       ${paymentMethodBlock(order)}
       ${statusPill('Waiting for Payment Validation', 'pending')}
       <p>We're currently validating your payment. This process may take up to <b>24 hours</b>. We'll notify you as soon as your payment has been confirmed.</p>
       ${trackingLink(order)}`,
    ),
  }
}

function buildPaymentConfirmed(order: OrderWithRelations) {
  return {
    subject: "Payment Confirmed – We're Processing Your Order!",
    html: baseTemplate(
      'Your payment is confirmed! 🎉',
      `<p>Hi ${order.full_name.split(' ')[0]}, great news — your payment for order <b>${order.reference}</b> has been successfully verified.</p>
       ${statusPill('Processing', 'processing')}
       <p>Our team is now preparing your order for shipment. We'll send another email once your package is on its way.</p>
       ${trackingLink(order)}`,
    ),
  }
}

function buildOrderPacked(order: OrderWithRelations) {
  return {
    subject: `Your order ${order.reference} is packed and ready! 📦`,
    html: baseTemplate(
      'Your order is packed and ready! 📦',
      `<p>Hi ${order.full_name.split(' ')[0]}, order <b>${order.reference}</b> has been packed and is ready to ship.</p>`,
    ),
  }
}

function buildOrderShipped(order: OrderWithRelations, trackingNumber: string) {
  const courierLabel = order.courier === 'lalamove' ? 'Lalamove' : 'J&T Express'
  return {
    subject: 'Your Order is On the Way!',
    html: baseTemplate(
      'Your order is on its way! 🚚',
      `<p>Hi ${order.full_name.split(' ')[0]}, order <b>${order.reference}</b> has been shipped and is on its way to you.</p>
       ${statusPill('Shipped', 'shipped')}
       <p><b>Courier:</b> ${courierLabel}${trackingNumber ? `<br/><b>Courier Tracking Number:</b> ${trackingNumber}` : ''}</p>
       <p>You can track your package using the information above (if provided). Thank you for shopping with us!</p>
       ${trackingLink(order)}`,
    ),
  }
}

function buildOrderDelivered(order: OrderWithRelations) {
  const reviewUrl = process.env.GOOGLE_REVIEW_FORM_URL
  const reviewButton = reviewUrl
    ? `<p style="text-align:center;margin:24px 0;">
         <a href="${reviewUrl}" target="_blank" rel="noreferrer" style="background:#8c2847;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Leave a Review</a>
         <br/><span style="font-size:12px;color:#a97b8c;">Takes less than a minute — photos of your results or package are always appreciated!</span>
       </p>`
    : ''
  return {
    subject: 'Your Order Has Been Delivered!',
    html: baseTemplate(
      'Your order has arrived! 🎁',
      `<p>Hi ${order.full_name.split(' ')[0]}, order <b>${order.reference}</b> has been delivered. We hope you're loving it!</p>
       ${statusPill('Delivered', 'delivered')}
       <p><b>We'd love your feedback!</b><br/>Your review helps us improve and assists other customers in making informed purchasing decisions.</p>
       ${reviewButton}`,
    ),
  }
}

function buildAdminNotification(order: OrderWithRelations) {
  const subject = `New Order Received — ${order.reference}`
  return {
    subject,
    html: baseTemplate(
      subject,
      `<p><b>${order.full_name}</b> just placed an order.</p>
       ${itemsTable(order)}
       <p><a href="${siteUrl()}/dashboard/orders/${order.reference}">View order in dashboard</a></p>`,
    ),
  }
}

// ── Guarded automatic triggers — each email_type is sent at most once per
// order, even if the same status is saved again later. ──────────────────

async function sendOnce(order: OrderWithRelations, emailType: string, build: () => { subject: string; html: string }) {
  if (!order.email) return
  if (await hasEmailBeenSent(order.id, emailType)) return
  const { subject, html } = build()
  await send(order.email, subject, html, order.id, emailType)
}

export async function sendOrderReceived(order: OrderWithRelations) {
  await sendOnce(order, 'order_received', () => buildOrderReceived(order))
}

export async function sendPaymentConfirmed(order: OrderWithRelations) {
  await sendOnce(order, 'payment_confirmed', () => buildPaymentConfirmed(order))
}

export async function sendOrderPacked(order: OrderWithRelations) {
  await sendOnce(order, 'packed', () => buildOrderPacked(order))
}

export async function sendOrderShipped(order: OrderWithRelations, trackingNumber: string) {
  await sendOnce(order, 'shipped', () => buildOrderShipped(order, trackingNumber))
}

export async function sendOrderDelivered(order: OrderWithRelations) {
  await sendOnce(order, 'delivered', () => buildOrderDelivered(order))
}

export async function sendAdminNotification(order: OrderWithRelations) {
  // ADMIN_EMAIL was removed when the hardcoded admin login was replaced by
  // Supabase Auth — GMAIL_EMAIL (the business owner's inbox we send from)
  // is now also the notification recipient. Not order-status-based, so no
  // once-per-order guard: it only ever fires once anyway, at checkout.
  const adminEmail = process.env.GMAIL_EMAIL
  if (!adminEmail) return
  const { subject, html } = buildAdminNotification(order)
  await send(adminEmail, subject, html, order.id, 'admin_notification')
}

// ── Retry: re-send a previously logged email type ────────────────────────
// Bypasses the once-per-order guard on purpose — an admin explicitly asking
// to retry should always retry, even if a prior attempt is already logged.
export type OrderEmailType = 'order_received' | 'payment_confirmed' | 'packed' | 'shipped' | 'delivered' | 'admin_notification'

export async function resendOrderEmail(order: OrderWithRelations, emailType: OrderEmailType) {
  if (!order.email) return
  if (emailType === 'admin_notification') return sendAdminNotification(order)

  const content =
    emailType === 'order_received' ? buildOrderReceived(order) :
    emailType === 'payment_confirmed' ? buildPaymentConfirmed(order) :
    emailType === 'packed' ? buildOrderPacked(order) :
    emailType === 'shipped' ? buildOrderShipped(order, order.tracking_number ?? '') :
    buildOrderDelivered(order)

  await send(order.email, content.subject, content.html, order.id, emailType)
}
