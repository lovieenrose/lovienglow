import { T as TSS_SERVER_FUNCTION, u as useSession$1, a as getSession$1, c as createServerFn } from "../server.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { f as formatPrice, s as shippingRegions, p as paymentMethods } from "./shipping-B_aQucIA.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
var createServerRpc = (serverFnMeta, splitImportFn) => {
  const url = "/_serverFn/" + serverFnMeta.id;
  return Object.assign(splitImportFn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
function ownerSessionConfig() {
  const password = process.env.ADMIN_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SECRET must be set to a random string of at least 32 characters");
  }
  return {
    password,
    name: "lng_owner_session",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 7
    }
  };
}
async function getOwnerSessionManager() {
  return useSession$1(ownerSessionConfig());
}
async function getOwnerSession() {
  return getSession$1(ownerSessionConfig());
}
function anonClient(accessToken) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : void 0
  });
}
async function establishOwnerSession(accessToken, refreshToken) {
  const supabase = anonClient(accessToken);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Invalid session");
  const session = await getOwnerSessionManager();
  await session.update({ accessToken, refreshToken });
  return data.user;
}
async function clearOwnerSession() {
  const session = await getOwnerSessionManager();
  await session.clear();
}
async function requireOwner() {
  const session = await getOwnerSession();
  const tokens = session.data;
  if (!tokens?.accessToken) throw new Error("Not authenticated");
  let supabase = anonClient(tokens.accessToken);
  let { data, error } = await supabase.auth.getUser();
  if ((error || !data.user) && tokens.refreshToken) {
    const refreshClient = anonClient();
    const { data: refreshed, error: refreshError } = await refreshClient.auth.refreshSession({
      refresh_token: tokens.refreshToken
    });
    if (refreshError || !refreshed.session) throw new Error("Not authenticated");
    const manager = await getOwnerSessionManager();
    await manager.update({
      accessToken: refreshed.session.access_token,
      refreshToken: refreshed.session.refresh_token
    });
    supabase = anonClient(refreshed.session.access_token);
    const retry = await supabase.auth.getUser();
    data = retry.data;
    error = retry.error;
  }
  if (error || !data.user) throw new Error("Not authenticated");
  return { ownerId: data.user.id, supabase };
}
async function isOwnerAuthenticated() {
  try {
    await requireOwner();
    return true;
  } catch {
    return false;
  }
}
const RECEIPTS_BUCKET = "receipts";
let cached$1 = null;
function getSupabaseAdmin() {
  if (cached$1) return cached$1;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  cached$1 = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cached$1;
}
let bucketEnsured = false;
async function ensureReceiptsBucket() {
  if (bucketEnsured) return;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage.getBucket(RECEIPTS_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(RECEIPTS_BUCKET, { public: true });
  }
  bucketEnsured = true;
}
async function uploadReceipt(filename, contentType, bytes) {
  await ensureReceiptsBucket();
  const supabase = getSupabaseAdmin();
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(RECEIPTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
async function uploadPaymentProof(filename, contentType, bytes) {
  return uploadReceipt(filename, contentType, bytes);
}
const BANNERS_BUCKET = "banners";
let bannersBucketEnsured = false;
async function ensureBannersBucket() {
  if (bannersBucketEnsured) return;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.storage.getBucket(BANNERS_BUCKET);
  if (!data) {
    await supabase.storage.createBucket(BANNERS_BUCKET, { public: true });
  }
  bannersBucketEnsured = true;
}
async function uploadInvoiceBanner(filename, contentType, bytes) {
  await ensureBannersBucket();
  const supabase = getSupabaseAdmin();
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage.from(BANNERS_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BANNERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
const LEGACY_STATUS_BY_ORDER_STATUS = {
  pending_payment: { paymentStatus: "pending", fulfillmentStatus: "pending" },
  processing: { paymentStatus: "confirmed", fulfillmentStatus: "processing" },
  shipped: { paymentStatus: "confirmed", fulfillmentStatus: "shipped" },
  delivered: { paymentStatus: "confirmed", fulfillmentStatus: "delivered" },
  cancelled: { paymentStatus: "rejected", fulfillmentStatus: "cancelled" }
};
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
function base64ToBytes$1(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}
async function createOrder(input) {
  const bytes = base64ToBytes$1(input.receiptBase64);
  if (bytes.byteLength > MAX_RECEIPT_BYTES) {
    throw new Error("Receipt file exceeds the 5 MB limit");
  }
  const supabase = getSupabaseAdmin();
  const { data: refData, error: refError } = await supabase.rpc("next_order_reference");
  if (refError) throw refError;
  const reference = refData;
  const { data: trackingData, error: trackingError } = await supabase.rpc("next_tracking_code");
  if (trackingError) throw trackingError;
  const trackingCode = trackingData;
  const receiptUrl = await uploadReceipt(input.receiptFilename, input.receiptContentType, bytes);
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    reference,
    tracking_code: trackingCode,
    order_status: "pending_payment",
    placed_at: (/* @__PURE__ */ new Date()).toISOString(),
    full_name: input.fullName,
    contact_number: input.contactNumber,
    email: input.email || null,
    social_handle: input.socialHandle || null,
    address: input.address,
    courier: input.courier,
    region: input.region || null,
    payment_method: input.paymentMethod,
    receipt_url: receiptUrl,
    receipt_filename: input.receiptFilename,
    subtotal: input.subtotal,
    shipping_fee: input.shippingFee,
    discount: input.discount,
    promo_code: input.promoCode || null,
    total: input.total
  }).select().single();
  if (orderError) throw orderError;
  const orderRow = order;
  const { data: items, error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId ?? null,
      product_set_id: item.productSetId ?? null,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal
    }))
  ).select();
  if (itemsError) throw itemsError;
  return { ...orderRow, items: items ?? [], history: [], emails: [] };
}
async function getOrder(reference) {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase.from("orders").select().eq("reference", reference).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const orderRow = order;
  const [{ data: items }, { data: history }, { data: emails }] = await Promise.all([
    supabase.from("order_items").select().eq("order_id", orderRow.id),
    supabase.from("order_status_history").select().eq("order_id", orderRow.id).order("changed_at", { ascending: false }),
    supabase.from("email_log").select().eq("order_id", orderRow.id).order("sent_at", { ascending: false })
  ]);
  return {
    ...orderRow,
    items: items ?? [],
    history: history ?? [],
    emails: emails ?? []
  };
}
async function listOrders(filters = {}) {
  const supabase = getSupabaseAdmin();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  let query = supabase.from("orders").select("*", { count: "exact" });
  if (filters.orderStatus) query = query.eq("order_status", filters.orderStatus);
  if (filters.courier) query = query.eq("courier", filters.courier);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `reference.ilike.%${term}%,tracking_code.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`
    );
  }
  query = query.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);
  const { data, error, count } = await query;
  if (error) throw error;
  return { orders: data ?? [], total: count ?? 0, page, pageSize };
}
async function listAllOrdersForExport(filters = {}) {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("orders").select("*");
  if (filters.orderStatus) query = query.eq("order_status", filters.orderStatus);
  if (filters.courier) query = query.eq("courier", filters.courier);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `reference.ilike.%${term}%,tracking_code.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`
    );
  }
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function updateOrder(reference, patch) {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: fetchError } = await supabase.from("orders").select().eq("reference", reference).single();
  if (fetchError) throw fetchError;
  const existingRow = existing;
  const update = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (patch.trackingNumber !== void 0) update.tracking_number = patch.trackingNumber;
  if (patch.internalNotes !== void 0) update.internal_notes = patch.internalNotes;
  if (patch.orderStatus !== void 0) {
    update.order_status = patch.orderStatus;
    const legacy = LEGACY_STATUS_BY_ORDER_STATUS[patch.orderStatus];
    update.payment_status = legacy.paymentStatus;
    update.fulfillment_status = legacy.fulfillmentStatus;
  }
  const { error: updateError } = await supabase.from("orders").update(update).eq("id", existingRow.id);
  if (updateError) throw updateError;
  if (patch.orderStatus !== void 0 && patch.orderStatus !== existingRow.order_status) {
    await supabase.from("order_status_history").insert({
      order_id: existingRow.id,
      field: "order_status",
      old_value: existingRow.order_status,
      new_value: patch.orderStatus,
      note: patch.note ?? null
    });
  }
  const updated = await getOrder(reference);
  if (!updated) throw new Error("Order not found after update");
  return updated;
}
async function getOrderByTrackingCode(trackingCode) {
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase.from("orders").select("id, reference, tracking_code, order_status, courier, created_at, updated_at").eq("tracking_code", trackingCode.trim()).maybeSingle();
  if (error) throw error;
  if (!order) return null;
  const orderRow = order;
  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from("order_items").select("product_name, quantity, unit_price, line_total").eq("order_id", orderRow.id),
    supabase.from("order_status_history").select("new_value, changed_at").eq("order_id", orderRow.id).eq("field", "order_status").order("changed_at", { ascending: true })
  ]);
  return {
    reference: orderRow.reference,
    tracking_code: orderRow.tracking_code,
    order_status: orderRow.order_status,
    courier: orderRow.courier,
    created_at: orderRow.created_at,
    updated_at: orderRow.updated_at,
    items: items ?? [],
    history: history ?? []
  };
}
async function logEmail(orderId, emailType, sentTo, subject, success) {
  const supabase = getSupabaseAdmin();
  await supabase.from("email_log").insert({
    order_id: orderId,
    email_type: emailType,
    sent_to: sentTo,
    subject,
    success
  });
}
async function hasEmailBeenSent(orderId, emailType) {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase.from("email_log").select("id", { count: "exact", head: true }).eq("order_id", orderId).eq("email_type", emailType).eq("success", true);
  return (count ?? 0) > 0;
}
let cached = null;
function getTransporter() {
  const user = process.env.GMAIL_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;
  if (!cached) {
    cached = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });
  }
  return cached;
}
function siteUrl() {
  return process.env.PUBLIC_SITE_URL ?? "";
}
function baseTemplate(title, bodyHtml) {
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
  </div>`;
}
function statusPill(label, tone) {
  const colors = {
    pending: "#a06a10;background:#fdeecb",
    processing: "#2a5f9e;background:#d9e8f9",
    shipped: "#2a5f9e;background:#d9e8f9",
    delivered: "#1f7a3d;background:#dcf3e2"
  };
  return `<p style="margin:16px 0;"><span style="display:inline-block;padding:6px 14px;border-radius:999px;font-weight:bold;font-size:13px;color:${colors[tone]};">${label}</span></p>`;
}
function itemsTable(order) {
  const rows = order.items.map(
    (item) => `<tr>
        <td style="padding:6px 0;">${item.product_name}</td>
        <td style="padding:6px 0;text-align:center;">${item.quantity}</td>
        <td style="padding:6px 0;text-align:right;">${formatPrice(item.unit_price)}</td>
        <td style="padding:6px 0;text-align:right;">${formatPrice(item.line_total)}</td>
      </tr>`
  ).join("");
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
  </table>`;
}
function shippingInfoBlock(order) {
  const region = shippingRegions.find((item) => item.id === order.region);
  const courierLabel = order.courier === "lalamove" ? "Lalamove" : "J&T Express";
  return `<div style="background:#fff4f7;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">
    <b>Shipping Information</b><br/>
    ${order.address}${region ? `, ${region.label}` : ""}<br/>
    <span style="color:#a97b8c;">Courier: ${courierLabel}</span>
  </div>`;
}
function paymentMethodBlock(order) {
  const method = paymentMethods.find((item) => item.id === order.payment_method);
  return `<div style="background:#fff4f7;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px;">
    <b>Payment Method</b><br/>
    ${method?.label ?? order.payment_method}
  </div>`;
}
function trackingLink(order) {
  return `<p style="font-size:13px;">Tracking Number: <b>${order.tracking_code}</b><br/>
    <a href="${siteUrl()}/track?code=${encodeURIComponent(order.tracking_code)}" style="color:#8c2847;">Track your order status</a></p>`;
}
async function send(to, subject, html, orderId, emailType) {
  const transporter = getTransporter();
  if (!transporter) {
    console.error(`[email] ${emailType} to ${to} skipped: GMAIL_EMAIL/GMAIL_APP_PASSWORD not set`);
    await logEmail(orderId, emailType, to, subject, false);
    return;
  }
  const from = process.env.GMAIL_EMAIL;
  try {
    await transporter.sendMail({ from: `LovieNGlow <${from}>`, to, subject, html });
    await logEmail(orderId, emailType, to, subject, true);
  } catch (err) {
    console.error(`[email] ${emailType} to ${to} failed:`, err);
    await logEmail(orderId, emailType, to, subject, false);
  }
}
function buildOrderReceived(order) {
  const placedAt = new Date(order.placed_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
  return {
    subject: "Order Confirmation – Thank you for your order!",
    html: baseTemplate(
      "Thank you for your order! 💕",
      `<p>Hi ${order.full_name.split(" ")[0]}, we've received your order and can't wait for you to try it.</p>
       <p><b>Order Number:</b> ${order.reference}<br/><b>Date &amp; Time:</b> ${placedAt}</p>
       ${itemsTable(order)}
       ${shippingInfoBlock(order)}
       ${paymentMethodBlock(order)}
       ${statusPill("Waiting for Payment Validation", "pending")}
       <p>We're currently validating your payment. This process may take up to <b>24 hours</b>. We'll notify you as soon as your payment has been confirmed.</p>
       ${trackingLink(order)}`
    )
  };
}
function buildPaymentConfirmed(order) {
  return {
    subject: "Payment Confirmed – We're Processing Your Order!",
    html: baseTemplate(
      "Your payment is confirmed! 🎉",
      `<p>Hi ${order.full_name.split(" ")[0]}, great news — your payment for order <b>${order.reference}</b> has been successfully verified.</p>
       ${statusPill("Processing", "processing")}
       <p>Our team is now preparing your order for shipment. We'll send another email once your package is on its way.</p>
       ${trackingLink(order)}`
    )
  };
}
function buildOrderPacked(order) {
  return {
    subject: `Your order ${order.reference} is packed and ready! 📦`,
    html: baseTemplate(
      "Your order is packed and ready! 📦",
      `<p>Hi ${order.full_name.split(" ")[0]}, order <b>${order.reference}</b> has been packed and is ready to ship.</p>`
    )
  };
}
function buildOrderShipped(order, trackingNumber) {
  const courierLabel = order.courier === "lalamove" ? "Lalamove" : "J&T Express";
  return {
    subject: "Your Order is On the Way!",
    html: baseTemplate(
      "Your order is on its way! 🚚",
      `<p>Hi ${order.full_name.split(" ")[0]}, order <b>${order.reference}</b> has been shipped and is on its way to you.</p>
       ${statusPill("Shipped", "shipped")}
       <p><b>Courier:</b> ${courierLabel}${trackingNumber ? `<br/><b>Courier Tracking Number:</b> ${trackingNumber}` : ""}</p>
       <p>You can track your package using the information above (if provided). Thank you for shopping with us!</p>
       ${trackingLink(order)}`
    )
  };
}
function buildOrderDelivered(order) {
  const reviewUrl = process.env.GOOGLE_REVIEW_FORM_URL;
  const reviewButton = reviewUrl ? `<p style="text-align:center;margin:24px 0;">
         <a href="${reviewUrl}" target="_blank" rel="noreferrer" style="background:#8c2847;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:bold;display:inline-block;">Leave a Review</a>
         <br/><span style="font-size:12px;color:#a97b8c;">Takes less than a minute — photos of your results or package are always appreciated!</span>
       </p>` : "";
  return {
    subject: "Your Order Has Been Delivered!",
    html: baseTemplate(
      "Your order has arrived! 🎁",
      `<p>Hi ${order.full_name.split(" ")[0]}, order <b>${order.reference}</b> has been delivered. We hope you're loving it!</p>
       ${statusPill("Delivered", "delivered")}
       <p><b>We'd love your feedback!</b><br/>Your review helps us improve and assists other customers in making informed purchasing decisions.</p>
       ${reviewButton}`
    )
  };
}
function buildAdminNotification(order) {
  const subject = `New Order Received — ${order.reference}`;
  return {
    subject,
    html: baseTemplate(
      subject,
      `<p><b>${order.full_name}</b> just placed an order.</p>
       ${itemsTable(order)}
       <p><a href="${siteUrl()}/dashboard/orders/${order.reference}">View order in dashboard</a></p>`
    )
  };
}
async function sendOnce(order, emailType, build) {
  if (!order.email) return;
  if (await hasEmailBeenSent(order.id, emailType)) return;
  const { subject, html } = build();
  await send(order.email, subject, html, order.id, emailType);
}
async function sendOrderReceived(order) {
  await sendOnce(order, "order_received", () => buildOrderReceived(order));
}
async function sendPaymentConfirmed(order) {
  await sendOnce(order, "payment_confirmed", () => buildPaymentConfirmed(order));
}
async function sendOrderShipped(order, trackingNumber) {
  await sendOnce(order, "shipped", () => buildOrderShipped(order, trackingNumber));
}
async function sendOrderDelivered(order) {
  await sendOnce(order, "delivered", () => buildOrderDelivered(order));
}
async function sendAdminNotification(order) {
  const adminEmail = process.env.GMAIL_EMAIL;
  if (!adminEmail) return;
  const { subject, html } = buildAdminNotification(order);
  await send(adminEmail, subject, html, order.id, "admin_notification");
}
async function resendOrderEmail(order, emailType) {
  if (!order.email) return;
  if (emailType === "admin_notification") return sendAdminNotification(order);
  const content = emailType === "order_received" ? buildOrderReceived(order) : emailType === "payment_confirmed" ? buildPaymentConfirmed(order) : emailType === "packed" ? buildOrderPacked(order) : emailType === "shipped" ? buildOrderShipped(order, order.tracking_number ?? "") : buildOrderDelivered(order);
  await send(order.email, content.subject, content.html, order.id, emailType);
}
const STOREFRONT_OWNER_ID = "ea319e69-8643-463d-84dd-01661ca0bb5a";
async function listPublicCatalog() {
  const supabase = getSupabaseAdmin();
  const [{ data: products, error: productsError }, { data: sets, error: setsError }] = await Promise.all([
    supabase.from("products").select("id, name, description, selling_price, stock_quantity, storefront_meta").eq("owner_id", STOREFRONT_OWNER_ID).not("storefront_meta", "is", null),
    supabase.from("product_sets").select("id, name, storefront_meta, items:product_set_items(product_id, quantity, product:products(name, selling_price, stock_quantity))").eq("owner_id", STOREFRONT_OWNER_ID).not("storefront_meta", "is", null)
  ]);
  if (productsError) throw productsError;
  if (setsError) throw setsError;
  const catalog = [];
  for (const row of products ?? []) {
    const meta = row.storefront_meta;
    catalog.push({
      id: row.id,
      slug: meta.slug,
      name: row.name,
      category: meta.category,
      shortCategory: meta.shortCategory,
      description: row.description ?? "",
      shortDescription: meta.shortDescription,
      price: row.selling_price,
      stock: row.stock_quantity,
      rating: meta.rating,
      reviews: meta.reviews,
      isNew: meta.isNew,
      isBestSeller: meta.isBestSeller,
      strength: meta.strength,
      benefits: meta.benefits,
      palette: meta.palette,
      form: meta.form
    });
  }
  const resolveProduct = (product) => Array.isArray(product) ? product[0] : product;
  for (const row of sets ?? []) {
    const meta = row.storefront_meta;
    const componentSum = row.items.reduce((sum, item) => sum + item.quantity * (resolveProduct(item.product)?.selling_price ?? 0), 0);
    const price = meta.fixedPrice ?? componentSum;
    const stock = row.items.reduce((min, item) => {
      const available = Math.floor((resolveProduct(item.product)?.stock_quantity ?? 0) / item.quantity);
      return Math.min(min, available);
    }, Infinity);
    const included = row.items.map((item) => `${item.quantity}× ${resolveProduct(item.product)?.name ?? "Component"}`);
    catalog.push({
      id: row.id,
      slug: meta.slug,
      name: row.name,
      category: meta.category,
      shortCategory: meta.shortCategory,
      description: meta.shortDescription,
      shortDescription: meta.shortDescription,
      price,
      compareAt: meta.fixedPrice && componentSum > meta.fixedPrice ? componentSum : void 0,
      stock: Number.isFinite(stock) ? stock : 0,
      rating: meta.rating,
      reviews: meta.reviews,
      isNew: meta.isNew,
      isBestSeller: meta.isBestSeller,
      strength: meta.strength,
      benefits: meta.benefits,
      included,
      palette: meta.palette,
      form: "set",
      isSet: true,
      setItems: row.items.map((item) => ({
        productId: item.product_id,
        name: resolveProduct(item.product)?.name ?? "Component",
        price: resolveProduct(item.product)?.selling_price ?? 0,
        quantity: item.quantity
      }))
    });
  }
  return catalog;
}
async function validatePromoCode(code, input) {
  const supabase = getSupabaseAdmin();
  const { data: promo, error } = await supabase.from("promos").select("*").eq("owner_id", STOREFRONT_OWNER_ID).ilike("code", code.trim()).maybeSingle();
  if (error) throw error;
  if (!promo || !promo.active) return { valid: false, discount: 0, message: "Invalid or inactive promo code." };
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  if (promo.start_date && today < promo.start_date) return { valid: false, discount: 0, message: "This promo code is not active yet." };
  if (promo.end_date && today > promo.end_date) return { valid: false, discount: 0, message: "This promo code has expired." };
  if (promo.min_purchase_amount && input.subtotal < promo.min_purchase_amount) {
    return { valid: false, discount: 0, message: `Minimum purchase of ${promo.min_purchase_amount} required.` };
  }
  if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
    return { valid: false, discount: 0, message: "This promo code has reached its usage limit." };
  }
  const { data: triggers } = await supabase.from("promo_trigger_products").select("product_id").eq("promo_id", promo.id);
  const triggerIds = triggers?.map((t) => t.product_id) ?? [];
  if (triggerIds.length > 0 && !triggerIds.some((id) => input.cartProductIds.includes(id))) {
    return { valid: false, discount: 0, message: "This promo code does not apply to items in your cart." };
  }
  if (input.customerEmail) {
    if (promo.single_use_per_customer) {
      const { count } = await supabase.from("promo_redemptions").select("id", { count: "exact", head: true }).eq("promo_id", promo.id).eq("customer_email", input.customerEmail);
      if ((count ?? 0) > 0) return { valid: false, discount: 0, message: "You have already used this promo code." };
    }
    if (promo.first_time_customer_only) {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("email", input.customerEmail);
      if ((count ?? 0) > 0) return { valid: false, discount: 0, message: "This promo code is for first-time customers only." };
    }
  }
  let discount = 0;
  if (promo.reward_type === "percent_discount") discount = input.subtotal * (promo.reward_value / 100);
  else if (promo.reward_type === "fixed_discount") discount = promo.reward_value;
  if (promo.max_discount_amount) discount = Math.min(discount, promo.max_discount_amount);
  discount = Math.min(discount, input.subtotal);
  return { valid: true, discount: Math.round(discount * 100) / 100, promoId: promo.id };
}
async function redeemPromo(promoId, orderId, customerEmail) {
  const supabase = getSupabaseAdmin();
  const { data: promo } = await supabase.from("promos").select("times_used").eq("id", promoId).single();
  if (promo) {
    await supabase.from("promos").update({ times_used: promo.times_used + 1 }).eq("id", promoId);
  }
  await supabase.from("promo_redemptions").insert({
    owner_id: STOREFRONT_OWNER_ID,
    promo_id: promoId,
    order_id: orderId,
    customer_email: customerEmail || null
  });
}
async function ensureBusinessProfile(ctx, fallbackName) {
  const { data: existing } = await ctx.supabase.from("business_profiles").select("*").eq("owner_id", ctx.ownerId).maybeSingle();
  if (existing) return existing;
  const { data, error } = await ctx.supabase.from("business_profiles").insert({ owner_id: ctx.ownerId, business_name: fallbackName || "My Business", full_name: fallbackName || "" }).select("*").single();
  if (error) throw error;
  return data;
}
async function getBusinessProfile(ctx) {
  const { data, error } = await ctx.supabase.from("business_profiles").select("*").eq("owner_id", ctx.ownerId).maybeSingle();
  if (error) throw error;
  return data;
}
async function updateBusinessProfile(ctx, patch) {
  const { data, error } = await ctx.supabase.from("business_profiles").update(patch).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  return data;
}
async function listCategories(ctx) {
  const { data, error } = await ctx.supabase.from("categories").select("*").eq("owner_id", ctx.ownerId).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
async function createCategory(ctx, input) {
  const { data, error } = await ctx.supabase.from("categories").insert({ owner_id: ctx.ownerId, name: input.name, description: input.description ?? null }).select("*").single();
  if (error) throw error;
  return data;
}
async function updateCategory(ctx, id, patch) {
  const { data, error } = await ctx.supabase.from("categories").update(patch).eq("id", id).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  return data;
}
async function deleteCategory(ctx, id) {
  const { error } = await ctx.supabase.from("categories").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
async function listSuppliers(ctx) {
  const { data, error } = await ctx.supabase.from("suppliers").select("*").eq("owner_id", ctx.ownerId).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
async function createSupplier(ctx, input) {
  const { data, error } = await ctx.supabase.from("suppliers").insert({ owner_id: ctx.ownerId, ...input }).select("*").single();
  if (error) throw error;
  return data;
}
async function updateSupplier(ctx, id, patch) {
  const { data, error } = await ctx.supabase.from("suppliers").update(patch).eq("id", id).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  return data;
}
async function deleteSupplier(ctx, id) {
  const { error } = await ctx.supabase.from("suppliers").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
const PRODUCT_SELECT = "*, category:categories(id, name), supplier:suppliers(id, name)";
async function listProducts(ctx) {
  const { data, error } = await ctx.supabase.from("products").select(PRODUCT_SELECT).eq("owner_id", ctx.ownerId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function createProduct(ctx, input) {
  const { data, error } = await ctx.supabase.from("products").insert({ owner_id: ctx.ownerId, ...input }).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}
async function updateProduct(ctx, id, patch) {
  const { data, error } = await ctx.supabase.from("products").update(patch).eq("id", id).eq("owner_id", ctx.ownerId).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}
async function deleteProduct(ctx, id) {
  const { error } = await ctx.supabase.from("products").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
async function adjustProductStock(ctx, id, input) {
  const { data: current, error: fetchError } = await ctx.supabase.from("products").select("stock_quantity").eq("id", id).eq("owner_id", ctx.ownerId).single();
  if (fetchError) throw fetchError;
  const previousQty = current.stock_quantity;
  const signedDelta = input.direction === "add" ? input.quantity : -input.quantity;
  const nextQty = Math.max(0, previousQty + signedDelta);
  const actualDelta = nextQty - previousQty;
  const { data, error } = await ctx.supabase.from("products").update({ stock_quantity: nextQty }).eq("id", id).eq("owner_id", ctx.ownerId).select(PRODUCT_SELECT).single();
  if (error) throw error;
  if (actualDelta !== 0) {
    await ctx.supabase.from("stock_adjustments").insert({
      owner_id: ctx.ownerId,
      product_id: id,
      change: actualDelta,
      resulting_qty: nextQty,
      reason: input.reason,
      source: "manual",
      notes: input.notes ?? null
    });
  }
  return data;
}
const SET_ITEM_SELECT = "*, product:products(id, name, selling_price, stock_quantity)";
async function listProductSets(ctx) {
  const { data: sets, error } = await ctx.supabase.from("product_sets").select("*").eq("owner_id", ctx.ownerId).order("sort_order", { ascending: true });
  if (error) throw error;
  const setRows = sets ?? [];
  if (setRows.length === 0) return [];
  const { data: items, error: itemsError } = await ctx.supabase.from("product_set_items").select(SET_ITEM_SELECT).eq("owner_id", ctx.ownerId).in("product_set_id", setRows.map((s) => s.id));
  if (itemsError) throw itemsError;
  const itemsBySet = /* @__PURE__ */ new Map();
  for (const item of items ?? []) {
    const list = itemsBySet.get(item.product_set_id) ?? [];
    list.push(item);
    itemsBySet.set(item.product_set_id, list);
  }
  return setRows.map((set) => ({ ...set, items: itemsBySet.get(set.id) ?? [] }));
}
async function createProductSet(ctx, input) {
  const { data: set, error } = await ctx.supabase.from("product_sets").insert({
    owner_id: ctx.ownerId,
    name: input.name,
    icon: input.icon ?? null,
    color: input.color ?? null,
    sort_order: input.sort_order ?? 0
  }).select("*").single();
  if (error) throw error;
  const setRow = set;
  if (input.items.length > 0) {
    const { error: itemsError } = await ctx.supabase.from("product_set_items").insert(
      input.items.map((item) => ({
        owner_id: ctx.ownerId,
        product_set_id: setRow.id,
        product_id: item.product_id,
        quantity: item.quantity
      }))
    );
    if (itemsError) throw itemsError;
  }
  const [refreshed] = (await listProductSets(ctx)).filter((s) => s.id === setRow.id);
  return refreshed ?? { ...setRow, items: [] };
}
async function updateProductSet(ctx, id, input) {
  const { error } = await ctx.supabase.from("product_sets").update({
    name: input.name,
    icon: input.icon ?? null,
    color: input.color ?? null,
    sort_order: input.sort_order ?? 0
  }).eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
  await ctx.supabase.from("product_set_items").delete().eq("product_set_id", id).eq("owner_id", ctx.ownerId);
  if (input.items.length > 0) {
    const { error: itemsError } = await ctx.supabase.from("product_set_items").insert(
      input.items.map((item) => ({
        owner_id: ctx.ownerId,
        product_set_id: id,
        product_id: item.product_id,
        quantity: item.quantity
      }))
    );
    if (itemsError) throw itemsError;
  }
  const [refreshed] = (await listProductSets(ctx)).filter((s) => s.id === id);
  if (!refreshed) throw new Error("Product set not found after update");
  return refreshed;
}
async function swapProductSetOrder(ctx, a, b) {
  const { error: errorA } = await ctx.supabase.from("product_sets").update({ sort_order: b.sort_order }).eq("id", a.id).eq("owner_id", ctx.ownerId);
  if (errorA) throw errorA;
  const { error: errorB } = await ctx.supabase.from("product_sets").update({ sort_order: a.sort_order }).eq("id", b.id).eq("owner_id", ctx.ownerId);
  if (errorB) throw errorB;
}
async function deleteProductSet(ctx, id) {
  const { error } = await ctx.supabase.from("product_sets").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
const PO_SELECT = "*, supplier:suppliers(id, name), items:purchase_order_items(*, product:products(id, name, sku))";
async function listPurchaseOrders(ctx) {
  const { data, error } = await ctx.supabase.from("purchase_orders").select(PO_SELECT).eq("owner_id", ctx.ownerId).order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
async function getPurchaseOrder(ctx, id) {
  const { data, error } = await ctx.supabase.from("purchase_orders").select(PO_SELECT).eq("id", id).eq("owner_id", ctx.ownerId).maybeSingle();
  if (error) throw error;
  return data;
}
async function createPurchaseOrder(ctx, input) {
  if (input.items.length === 0) throw new Error("Purchase order must contain at least one item");
  const totalCost = input.items.reduce((sum, item) => sum + item.quantity_ordered * item.unit_cost, 0) + (input.handling_fee ?? 0) + (input.shipping_fee ?? 0);
  const { data: po, error } = await ctx.supabase.from("purchase_orders").insert({
    owner_id: ctx.ownerId,
    supplier_id: input.supplier_id ?? null,
    status: "pending",
    total_cost: totalCost,
    handling_fee: input.handling_fee ?? 0,
    shipping_fee: input.shipping_fee ?? 0,
    expected_date: input.expected_date ?? null,
    notes: input.notes ?? null
  }).select("*").single();
  if (error) throw error;
  const poRow = po;
  const { error: itemsError } = await ctx.supabase.from("purchase_order_items").insert(
    input.items.map((item) => ({
      owner_id: ctx.ownerId,
      purchase_order_id: poRow.id,
      product_id: item.product_id,
      quantity_ordered: item.quantity_ordered,
      unit_cost: item.unit_cost
    }))
  );
  if (itemsError) throw itemsError;
  const created = await getPurchaseOrder(ctx, poRow.id);
  if (!created) throw new Error("Purchase order not found after creation");
  return created;
}
async function updatePurchaseOrderStatus(ctx, id, status) {
  const { data, error } = await ctx.supabase.from("purchase_orders").update({ status }).eq("id", id).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  const updated = await getPurchaseOrder(ctx, data.id);
  if (!updated) throw new Error("Purchase order not found after update");
  return updated;
}
async function deletePurchaseOrder(ctx, id) {
  const { error } = await ctx.supabase.rpc("delete_purchase_order", { p_purchase_order_id: id });
  if (error) throw error;
}
async function receivePurchaseOrder(ctx, input) {
  const { error } = await ctx.supabase.rpc("receive_purchase_order", {
    p_purchase_order_id: input.purchaseOrderId,
    p_items: input.items.map((item) => ({
      purchase_order_item_id: item.purchaseOrderItemId,
      quantity_received_now: item.quantityReceivedNow
    }))
  });
  if (error) throw error;
  const updated = await getPurchaseOrder(ctx, input.purchaseOrderId);
  if (!updated) throw new Error("Purchase order not found after receiving");
  return updated;
}
const SALES_ORDER_SELECT = "*, items:sales_order_items(*)";
async function listSalesOrders(ctx, filters) {
  let query = ctx.supabase.from("sales_orders").select(SALES_ORDER_SELECT).eq("owner_id", ctx.ownerId).order("created_at", { ascending: false });
  if (filters?.from) query = query.gte("created_at", filters.from);
  if (filters?.to) query = query.lte("created_at", filters.to);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
async function getSalesOrder(ctx, id) {
  const { data, error } = await ctx.supabase.from("sales_orders").select(SALES_ORDER_SELECT).eq("id", id).eq("owner_id", ctx.ownerId).maybeSingle();
  if (error) throw error;
  return data;
}
async function completeSale(ctx, input) {
  const { data, error } = await ctx.supabase.rpc("complete_sale", {
    p_customer_name: input.customerName ?? null,
    p_customer_contact: input.customerContact ?? null,
    p_discount: input.discount ?? 0,
    p_payment_method: input.paymentMethod,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice ?? null
    })),
    p_shipping_fee: input.shippingFee ?? 0
  });
  if (error) throw error;
  const order = await getSalesOrder(ctx, data.id);
  if (!order) throw new Error("Sales order not found after checkout");
  return order;
}
async function markSalePaid(ctx, id, receiptUrl) {
  const { error } = await ctx.supabase.rpc("mark_sale_paid", {
    p_sales_order_id: id,
    p_receipt_url: receiptUrl ?? null
  });
  if (error) throw error;
  const order = await getSalesOrder(ctx, id);
  if (!order) throw new Error("Sales order not found after marking paid");
  return order;
}
async function reverseSale(ctx, id) {
  const { error } = await ctx.supabase.rpc("reverse_sale", { p_sales_order_id: id });
  if (error) throw error;
  const order = await getSalesOrder(ctx, id);
  if (!order) throw new Error("Sales order not found after reversal");
  return order;
}
async function listExpenses(ctx, filters) {
  let query = ctx.supabase.from("expenses").select("*").eq("owner_id", ctx.ownerId).order("expense_date", { ascending: false });
  if (filters?.from) query = query.gte("expense_date", filters.from);
  if (filters?.to) query = query.lte("expense_date", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
async function createExpense(ctx, input) {
  const { data, error } = await ctx.supabase.from("expenses").insert({ owner_id: ctx.ownerId, ...input }).select("*").single();
  if (error) throw error;
  return data;
}
async function updateExpense(ctx, id, patch) {
  const { data, error } = await ctx.supabase.from("expenses").update(patch).eq("id", id).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  return data;
}
async function deleteExpense(ctx, id) {
  const { error } = await ctx.supabase.from("expenses").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
async function listPromos(ctx) {
  const [{ data: promos, error }, { data: triggers, error: triggersError }, { data: rewards, error: rewardsError }] = await Promise.all([
    ctx.supabase.from("promos").select("*").eq("owner_id", ctx.ownerId).order("created_at", { ascending: false }),
    ctx.supabase.from("promo_trigger_products").select("promo_id, product_id").eq("owner_id", ctx.ownerId),
    ctx.supabase.from("promo_reward_products").select("promo_id, product_id").eq("owner_id", ctx.ownerId)
  ]);
  if (error) throw error;
  if (triggersError) throw triggersError;
  if (rewardsError) throw rewardsError;
  const triggersByPromo = /* @__PURE__ */ new Map();
  for (const row of triggers ?? []) {
    const list = triggersByPromo.get(row.promo_id) ?? [];
    list.push(row.product_id);
    triggersByPromo.set(row.promo_id, list);
  }
  const rewardsByPromo = /* @__PURE__ */ new Map();
  for (const row of rewards ?? []) {
    const list = rewardsByPromo.get(row.promo_id) ?? [];
    list.push(row.product_id);
    rewardsByPromo.set(row.promo_id, list);
  }
  return (promos ?? []).map((p) => ({
    ...p,
    trigger_product_ids: triggersByPromo.get(p.id) ?? [],
    reward_product_ids: rewardsByPromo.get(p.id) ?? []
  }));
}
async function createPromo(ctx, input) {
  const { data: promo, error } = await ctx.supabase.from("promos").insert({
    owner_id: ctx.ownerId,
    code: input.code,
    reward_type: input.reward_type,
    reward_value: input.reward_value,
    active: input.active
  }).select("*").single();
  if (error) throw error;
  const promoRow = promo;
  await syncPromoProducts(ctx, promoRow.id, input);
  return { ...promoRow, trigger_product_ids: input.trigger_product_ids, reward_product_ids: input.reward_product_ids };
}
async function updatePromo(ctx, id, input) {
  const { data: promo, error } = await ctx.supabase.from("promos").update({
    code: input.code,
    reward_type: input.reward_type,
    reward_value: input.reward_value,
    active: input.active
  }).eq("id", id).eq("owner_id", ctx.ownerId).select("*").single();
  if (error) throw error;
  await syncPromoProducts(ctx, id, input);
  const promoRow = promo;
  return { ...promoRow, trigger_product_ids: input.trigger_product_ids, reward_product_ids: input.reward_product_ids };
}
async function syncPromoProducts(ctx, promoId, input) {
  await ctx.supabase.from("promo_trigger_products").delete().eq("promo_id", promoId).eq("owner_id", ctx.ownerId);
  await ctx.supabase.from("promo_reward_products").delete().eq("promo_id", promoId).eq("owner_id", ctx.ownerId);
  if (input.trigger_product_ids.length > 0) {
    const { error } = await ctx.supabase.from("promo_trigger_products").insert(
      input.trigger_product_ids.map((productId) => ({ owner_id: ctx.ownerId, promo_id: promoId, product_id: productId }))
    );
    if (error) throw error;
  }
  if (input.reward_type === "free_item" && input.reward_product_ids.length > 0) {
    const { error } = await ctx.supabase.from("promo_reward_products").insert(
      input.reward_product_ids.map((productId) => ({ owner_id: ctx.ownerId, promo_id: promoId, product_id: productId }))
    );
    if (error) throw error;
  }
}
async function deletePromo(ctx, id) {
  const { error } = await ctx.supabase.from("promos").delete().eq("id", id).eq("owner_id", ctx.ownerId);
  if (error) throw error;
}
function rangeStart(range) {
  const now = /* @__PURE__ */ new Date();
  const start = new Date(now);
  switch (range) {
    case "7d":
      start.setDate(now.getDate() - 6);
      break;
    case "30d":
      start.setDate(now.getDate() - 29);
      break;
    case "90d":
      start.setDate(now.getDate() - 89);
      break;
    case "12m":
      start.setMonth(now.getMonth() - 11);
      break;
  }
  start.setHours(0, 0, 0, 0);
  return start;
}
async function getDashboardMetrics(ctx, range) {
  const from = rangeStart(range).toISOString();
  const [salesRes, expensesRes, productsRes, poRes] = await Promise.all([
    ctx.supabase.from("sales_orders").select("id, total, total_cost, gross_profit, created_at").eq("owner_id", ctx.ownerId).eq("status", "paid").gte("created_at", from),
    ctx.supabase.from("expenses").select("amount, category, expense_date").eq("owner_id", ctx.ownerId).gte("expense_date", from),
    ctx.supabase.from("products").select("id, name, stock_quantity, cost_price, reorder_level").eq("owner_id", ctx.ownerId),
    ctx.supabase.from("purchase_orders").select("id", { count: "exact", head: true }).eq("owner_id", ctx.ownerId).in("status", ["pending", "in_transit"])
  ]);
  if (salesRes.error) throw salesRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (productsRes.error) throw productsRes.error;
  if (poRes.error) throw poRes.error;
  const sales = salesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const products = productsRes.data ?? [];
  let saleItems = [];
  if (sales.length > 0) {
    const { data: itemRows, error: itemsError } = await ctx.supabase.from("sales_order_items").select("product_id, product_name, quantity, line_revenue, line_profit").eq("owner_id", ctx.ownerId).in("sales_order_id", sales.map((s) => s.id));
    if (itemsError) throw itemsError;
    saleItems = itemRows ?? [];
  }
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalCogs = sales.reduce((sum, s) => sum + Number(s.total_cost), 0);
  const grossProfit = sales.reduce((sum, s) => sum + Number(s.gross_profit), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = grossProfit - totalExpenses;
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.stock_quantity) * Number(p.cost_price), 0);
  const lowStockItems = products.filter((p) => p.stock_quantity <= p.reorder_level).map((p) => ({ id: p.id, name: p.name, stock_quantity: p.stock_quantity, reorder_level: p.reorder_level }));
  const productAgg = /* @__PURE__ */ new Map();
  for (const item of saleItems) {
    const key = item.product_id ?? item.product_name;
    const existing = productAgg.get(key) ?? { productId: item.product_id, name: item.product_name, unitsSold: 0, revenue: 0, profit: 0 };
    existing.unitsSold += Number(item.quantity);
    existing.revenue += Number(item.line_revenue);
    existing.profit += Number(item.line_profit);
    productAgg.set(key, existing);
  }
  const topProducts = [...productAgg.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
  const trendMap = /* @__PURE__ */ new Map();
  for (const s of sales) {
    const day = s.created_at.slice(0, 10);
    const existing = trendMap.get(day) ?? { revenue: 0, profit: 0, orders: 0 };
    existing.revenue += Number(s.total);
    existing.profit += Number(s.gross_profit);
    existing.orders += 1;
    trendMap.set(day, existing);
  }
  const salesTrend = [...trendMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, v]) => ({ date, ...v }));
  const expenseMap = /* @__PURE__ */ new Map();
  for (const e of expenses) {
    expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + Number(e.amount));
  }
  const expenseBreakdown = [...expenseMap.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  return {
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netProfit,
    inventoryValue,
    totalOrders: sales.length,
    pendingDeliveries: poRes.count ?? 0,
    lowStock: { count: lowStockItems.length, items: lowStockItems },
    topProducts,
    salesTrend,
    expenseBreakdown
  };
}
const listPublicCatalogFn_createServerFn_handler = createServerRpc({
  id: "868bea76e998ff85818e6c2676ad5f8b6f80f0c35ff82c11f0b548d4147e1379",
  name: "listPublicCatalogFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listPublicCatalogFn.__executeServer(opts));
const listPublicCatalogFn = createServerFn({
  method: "GET"
}).handler(listPublicCatalogFn_createServerFn_handler, async () => {
  return listPublicCatalog();
});
const validatePromoCodeFn_createServerFn_handler = createServerRpc({
  id: "8f7963b3ff28b6081255d0c99ac5efcb92b6c67d8e4c0ac7617db24c530f7d79",
  name: "validatePromoCodeFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => validatePromoCodeFn.__executeServer(opts));
const validatePromoCodeFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  code: z.string().min(1),
  cartProductIds: z.array(z.string()),
  subtotal: z.number().min(0),
  customerEmail: z.string().optional()
})).handler(validatePromoCodeFn_createServerFn_handler, async ({
  data
}) => {
  return validatePromoCode(data.code, data);
});
const orderItemSchema = z.object({
  productId: z.string().optional(),
  productSetId: z.string().optional(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number()
});
const submitOrderSchema = z.object({
  fullName: z.string().min(1),
  contactNumber: z.string().min(1),
  email: z.string().email(),
  socialHandle: z.string(),
  address: z.string().min(1),
  courier: z.string(),
  region: z.string(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number(),
  shippingFee: z.number(),
  discount: z.number().min(0).optional(),
  promoId: z.string().optional(),
  promoCode: z.string().optional(),
  total: z.number(),
  receiptBase64: z.string().min(1),
  receiptFilename: z.string().min(1),
  receiptContentType: z.string().min(1)
});
const submitOrderFn_createServerFn_handler = createServerRpc({
  id: "064d14f6f3a2070bd188f3b9743e542e76e323c704d94d1ca754c9bf98e20a16",
  name: "submitOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => submitOrderFn.__executeServer(opts));
const submitOrderFn = createServerFn({
  method: "POST"
}).inputValidator(submitOrderSchema).handler(submitOrderFn_createServerFn_handler, async ({
  data
}) => {
  const {
    promoId,
    ...orderInput
  } = data;
  const order = await createOrder({
    ...orderInput,
    discount: data.discount ?? 0
  });
  if (promoId) await redeemPromo(promoId, order.id, data.email || void 0);
  await Promise.all([sendOrderReceived(order), sendAdminNotification(order)]);
  return order;
});
const ownerEstablishSessionFn_createServerFn_handler = createServerRpc({
  id: "10299f3437834ee87c1daeef96c5d08af0944b44547f0de8f4c77c8b3a8f0baf",
  name: "ownerEstablishSessionFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => ownerEstablishSessionFn.__executeServer(opts));
const ownerEstablishSessionFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  fallbackName: z.string().optional()
})).handler(ownerEstablishSessionFn_createServerFn_handler, async ({
  data
}) => {
  const user = await establishOwnerSession(data.accessToken, data.refreshToken);
  const ctx = await requireOwner();
  await ensureBusinessProfile(ctx, data.fallbackName || user.email || "");
  return {
    success: true
  };
});
const ownerLogoutFn_createServerFn_handler = createServerRpc({
  id: "f2d75827ef8dc10e260ddeee91b87ed320b5ab9ad2f30e8b9c9ec28c1f0e6574",
  name: "ownerLogoutFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => ownerLogoutFn.__executeServer(opts));
const ownerLogoutFn = createServerFn({
  method: "POST"
}).handler(ownerLogoutFn_createServerFn_handler, async () => {
  await clearOwnerSession();
  return {
    success: true
  };
});
const verifyOwnerFn_createServerFn_handler = createServerRpc({
  id: "fda4d4fb930fb4014572a607255c3886b9d660aff9438452bcee23f3d3d4a9a3",
  name: "verifyOwnerFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => verifyOwnerFn.__executeServer(opts));
const verifyOwnerFn = createServerFn({
  method: "GET"
}).handler(verifyOwnerFn_createServerFn_handler, async () => {
  return {
    valid: await isOwnerAuthenticated()
  };
});
const listFiltersSchema = z.object({
  search: z.string().optional(),
  orderStatus: z.string().optional(),
  courier: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
});
const getOrdersFn_createServerFn_handler = createServerRpc({
  id: "6e67e02fbf33a494dc9044cb0d5cddec95a42992e87cb33f8eea83a50ebe0d56",
  name: "getOrdersFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getOrdersFn.__executeServer(opts));
const getOrdersFn = createServerFn({
  method: "GET"
}).inputValidator(listFiltersSchema).handler(getOrdersFn_createServerFn_handler, async ({
  data
}) => {
  await requireOwner();
  return listOrders(data);
});
const exportOrdersCsvFn_createServerFn_handler = createServerRpc({
  id: "4caa419df7311540a4fdad8800efb1b003c7d3bef5434f5a5790fa2d7d05ca6c",
  name: "exportOrdersCsvFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => exportOrdersCsvFn.__executeServer(opts));
const exportOrdersCsvFn = createServerFn({
  method: "GET"
}).inputValidator(listFiltersSchema).handler(exportOrdersCsvFn_createServerFn_handler, async ({
  data
}) => {
  await requireOwner();
  const orders = await listAllOrdersForExport(data);
  const headers = ["Reference", "Tracking Code", "Placed At", "Full Name", "Contact Number", "Email", "Address", "Courier", "Region", "Payment Method", "Subtotal", "Shipping Fee", "Total", "Order Status", "Tracking Number"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map((order) => [order.reference, order.tracking_code, order.placed_at, order.full_name, order.contact_number, order.email ?? "", order.address, order.courier, order.region ?? "", order.payment_method, order.subtotal, order.shipping_fee, order.total, order.order_status, order.tracking_number ?? ""].map(escape).join(","));
  return [headers.join(","), ...rows].join("\n");
});
const getOrderFn_createServerFn_handler = createServerRpc({
  id: "8043a5616716260d3cb6bacac09dfef2ab7bd4aa64a6ef2bf0b0cf0581649467",
  name: "getOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getOrderFn.__executeServer(opts));
const getOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  reference: z.string()
})).handler(getOrderFn_createServerFn_handler, async ({
  data
}) => {
  await requireOwner();
  return getOrder(data.reference);
});
const updateOrderSchema = z.object({
  reference: z.string(),
  orderStatus: z.enum(["pending_payment", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  internalNotes: z.string().optional(),
  note: z.string().optional()
});
const updateOrderStatusFn_createServerFn_handler = createServerRpc({
  id: "ae98de1e3dee0c96f3905503bd835f884b47d468b119b80da7c5f80c8568ecd3",
  name: "updateOrderStatusFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateOrderStatusFn.__executeServer(opts));
const updateOrderStatusFn = createServerFn({
  method: "POST"
}).inputValidator(updateOrderSchema).handler(updateOrderStatusFn_createServerFn_handler, async ({
  data
}) => {
  await requireOwner();
  const {
    reference,
    ...patch
  } = data;
  const updated = await updateOrder(reference, patch);
  if (patch.orderStatus === "processing") await sendPaymentConfirmed(updated);
  if (patch.orderStatus === "shipped") await sendOrderShipped(updated, updated.tracking_number ?? "");
  if (patch.orderStatus === "delivered") await sendOrderDelivered(updated);
  return getOrder(reference);
});
const trackOrderFn_createServerFn_handler = createServerRpc({
  id: "685d51042677bc3394ac487b906af34c3da851230e65a7f963561b55e49b597c",
  name: "trackOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => trackOrderFn.__executeServer(opts));
const trackOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  trackingCode: z.string().min(1)
})).handler(trackOrderFn_createServerFn_handler, async ({
  data
}) => {
  return getOrderByTrackingCode(data.trackingCode);
});
const resendOrderEmailFn_createServerFn_handler = createServerRpc({
  id: "309134bb0792e7aa2244e5f84c7191ec668970499dabb9ea885db80692ab6d0c",
  name: "resendOrderEmailFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => resendOrderEmailFn.__executeServer(opts));
const resendOrderEmailFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  reference: z.string(),
  emailType: z.enum(["order_received", "payment_confirmed", "packed", "shipped", "delivered", "admin_notification"])
})).handler(resendOrderEmailFn_createServerFn_handler, async ({
  data
}) => {
  await requireOwner();
  const order = await getOrder(data.reference);
  if (!order) throw new Error("Order not found");
  await resendOrderEmail(order, data.emailType);
  return getOrder(data.reference);
});
const getBusinessProfileFn_createServerFn_handler = createServerRpc({
  id: "4c45f294f79534727fd56df24f2f613ea47fb3ead4173d7c955571cf67477a64",
  name: "getBusinessProfileFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getBusinessProfileFn.__executeServer(opts));
const getBusinessProfileFn = createServerFn({
  method: "GET"
}).handler(getBusinessProfileFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return getBusinessProfile(ctx);
});
const updateBusinessProfileFn_createServerFn_handler = createServerRpc({
  id: "ba5bbc9d9ecfb69e2a189942ffbf6a417182e668c6a7a248b871f1a2f3693235",
  name: "updateBusinessProfileFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateBusinessProfileFn.__executeServer(opts));
const updateBusinessProfileFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  businessName: z.string().min(1),
  fullName: z.string().min(1),
  currency: z.string().min(1)
})).handler(updateBusinessProfileFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return updateBusinessProfile(ctx, {
    business_name: data.businessName,
    full_name: data.fullName,
    currency: data.currency
  });
});
const listCategoriesFn_createServerFn_handler = createServerRpc({
  id: "0b57467e7080635e7692c2a26813c662de6c260bc67b027c09fee61b0dcf928c",
  name: "listCategoriesFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listCategoriesFn.__executeServer(opts));
const listCategoriesFn = createServerFn({
  method: "GET"
}).handler(listCategoriesFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listCategories(ctx);
});
const createCategoryFn_createServerFn_handler = createServerRpc({
  id: "f7a3576aca7397baddac55b2609de36302ee2ef43be987fe3f4114bedbb5254f",
  name: "createCategoryFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createCategoryFn.__executeServer(opts));
const createCategoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1),
  description: z.string().optional()
})).handler(createCategoryFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createCategory(ctx, data);
});
const updateCategoryFn_createServerFn_handler = createServerRpc({
  id: "a9483b918339db544d64d476c9b57354eae5e1281d0a47aa3f5fe408bd14aafa",
  name: "updateCategoryFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateCategoryFn.__executeServer(opts));
const updateCategoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional()
})).handler(updateCategoryFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...patch
  } = data;
  return updateCategory(ctx, id, patch);
});
const deleteCategoryFn_createServerFn_handler = createServerRpc({
  id: "59bf8389c7996ef2ce09daf9e8bd8b308a5dc01515bfca1064d2fcc48b9c217d",
  name: "deleteCategoryFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deleteCategoryFn.__executeServer(opts));
const deleteCategoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deleteCategoryFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deleteCategory(ctx, data.id);
  return {
    success: true
  };
});
const listSuppliersFn_createServerFn_handler = createServerRpc({
  id: "afbcea06f7fe6e1cbb68cb86b039619e1dfacd0f06a9899fae660b3aed31266f",
  name: "listSuppliersFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listSuppliersFn.__executeServer(opts));
const listSuppliersFn = createServerFn({
  method: "GET"
}).handler(listSuppliersFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listSuppliers(ctx);
});
const supplierInputSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});
const createSupplierFn_createServerFn_handler = createServerRpc({
  id: "3759bcc60f6eb19501fe19a936a6946eed1092681cdfe47d191a84c4c6d74418",
  name: "createSupplierFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createSupplierFn.__executeServer(opts));
const createSupplierFn = createServerFn({
  method: "POST"
}).inputValidator(supplierInputSchema).handler(createSupplierFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createSupplier(ctx, data);
});
const updateSupplierFn_createServerFn_handler = createServerRpc({
  id: "ba9d00ebe34d5ea8f9587e033c09c0a7b0904333233bf4f9f6a6bf599779ef2d",
  name: "updateSupplierFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateSupplierFn.__executeServer(opts));
const updateSupplierFn = createServerFn({
  method: "POST"
}).inputValidator(supplierInputSchema.partial().extend({
  id: z.string()
})).handler(updateSupplierFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...patch
  } = data;
  return updateSupplier(ctx, id, patch);
});
const deleteSupplierFn_createServerFn_handler = createServerRpc({
  id: "0ce75896ab426783b0c2965b5472a1a2cfd707bdf8e8a1311acf1cbaafeb7d98",
  name: "deleteSupplierFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deleteSupplierFn.__executeServer(opts));
const deleteSupplierFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deleteSupplierFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deleteSupplier(ctx, data.id);
  return {
    success: true
  };
});
const listProductsFn_createServerFn_handler = createServerRpc({
  id: "71ad6ebba30c47d602641037166202c36c1578a3a3b897d84c7b26458c214f74",
  name: "listProductsFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listProductsFn.__executeServer(opts));
const listProductsFn = createServerFn({
  method: "GET"
}).handler(listProductsFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listProducts(ctx);
});
const productInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().nullable().optional(),
  supplier_id: z.string().nullable().optional(),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  image_url: z.string().optional(),
  description: z.string().optional()
});
const createProductFn_createServerFn_handler = createServerRpc({
  id: "15318a775efe948d28a65741f5d012ff59992509f00920b90afc354c60b5318c",
  name: "createProductFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createProductFn.__executeServer(opts));
const createProductFn = createServerFn({
  method: "POST"
}).inputValidator(productInputSchema).handler(createProductFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createProduct(ctx, data);
});
const updateProductFn_createServerFn_handler = createServerRpc({
  id: "1ab44a1876c21839bcc1bcc6404fac908605a6b4d1e8d091db44455cbee78a59",
  name: "updateProductFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateProductFn.__executeServer(opts));
const updateProductFn = createServerFn({
  method: "POST"
}).inputValidator(productInputSchema.partial().extend({
  id: z.string()
})).handler(updateProductFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...patch
  } = data;
  return updateProduct(ctx, id, patch);
});
const deleteProductFn_createServerFn_handler = createServerRpc({
  id: "1004642406249ada20b96efbc0f6b8aa18a1143f6c2a6614f63264ad0179948f",
  name: "deleteProductFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deleteProductFn.__executeServer(opts));
const deleteProductFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deleteProductFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deleteProduct(ctx, data.id);
  return {
    success: true
  };
});
const adjustProductStockFn_createServerFn_handler = createServerRpc({
  id: "75a20c891d8b67c1cd296b18ba74cbb9374dca5bf3fa333b46f468c1c74395fa",
  name: "adjustProductStockFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => adjustProductStockFn.__executeServer(opts));
const adjustProductStockFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  direction: z.enum(["add", "remove"]),
  quantity: z.number().int().min(1),
  reason: z.string().min(1),
  notes: z.string().optional()
})).handler(adjustProductStockFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...input
  } = data;
  return adjustProductStock(ctx, id, input);
});
const listProductSetsFn_createServerFn_handler = createServerRpc({
  id: "932981c6a6ab81d970bede89651403da36925d202de032dc4cd97bbdb51f7c6c",
  name: "listProductSetsFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listProductSetsFn.__executeServer(opts));
const listProductSetsFn = createServerFn({
  method: "GET"
}).handler(listProductSetsFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listProductSets(ctx);
});
const createProductSetFn_createServerFn_handler = createServerRpc({
  id: "dccae0677d4fdccec3c8ca2ac51f89b4714523dc0e70c723b554da157344aa7b",
  name: "createProductSetFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createProductSetFn.__executeServer(opts));
const createProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1)
  }))
})).handler(createProductSetFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createProductSet(ctx, data);
});
const deleteProductSetFn_createServerFn_handler = createServerRpc({
  id: "d8746b145759685486ef3f5ede21de5c87bc2038bab9994717cb68941a1e02c6",
  name: "deleteProductSetFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deleteProductSetFn.__executeServer(opts));
const deleteProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deleteProductSetFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deleteProductSet(ctx, data.id);
  return {
    success: true
  };
});
const updateProductSetFn_createServerFn_handler = createServerRpc({
  id: "bcde8b372609671cbc96aabd006f0fd0eed275c4af65fee9476ad24806a77660",
  name: "updateProductSetFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateProductSetFn.__executeServer(opts));
const updateProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1)
  }))
})).handler(updateProductSetFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...input
  } = data;
  return updateProductSet(ctx, id, input);
});
const swapProductSetOrderFn_createServerFn_handler = createServerRpc({
  id: "38c305f1f015c66ce8ead0ffc8d9ea299d4e3b49e45a902801446fce5479b866",
  name: "swapProductSetOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => swapProductSetOrderFn.__executeServer(opts));
const swapProductSetOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  a: z.object({
    id: z.string(),
    sort_order: z.number()
  }),
  b: z.object({
    id: z.string(),
    sort_order: z.number()
  })
})).handler(swapProductSetOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await swapProductSetOrder(ctx, data.a, data.b);
  return {
    success: true
  };
});
const listPurchaseOrdersFn_createServerFn_handler = createServerRpc({
  id: "63f7e6a3991ec24b103a66803c2fdd6602c06e05d4ca54084f49d92fc8d3435d",
  name: "listPurchaseOrdersFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listPurchaseOrdersFn.__executeServer(opts));
const listPurchaseOrdersFn = createServerFn({
  method: "GET"
}).handler(listPurchaseOrdersFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listPurchaseOrders(ctx);
});
const getPurchaseOrderFn_createServerFn_handler = createServerRpc({
  id: "8b780f1a226f92aca76b74ddd6c8dc7bdf1a4d8ff2c6401168e2c2bb2a4b0191",
  name: "getPurchaseOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getPurchaseOrderFn.__executeServer(opts));
const getPurchaseOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  id: z.string()
})).handler(getPurchaseOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return getPurchaseOrder(ctx, data.id);
});
const createPurchaseOrderFn_createServerFn_handler = createServerRpc({
  id: "c605252bd9c9a2f246dd9972e9fc310f2184f2f7fcb59f4141d4e49c91f66779",
  name: "createPurchaseOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createPurchaseOrderFn.__executeServer(opts));
const createPurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  supplier_id: z.string().nullable().optional(),
  expected_date: z.string().nullable().optional(),
  handling_fee: z.number().min(0).optional(),
  shipping_fee: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity_ordered: z.number().int().min(1),
    unit_cost: z.number().min(0)
  })).min(1)
})).handler(createPurchaseOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createPurchaseOrder(ctx, data);
});
const updatePurchaseOrderStatusFn_createServerFn_handler = createServerRpc({
  id: "a4219df99c35f2b68c3b55b1aabdc1e8e911e409e0ced9d246ce141493434dd6",
  name: "updatePurchaseOrderStatusFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updatePurchaseOrderStatusFn.__executeServer(opts));
const updatePurchaseOrderStatusFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  status: z.enum(["pending", "in_transit", "cancelled"])
})).handler(updatePurchaseOrderStatusFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return updatePurchaseOrderStatus(ctx, data.id, data.status);
});
const deletePurchaseOrderFn_createServerFn_handler = createServerRpc({
  id: "957d570af43f650bb9e761460ce52181c7d5a3dbe4f6b1f82193b5deeaabdc92",
  name: "deletePurchaseOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deletePurchaseOrderFn.__executeServer(opts));
const deletePurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deletePurchaseOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deletePurchaseOrder(ctx, data.id);
  return {
    success: true
  };
});
const receivePurchaseOrderFn_createServerFn_handler = createServerRpc({
  id: "3603d2dce37e35e26427a30260090e83c2d773119142505c33a438fcc7d4ecab",
  name: "receivePurchaseOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => receivePurchaseOrderFn.__executeServer(opts));
const receivePurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  purchaseOrderId: z.string(),
  items: z.array(z.object({
    purchaseOrderItemId: z.string(),
    quantityReceivedNow: z.number().int().min(0)
  }))
})).handler(receivePurchaseOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return receivePurchaseOrder(ctx, data);
});
const listSalesOrdersFn_createServerFn_handler = createServerRpc({
  id: "8084b5812cf6a19d42de1ebc4c5559c11a71e930644a1c75a6821e6688272c31",
  name: "listSalesOrdersFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listSalesOrdersFn.__executeServer(opts));
const listSalesOrdersFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().optional()
})).handler(listSalesOrdersFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return listSalesOrders(ctx, data);
});
const getSalesOrderFn_createServerFn_handler = createServerRpc({
  id: "96095e92af3c7feb24fd109a7bf9cd536c4f1078aaf929d9e28d65cf88d063f9",
  name: "getSalesOrderFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getSalesOrderFn.__executeServer(opts));
const getSalesOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  id: z.string()
})).handler(getSalesOrderFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return getSalesOrder(ctx, data.id);
});
const completeSaleFn_createServerFn_handler = createServerRpc({
  id: "63b78c4be65f3edcdc5e0091ebb5b708c1b0c04e8b6b1b22921dfac66ece9a6b",
  name: "completeSaleFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => completeSaleFn.__executeServer(opts));
const completeSaleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  customerName: z.string().optional(),
  customerContact: z.string().optional(),
  discount: z.number().min(0).optional(),
  shippingFee: z.number().min(0).optional(),
  paymentMethod: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0).optional()
  })).min(1)
})).handler(completeSaleFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return completeSale(ctx, data);
});
const markSalePaidFn_createServerFn_handler = createServerRpc({
  id: "6ef28ea491d74506002afcf7bd4b22c50c3f3be928866d9f672cc745a0d821f4",
  name: "markSalePaidFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => markSalePaidFn.__executeServer(opts));
const markSalePaidFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  receiptUrl: z.string().optional()
})).handler(markSalePaidFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return markSalePaid(ctx, data.id, data.receiptUrl);
});
const reverseSaleFn_createServerFn_handler = createServerRpc({
  id: "9bf2d518b70dd1b98f525a9282f5eb6f4416e84f3adb442de047180ac9708a6f",
  name: "reverseSaleFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => reverseSaleFn.__executeServer(opts));
const reverseSaleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(reverseSaleFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return reverseSale(ctx, data.id);
});
function base64ToBytes(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}
const uploadPaymentProofFn_createServerFn_handler = createServerRpc({
  id: "d02e2a7047d6a317f1357071b9310a5891fda545e1d48f4085862b5b11c3607f",
  name: "uploadPaymentProofFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => uploadPaymentProofFn.__executeServer(opts));
const uploadPaymentProofFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  saleId: z.string(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(uploadPaymentProofFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const url = await uploadPaymentProof(data.filename, data.contentType, base64ToBytes(data.base64));
  return markSalePaid(ctx, data.saleId, url);
});
const uploadInvoiceBannerFn_createServerFn_handler = createServerRpc({
  id: "75ccd7b16070f080e64d6ee47b465f2d76564d228314d3e80970cc577d9eec1d",
  name: "uploadInvoiceBannerFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => uploadInvoiceBannerFn.__executeServer(opts));
const uploadInvoiceBannerFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(uploadInvoiceBannerFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const url = await uploadInvoiceBanner(data.filename, data.contentType, base64ToBytes(data.base64));
  return updateBusinessProfile(ctx, {
    invoice_banner_url: url
  });
});
const listPromosFn_createServerFn_handler = createServerRpc({
  id: "b1f2bd2c3ca066e16f3772c1b7fec5fb3a5399a77d26c274a78825b8c2f6e869",
  name: "listPromosFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listPromosFn.__executeServer(opts));
const listPromosFn = createServerFn({
  method: "GET"
}).handler(listPromosFn_createServerFn_handler, async () => {
  const ctx = await requireOwner();
  return listPromos(ctx);
});
const promoInputSchema = z.object({
  code: z.string().min(1),
  reward_type: z.enum(["fixed_discount", "percent_discount", "free_item"]),
  reward_value: z.number().min(0),
  active: z.boolean(),
  trigger_product_ids: z.array(z.string()),
  reward_product_ids: z.array(z.string())
});
const createPromoFn_createServerFn_handler = createServerRpc({
  id: "6eef893dad183c40be94174bf6dc346f75f32b3594b9c6bd95cb653a28d30b74",
  name: "createPromoFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createPromoFn.__executeServer(opts));
const createPromoFn = createServerFn({
  method: "POST"
}).inputValidator(promoInputSchema).handler(createPromoFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createPromo(ctx, data);
});
const updatePromoFn_createServerFn_handler = createServerRpc({
  id: "06ed50819778d1bfe8fedad3a1d9d4c0226d1965ef6e919ecc81828265d612e0",
  name: "updatePromoFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updatePromoFn.__executeServer(opts));
const updatePromoFn = createServerFn({
  method: "POST"
}).inputValidator(promoInputSchema.extend({
  id: z.string()
})).handler(updatePromoFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...input
  } = data;
  return updatePromo(ctx, id, input);
});
const deletePromoFn_createServerFn_handler = createServerRpc({
  id: "52c688a98a4a55fdf1a1d85cd6797a92b5368a85f23ad23669142e78f2f056ba",
  name: "deletePromoFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deletePromoFn.__executeServer(opts));
const deletePromoFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deletePromoFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deletePromo(ctx, data.id);
  return {
    success: true
  };
});
const listExpensesFn_createServerFn_handler = createServerRpc({
  id: "0f6bde79ff8ce27375fd8b98acb9234db2a48e9adb837efef66366330b50dfe0",
  name: "listExpensesFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => listExpensesFn.__executeServer(opts));
const listExpensesFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  from: z.string().optional(),
  to: z.string().optional()
})).handler(listExpensesFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return listExpenses(ctx, data);
});
const expenseInputSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
  expense_date: z.string(),
  purchase_order_id: z.string().nullable().optional()
});
const createExpenseFn_createServerFn_handler = createServerRpc({
  id: "ace3f1205d69604ec3ddb9e60e12161db967ebf62ccc35fa59a574591f4e89ed",
  name: "createExpenseFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => createExpenseFn.__executeServer(opts));
const createExpenseFn = createServerFn({
  method: "POST"
}).inputValidator(expenseInputSchema).handler(createExpenseFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return createExpense(ctx, data);
});
const updateExpenseFn_createServerFn_handler = createServerRpc({
  id: "832522675692a4f87501388defd7bc73af2cd2e4a450b40252d4203e82e7c270",
  name: "updateExpenseFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateExpenseFn.__executeServer(opts));
const updateExpenseFn = createServerFn({
  method: "POST"
}).inputValidator(expenseInputSchema.partial().extend({
  id: z.string()
})).handler(updateExpenseFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  const {
    id,
    ...patch
  } = data;
  return updateExpense(ctx, id, patch);
});
const deleteExpenseFn_createServerFn_handler = createServerRpc({
  id: "6174528448d11217af3a189afe82fb8f13dd7536945aeba7f711685c8f1d6494",
  name: "deleteExpenseFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => deleteExpenseFn.__executeServer(opts));
const deleteExpenseFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(deleteExpenseFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  await deleteExpense(ctx, data.id);
  return {
    success: true
  };
});
const getDashboardMetricsFn_createServerFn_handler = createServerRpc({
  id: "82b36a8978a10250bf194a4507351ec317b8f0dbd881621219c0900723340bba",
  name: "getDashboardMetricsFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getDashboardMetricsFn.__executeServer(opts));
const getDashboardMetricsFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  range: z.enum(["7d", "30d", "90d", "12m"])
})).handler(getDashboardMetricsFn_createServerFn_handler, async ({
  data
}) => {
  const ctx = await requireOwner();
  return getDashboardMetrics(ctx, data.range);
});
export {
  adjustProductStockFn_createServerFn_handler,
  completeSaleFn_createServerFn_handler,
  createCategoryFn_createServerFn_handler,
  createExpenseFn_createServerFn_handler,
  createProductFn_createServerFn_handler,
  createProductSetFn_createServerFn_handler,
  createPromoFn_createServerFn_handler,
  createPurchaseOrderFn_createServerFn_handler,
  createSupplierFn_createServerFn_handler,
  deleteCategoryFn_createServerFn_handler,
  deleteExpenseFn_createServerFn_handler,
  deleteProductFn_createServerFn_handler,
  deleteProductSetFn_createServerFn_handler,
  deletePromoFn_createServerFn_handler,
  deletePurchaseOrderFn_createServerFn_handler,
  deleteSupplierFn_createServerFn_handler,
  exportOrdersCsvFn_createServerFn_handler,
  getBusinessProfileFn_createServerFn_handler,
  getDashboardMetricsFn_createServerFn_handler,
  getOrderFn_createServerFn_handler,
  getOrdersFn_createServerFn_handler,
  getPurchaseOrderFn_createServerFn_handler,
  getSalesOrderFn_createServerFn_handler,
  listCategoriesFn_createServerFn_handler,
  listExpensesFn_createServerFn_handler,
  listProductSetsFn_createServerFn_handler,
  listProductsFn_createServerFn_handler,
  listPromosFn_createServerFn_handler,
  listPublicCatalogFn_createServerFn_handler,
  listPurchaseOrdersFn_createServerFn_handler,
  listSalesOrdersFn_createServerFn_handler,
  listSuppliersFn_createServerFn_handler,
  markSalePaidFn_createServerFn_handler,
  ownerEstablishSessionFn_createServerFn_handler,
  ownerLogoutFn_createServerFn_handler,
  receivePurchaseOrderFn_createServerFn_handler,
  resendOrderEmailFn_createServerFn_handler,
  reverseSaleFn_createServerFn_handler,
  submitOrderFn_createServerFn_handler,
  swapProductSetOrderFn_createServerFn_handler,
  trackOrderFn_createServerFn_handler,
  updateBusinessProfileFn_createServerFn_handler,
  updateCategoryFn_createServerFn_handler,
  updateExpenseFn_createServerFn_handler,
  updateOrderStatusFn_createServerFn_handler,
  updateProductFn_createServerFn_handler,
  updateProductSetFn_createServerFn_handler,
  updatePromoFn_createServerFn_handler,
  updatePurchaseOrderStatusFn_createServerFn_handler,
  updateSupplierFn_createServerFn_handler,
  uploadInvoiceBannerFn_createServerFn_handler,
  uploadPaymentProofFn_createServerFn_handler,
  validatePromoCodeFn_createServerFn_handler,
  verifyOwnerFn_createServerFn_handler
};
