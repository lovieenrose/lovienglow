import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, XCircle, Download, Maximize2, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { p as paymentMethods, s as shippingRegions, f as formatPrice } from "./shipping-B_aQucIA.js";
import { Q as Route, S as updateOrderStatusFn, T as resendOrderEmailFn } from "./router-Cv-N2EiY.js";
import { b as orderStatusSteps, o as orderStatusLabels, a as orderStatusBadgeClass } from "./statusLabels-CPAV1ZKD.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
const RETRYABLE_EMAIL_TYPES = /* @__PURE__ */ new Set(["order_received", "payment_confirmed", "packed", "shipped", "delivered", "admin_notification"]);
const STEP_ACTION_LABEL = {
  pending_payment: "Pending Payment",
  processing: "Confirm Payment",
  shipped: "Mark as Shipped",
  delivered: "Mark as Delivered",
  cancelled: "Cancelled"
};
function OrderDetailPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [internalNotes, setInternalNotes] = useState(order.internal_notes);
  const [savingTracking, setSavingTracking] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(null);
  const [copied, setCopied] = useState(false);
  const method = paymentMethods.find((item) => item.id === order.payment_method);
  const region = shippingRegions.find((item) => item.id === order.region);
  const isPdf = order.receipt_filename?.toLowerCase().endsWith(".pdf");
  const currentStepIndex = orderStatusSteps.indexOf(order.order_status);
  const nextStep = order.order_status === "cancelled" ? null : orderStatusSteps[currentStepIndex + 1];
  const advanceTo = async (status) => {
    setAdvancing(true);
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        orderStatus: status,
        trackingNumber: status === "shipped" ? trackingNumber : void 0
      }
    });
    await router.invalidate();
    setAdvancing(false);
  };
  const cancelOrder = async () => {
    if (!confirm("Cancel this order? This cannot be undone from here.")) return;
    setCancelling(true);
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        orderStatus: "cancelled"
      }
    });
    await router.invalidate();
    setCancelling(false);
  };
  const saveNotes = async () => {
    if (internalNotes === order.internal_notes) return;
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        internalNotes
      }
    });
    await router.invalidate();
  };
  const saveTrackingNumber = async () => {
    setSavingTracking(true);
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        trackingNumber
      }
    });
    await router.invalidate();
    setSavingTracking(false);
  };
  const retryEmail = async (emailType) => {
    setRetrying(emailType);
    await resendOrderEmailFn({
      data: {
        reference: order.reference,
        emailType
      }
    });
    await router.invalidate();
    setRetrying(null);
  };
  const copyTrackingCode = async () => {
    await navigator.clipboard.writeText(order.tracking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/dashboard/orders", className: "dash-back-link", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
      " Back to Orders"
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-detail-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: order.reference }),
        /* @__PURE__ */ jsx("span", { className: "dash-detail-header__date", children: new Date(order.placed_at).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short"
        }) }),
        /* @__PURE__ */ jsxs("div", { className: "dash-tracking-code", children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Tracking Code:" }),
          " ",
          /* @__PURE__ */ jsx("b", { children: order.tracking_code }),
          /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Copy tracking code", onClick: copyTrackingCode, children: copied ? /* @__PURE__ */ jsx(Check, { size: 13 }) : /* @__PURE__ */ jsx(Copy, { size: 13 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-detail-header__badges", children: /* @__PURE__ */ jsx("span", { className: `dash-badge ${orderStatusBadgeClass[order.order_status]}`, children: orderStatusLabels[order.order_status] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dash-status-stepper", children: orderStatusSteps.map((step, i) => /* @__PURE__ */ jsxs("div", { className: `dash-status-step ${i <= currentStepIndex ? "is-done" : ""} ${i === currentStepIndex ? "is-current" : ""}`, children: [
      /* @__PURE__ */ jsx("span", { className: "dash-status-step__dot" }),
      /* @__PURE__ */ jsx("span", { className: "dash-status-step__label", children: orderStatusLabels[step] })
    ] }, step)) }),
    order.order_status !== "cancelled" && /* @__PURE__ */ jsxs("div", { className: "dash-toolbar", style: {
      marginTop: 0
    }, children: [
      /* @__PURE__ */ jsx("div", {}),
      /* @__PURE__ */ jsxs("div", { className: "dash-toolbar__actions", children: [
        nextStep && /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: () => advanceTo(nextStep), disabled: advancing, children: advancing ? "Saving…" : STEP_ACTION_LABEL[nextStep] }),
        /* @__PURE__ */ jsxs("button", { className: "dash-link-btn dash-link-btn--danger", onClick: cancelOrder, disabled: cancelling, children: [
          /* @__PURE__ */ jsx(XCircle, { size: 14 }),
          " ",
          cancelling ? "Cancelling…" : "Cancel Order"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-detail-grid", children: [
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Customer Info" }),
        /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Full Name" }),
            /* @__PURE__ */ jsx("dd", { children: order.full_name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Contact Number" }),
            /* @__PURE__ */ jsx("dd", { children: order.contact_number })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Email" }),
            /* @__PURE__ */ jsx("dd", { children: order.email || "—" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Social Handle" }),
            /* @__PURE__ */ jsx("dd", { children: order.social_handle || "—" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Delivery" }),
        /* @__PURE__ */ jsxs("dl", { children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Address" }),
            /* @__PURE__ */ jsx("dd", { children: order.address })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Courier" }),
            /* @__PURE__ */ jsx("dd", { children: order.courier === "lalamove" ? "Lalamove" : "J&T Express" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("dt", { children: "Region" }),
            /* @__PURE__ */ jsx("dd", { children: region?.label ?? "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Courier Tracking Number (optional)" }),
          /* @__PURE__ */ jsx("input", { value: trackingNumber, onChange: (event) => setTrackingNumber(event.target.value), placeholder: "Optional" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: saveTrackingNumber, disabled: savingTracking, children: savingTracking ? "Saving…" : "Save Tracking Number" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Receipt" }),
        order.receipt_url ? isPdf ? /* @__PURE__ */ jsxs("a", { className: "button button--outline", href: order.receipt_url, target: "_blank", rel: "noreferrer", download: true, children: [
          /* @__PURE__ */ jsx(Download, { size: 14 }),
          " Download PDF Receipt"
        ] }) : /* @__PURE__ */ jsxs("div", { className: "dash-receipt", children: [
          /* @__PURE__ */ jsx("img", { src: order.receipt_url, alt: "Payment receipt", onClick: () => setLightboxOpen(true) }),
          /* @__PURE__ */ jsxs("div", { className: "dash-receipt__actions", children: [
            /* @__PURE__ */ jsxs("button", { className: "button button--outline", onClick: () => setLightboxOpen(true), children: [
              /* @__PURE__ */ jsx(Maximize2, { size: 13 }),
              " Zoom"
            ] }),
            /* @__PURE__ */ jsxs("a", { className: "button button--outline", href: order.receipt_url, target: "_blank", rel: "noreferrer", download: true, children: [
              /* @__PURE__ */ jsx(Download, { size: 13 }),
              " Download"
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsx("p", { className: "dash-muted", children: "No receipt on file." })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel dash-panel--wide", children: [
        /* @__PURE__ */ jsx("h2", { children: "Order Items" }),
        /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { children: "Product" }),
            /* @__PURE__ */ jsx("th", { children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { children: "Qty" }),
            /* @__PURE__ */ jsx("th", { children: "Line Total" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: order.items.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: item.product_name }),
            /* @__PURE__ */ jsx("td", { children: formatPrice(item.unit_price) }),
            /* @__PURE__ */ jsx("td", { children: item.quantity }),
            /* @__PURE__ */ jsx("td", { children: formatPrice(item.line_total) })
          ] }, item.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-financials", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
            /* @__PURE__ */ jsx("b", { children: formatPrice(order.subtotal) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
            /* @__PURE__ */ jsx("b", { children: formatPrice(order.shipping_fee) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "dash-financials__total", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("b", { children: formatPrice(order.total) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Payment" }),
        /* @__PURE__ */ jsxs("p", { className: "dash-muted", children: [
          "Method: ",
          method?.label ?? order.payment_method
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel dash-panel--wide", children: [
        /* @__PURE__ */ jsx("h2", { children: "Internal Notes" }),
        /* @__PURE__ */ jsx("textarea", { value: internalNotes, onChange: (event) => setInternalNotes(event.target.value), onBlur: saveNotes, rows: 3, placeholder: "Notes visible only to the admin team…" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Status History" }),
        order.history.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-muted", children: "No status changes yet." }) : /* @__PURE__ */ jsx("ul", { className: "dash-timeline", children: order.history.map((entry) => /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-timeline__time", children: new Date(entry.changed_at).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short"
          }) }),
          /* @__PURE__ */ jsxs("span", { children: [
            orderStatusLabels[entry.old_value ?? "pending_payment"] ?? entry.old_value ?? "—",
            " → ",
            orderStatusLabels[entry.new_value] ?? entry.new_value
          ] })
        ] }, entry.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Email History" }),
        order.emails.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-muted", children: "No emails sent yet." }) : /* @__PURE__ */ jsx("ul", { className: "dash-timeline", children: order.emails.map((entry) => /* @__PURE__ */ jsxs("li", { style: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8
        }, children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("span", { className: "dash-timeline__time", style: {
              display: "block"
            }, children: new Date(entry.sent_at).toLocaleString("en-PH", {
              dateStyle: "medium",
              timeStyle: "short"
            }) }),
            entry.email_type,
            " → ",
            entry.sent_to,
            " ",
            entry.success ? "" : /* @__PURE__ */ jsx("span", { style: {
              color: "#a03030",
              fontWeight: 600
            }, children: "(failed)" })
          ] }),
          !entry.success && RETRYABLE_EMAIL_TYPES.has(entry.email_type) && /* @__PURE__ */ jsxs("button", { className: "button button--outline", onClick: () => retryEmail(entry.email_type), disabled: retrying !== null, children: [
            /* @__PURE__ */ jsx(RotateCcw, { size: 12 }),
            " ",
            retrying === entry.email_type ? "Retrying…" : "Retry"
          ] })
        ] }, entry.id)) })
      ] })
    ] }),
    lightboxOpen && order.receipt_url && /* @__PURE__ */ jsxs("div", { className: "dash-lightbox", onClick: () => setLightboxOpen(false), children: [
      /* @__PURE__ */ jsx("button", { className: "dash-lightbox__close", onClick: () => setLightboxOpen(false), "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 20 }) }),
      /* @__PURE__ */ jsx("img", { src: order.receipt_url, alt: "Payment receipt full size", onClick: (event) => event.stopPropagation() })
    ] })
  ] });
}
export {
  OrderDetailPage as component
};
