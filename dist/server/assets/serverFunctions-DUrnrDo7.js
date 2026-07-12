import { T as TSS_SERVER_FUNCTION, u as useSession$1, a as getSession$1, c as createServerFn } from "../server.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { p as products, f as formatPrice } from "./products-DjF4Usiw.js";
import { Resend } from "resend";
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
function adminSessionConfig() {
  const password = process.env.ADMIN_SECRET;
  if (!password || password.length < 32) {
    throw new Error("ADMIN_SECRET must be set to a random string of at least 32 characters");
  }
  return {
    password,
    name: "lng_admin_session",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 8
    }
  };
}
function verifyAdminCredentials(email, password) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  return Boolean(adminEmail && adminPassword && email === adminEmail && password === adminPassword);
}
async function getAdminSessionManager() {
  return useSession$1(adminSessionConfig());
}
async function getAdminSession() {
  return getSession$1(adminSessionConfig());
}
async function requireAdmin() {
  const session = await getAdminSession();
  const email = session.data.email;
  if (!email) throw new Error("Not authenticated");
  return email;
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
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
function base64ToBytes(base64) {
  return new Uint8Array(Buffer.from(base64, "base64"));
}
async function createOrder(input) {
  const bytes = base64ToBytes(input.receiptBase64);
  if (bytes.byteLength > MAX_RECEIPT_BYTES) {
    throw new Error("Receipt file exceeds the 5 MB limit");
  }
  const supabase = getSupabaseAdmin();
  const { data: refData, error: refError } = await supabase.rpc("next_order_reference");
  if (refError) throw refError;
  const reference = refData;
  const receiptUrl = await uploadReceipt(input.receiptFilename, input.receiptContentType, bytes);
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    reference,
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
    total: input.total
  }).select().single();
  if (orderError) throw orderError;
  const orderRow = order;
  const { data: items, error: itemsError } = await supabase.from("order_items").insert(
    input.items.map((item) => ({
      order_id: orderRow.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal
    }))
  ).select();
  if (itemsError) throw itemsError;
  await decrementInventory(input.items);
  return { ...orderRow, items: items ?? [], history: [], emails: [] };
}
async function decrementInventory(items) {
  const supabase = getSupabaseAdmin();
  for (const item of items) {
    const { data: current } = await supabase.from("product_inventory").select("stock").eq("product_id", item.productId).maybeSingle();
    if (!current) continue;
    const nextStock = Math.max(0, current.stock - item.quantity);
    await supabase.from("product_inventory").update({ stock: nextStock, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("product_id", item.productId);
  }
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
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
  if (filters.fulfillmentStatus) query = query.eq("fulfillment_status", filters.fulfillmentStatus);
  if (filters.courier) query = query.eq("courier", filters.courier);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `reference.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`
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
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus);
  if (filters.fulfillmentStatus) query = query.eq("fulfillment_status", filters.fulfillmentStatus);
  if (filters.courier) query = query.eq("courier", filters.courier);
  if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
  if (filters.dateTo) query = query.lte("created_at", filters.dateTo);
  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(
      `reference.ilike.%${term}%,full_name.ilike.%${term}%,contact_number.ilike.%${term}%,email.ilike.%${term}%`
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
  if (patch.paymentStatus !== void 0) update.payment_status = patch.paymentStatus;
  if (patch.fulfillmentStatus !== void 0) update.fulfillment_status = patch.fulfillmentStatus;
  const { error: updateError } = await supabase.from("orders").update(update).eq("id", existingRow.id);
  if (updateError) throw updateError;
  const historyRows = [];
  if (patch.paymentStatus !== void 0 && patch.paymentStatus !== existingRow.payment_status) {
    historyRows.push({
      order_id: existingRow.id,
      field: "payment_status",
      old_value: existingRow.payment_status,
      new_value: patch.paymentStatus,
      note: patch.note ?? null
    });
  }
  if (patch.fulfillmentStatus !== void 0 && patch.fulfillmentStatus !== existingRow.fulfillment_status) {
    historyRows.push({
      order_id: existingRow.id,
      field: "fulfillment_status",
      old_value: existingRow.fulfillment_status,
      new_value: patch.fulfillmentStatus,
      note: patch.note ?? null
    });
  }
  if (historyRows.length) {
    await supabase.from("order_status_history").insert(historyRows);
  }
  const updated = await getOrder(reference);
  if (!updated) throw new Error("Order not found after update");
  return updated;
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
async function getInventory() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("product_inventory").select().order("product_id", { ascending: true });
  if (error) throw error;
  const nameById = new Map(products.map((product) => [product.id, product.name]));
  return (data ?? []).map((row) => ({
    ...row,
    product_name: nameById.get(row.product_id) ?? `Product #${row.product_id}`
  }));
}
async function updateInventory(productId, stock, lowStockThreshold) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("product_inventory").update({ stock, low_stock_threshold: lowStockThreshold, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("product_id", productId);
  if (error) throw error;
}
async function getDashboardAnalytics() {
  const supabase = getSupabaseAdmin();
  const startOfDay = /* @__PURE__ */ new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [{ data: todayOrders }, { count: pendingPayments }, { count: pendingFulfillments }, { data: inventory }, { data: recentOrders }] = await Promise.all([
    supabase.from("orders").select("total").gte("created_at", startOfDay.toISOString()),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("fulfillment_status", ["pending", "processing", "packed", "ready_for_pickup"]),
    supabase.from("product_inventory").select(),
    supabase.from("orders").select().order("created_at", { ascending: false }).limit(10)
  ]);
  const todayOrderRows = todayOrders ?? [];
  const inventoryRows = inventory ?? [];
  const { data: topLines } = await supabase.from("order_items").select("product_id, product_name, quantity");
  const unitsByProduct = /* @__PURE__ */ new Map();
  for (const line of topLines ?? []) {
    unitsByProduct.set(line.product_name, (unitsByProduct.get(line.product_name) ?? 0) + line.quantity);
  }
  let topProduct = null;
  for (const [name, units] of unitsByProduct) {
    if (!topProduct || units > topProduct.units) topProduct = { name, units };
  }
  return {
    todayOrders: todayOrderRows.length,
    todayRevenue: todayOrderRows.reduce((sum, row) => sum + Number(row.total), 0),
    pendingPayments: pendingPayments ?? 0,
    pendingFulfillments: pendingFulfillments ?? 0,
    lowStockCount: inventoryRows.filter((row) => row.stock > 0 && row.stock <= row.low_stock_threshold).length,
    outOfStockCount: inventoryRows.filter((row) => row.stock === 0).length,
    topProduct,
    recentOrders: recentOrders ?? []
  };
}
let cached = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.startsWith("re_xxxx")) return null;
  if (!cached) cached = new Resend(key);
  return cached;
}
function baseTemplate(title, bodyHtml) {
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
  </div>`;
}
function itemsTable(order) {
  const rows = order.items.map(
    (item) => `<tr><td style="padding:6px 0;">${item.product_name} &times; ${item.quantity}</td><td style="padding:6px 0;text-align:right;">${formatPrice(item.line_total)}</td></tr>`
  ).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
    ${rows}
    <tr><td style="padding-top:10px;border-top:1px solid #f3d7e2;">Subtotal</td><td style="padding-top:10px;border-top:1px solid #f3d7e2;text-align:right;">${formatPrice(order.subtotal)}</td></tr>
    <tr><td>Shipping</td><td style="text-align:right;">${formatPrice(order.shipping_fee)}</td></tr>
    <tr><td style="font-weight:bold;padding-top:6px;">Total</td><td style="font-weight:bold;padding-top:6px;text-align:right;">${formatPrice(order.total)}</td></tr>
  </table>`;
}
async function send(to, subject, html, orderId, emailType) {
  const resend = getResend();
  if (!resend) {
    await logEmail(orderId, emailType, to, subject, false);
    return;
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "no-reply@lovienglow.com";
  try {
    await resend.emails.send({ from, to, subject, html });
    await logEmail(orderId, emailType, to, subject, true);
  } catch {
    await logEmail(orderId, emailType, to, subject, false);
  }
}
async function sendOrderReceived(order) {
  if (!order.email) return;
  const html = baseTemplate(
    "We got your order! 💕",
    `<p>Hi ${order.full_name.split(" ")[0]}, thank you for ordering from LovieNGlow. We're verifying your payment now.</p>
     <p><b>Order Reference:</b> ${order.reference}</p>
     ${itemsTable(order)}`
  );
  await send(order.email, "We got your order! 💕", html, order.id, "order_received");
}
async function sendPaymentConfirmed(order) {
  if (!order.email) return;
  const html = baseTemplate(
    "Your payment is confirmed! 🎉",
    `<p>Hi ${order.full_name.split(" ")[0]}, your payment for order <b>${order.reference}</b> has been confirmed. We're getting your order ready.</p>
     ${itemsTable(order)}`
  );
  await send(order.email, "Your payment is confirmed! 🎉", html, order.id, "payment_confirmed");
}
async function sendOrderPacked(order) {
  if (!order.email) return;
  const html = baseTemplate(
    "Your order is packed and ready! 📦",
    `<p>Hi ${order.full_name.split(" ")[0]}, order <b>${order.reference}</b> has been packed and is ready to ship.</p>`
  );
  await send(order.email, "Your order is packed and ready! 📦", html, order.id, "packed");
}
async function sendOrderShipped(order, trackingNumber) {
  if (!order.email) return;
  const html = baseTemplate(
    "Your order is on its way! 🚚",
    `<p>Hi ${order.full_name.split(" ")[0]}, order <b>${order.reference}</b> has shipped via ${order.courier === "lalamove" ? "Lalamove" : "J&T Express"}.</p>
     ${trackingNumber ? `<p><b>Tracking Number:</b> ${trackingNumber}</p>` : ""}`
  );
  await send(order.email, "Your order is on its way! 🚚", html, order.id, "shipped");
}
async function sendAdminNotification(order) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;
  const siteUrl = process.env.PUBLIC_SITE_URL ?? "";
  const html = baseTemplate(
    `New Order Received — ${order.reference}`,
    `<p><b>${order.full_name}</b> just placed an order.</p>
     ${itemsTable(order)}
     <p><a href="${siteUrl}/dashboard/orders/${order.reference}">View order in dashboard</a></p>`
  );
  await send(adminEmail, `New Order Received — ${order.reference}`, html, order.id, "admin_notification");
}
const orderItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number()
});
const submitOrderSchema = z.object({
  fullName: z.string().min(1),
  contactNumber: z.string().min(1),
  email: z.string(),
  socialHandle: z.string(),
  address: z.string().min(1),
  courier: z.string(),
  region: z.string(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number(),
  shippingFee: z.number(),
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
  const order = await createOrder(data);
  await Promise.all([sendOrderReceived(order), sendAdminNotification(order)]);
  return order;
});
const adminLoginFn_createServerFn_handler = createServerRpc({
  id: "b5d79a62f2ea696c5b87d78cff58af6a89b0580c9013340d4fb5b595b897788e",
  name: "adminLoginFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => adminLoginFn.__executeServer(opts));
const adminLoginFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  email: z.string(),
  password: z.string()
})).handler(adminLoginFn_createServerFn_handler, async ({
  data
}) => {
  if (!verifyAdminCredentials(data.email, data.password)) {
    return {
      success: false
    };
  }
  const session = await getAdminSessionManager();
  await session.update({
    email: data.email
  });
  return {
    success: true
  };
});
const adminLogoutFn_createServerFn_handler = createServerRpc({
  id: "43470274709025f0a7d964e6a157857b90e8747ee547ddd70966eb725556d62d",
  name: "adminLogoutFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => adminLogoutFn.__executeServer(opts));
const adminLogoutFn = createServerFn({
  method: "POST"
}).handler(adminLogoutFn_createServerFn_handler, async () => {
  const session = await getAdminSessionManager();
  await session.clear();
  return {
    success: true
  };
});
const verifyAdminFn_createServerFn_handler = createServerRpc({
  id: "6975ab3f225fad98c98116f277d223680c1181cc5355801e269c5cd6d7a57eb7",
  name: "verifyAdminFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => verifyAdminFn.__executeServer(opts));
const verifyAdminFn = createServerFn({
  method: "GET"
}).handler(verifyAdminFn_createServerFn_handler, async () => {
  const session = await getAdminSession();
  return {
    valid: Boolean(session.data.email),
    email: session.data.email ?? null
  };
});
const listFiltersSchema = z.object({
  search: z.string().optional(),
  paymentStatus: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
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
  await requireAdmin();
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
  await requireAdmin();
  const orders = await listAllOrdersForExport(data);
  const headers = ["Reference", "Placed At", "Full Name", "Contact Number", "Email", "Address", "Courier", "Region", "Payment Method", "Subtotal", "Shipping Fee", "Total", "Payment Status", "Fulfillment Status", "Tracking Number"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = orders.map((order) => [order.reference, order.placed_at, order.full_name, order.contact_number, order.email ?? "", order.address, order.courier, order.region ?? "", order.payment_method, order.subtotal, order.shipping_fee, order.total, order.payment_status, order.fulfillment_status, order.tracking_number ?? ""].map(escape).join(","));
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
  await requireAdmin();
  return getOrder(data.reference);
});
const updateOrderSchema = z.object({
  reference: z.string(),
  paymentStatus: z.enum(["pending", "confirmed", "rejected", "refunded"]).optional(),
  fulfillmentStatus: z.enum(["pending", "processing", "packed", "ready_for_pickup", "shipped", "delivered", "completed", "cancelled"]).optional(),
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
  await requireAdmin();
  const {
    reference,
    ...patch
  } = data;
  const updated = await updateOrder(reference, patch);
  if (patch.paymentStatus === "confirmed") await sendPaymentConfirmed(updated);
  if (patch.fulfillmentStatus === "packed") await sendOrderPacked(updated);
  if (patch.fulfillmentStatus === "shipped") await sendOrderShipped(updated, updated.tracking_number ?? "");
  return getOrder(reference);
});
const getInventoryFn_createServerFn_handler = createServerRpc({
  id: "eecd1c438edee933e1e65c2799a7c7ca2df76f1c9dea4176720f7a4df62eed46",
  name: "getInventoryFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getInventoryFn.__executeServer(opts));
const getInventoryFn = createServerFn({
  method: "GET"
}).handler(getInventoryFn_createServerFn_handler, async () => {
  await requireAdmin();
  return getInventory();
});
const updateInventoryFn_createServerFn_handler = createServerRpc({
  id: "12aae7892b451b40fafdec001a0f062e2d9392f6c8ef0ccece5495327a141ebd",
  name: "updateInventoryFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => updateInventoryFn.__executeServer(opts));
const updateInventoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  productId: z.number(),
  stock: z.number(),
  lowStockThreshold: z.number()
})).handler(updateInventoryFn_createServerFn_handler, async ({
  data
}) => {
  await requireAdmin();
  await updateInventory(data.productId, data.stock, data.lowStockThreshold);
  return {
    success: true
  };
});
const getDashboardAnalyticsFn_createServerFn_handler = createServerRpc({
  id: "dbbcdafebc1a4c8e685e56052c07093a2f97c6423de77ab9cbb9db2ade60765d",
  name: "getDashboardAnalyticsFn",
  filename: "src/lib/serverFunctions.ts"
}, (opts) => getDashboardAnalyticsFn.__executeServer(opts));
const getDashboardAnalyticsFn = createServerFn({
  method: "GET"
}).handler(getDashboardAnalyticsFn_createServerFn_handler, async () => {
  await requireAdmin();
  return getDashboardAnalytics();
});
export {
  adminLoginFn_createServerFn_handler,
  adminLogoutFn_createServerFn_handler,
  exportOrdersCsvFn_createServerFn_handler,
  getDashboardAnalyticsFn_createServerFn_handler,
  getInventoryFn_createServerFn_handler,
  getOrderFn_createServerFn_handler,
  getOrdersFn_createServerFn_handler,
  submitOrderFn_createServerFn_handler,
  updateInventoryFn_createServerFn_handler,
  updateOrderStatusFn_createServerFn_handler,
  verifyAdminFn_createServerFn_handler
};
