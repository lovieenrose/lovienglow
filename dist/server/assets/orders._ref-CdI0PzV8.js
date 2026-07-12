import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Maximize2, X } from "lucide-react";
import { useState } from "react";
import { f as formatPrice } from "./products-DjF4Usiw.js";
import { h as Route, p as paymentMethods, s as shippingRegions, i as updateOrderStatusFn } from "./router-DtENt4eu.js";
import { p as paymentLabels, f as fulfillmentLabels, a as paymentStatusOptions, b as fulfillmentStatusOptions } from "./statusLabels-C3cdH2PC.js";
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
function OrderDetailPage() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillment_status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number ?? "");
  const [internalNotes, setInternalNotes] = useState(order.internal_notes);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingFulfillment, setSavingFulfillment] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const method = paymentMethods.find((item) => item.id === order.payment_method);
  const region = shippingRegions.find((item) => item.id === order.region);
  const isPdf = order.receipt_filename?.toLowerCase().endsWith(".pdf");
  const savePayment = async () => {
    setSavingPayment(true);
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        paymentStatus
      }
    });
    await router.invalidate();
    setSavingPayment(false);
  };
  const saveFulfillment = async () => {
    setSavingFulfillment(true);
    await updateOrderStatusFn({
      data: {
        reference: order.reference,
        fulfillmentStatus,
        trackingNumber
      }
    });
    await router.invalidate();
    setSavingFulfillment(false);
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
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-detail-header__badges", children: [
        /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${order.payment_status}`, children: paymentLabels[order.payment_status] }),
        /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${order.fulfillment_status}`, children: fulfillmentLabels[order.fulfillment_status] })
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
        ] })
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
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Payment Status" }),
          /* @__PURE__ */ jsx("select", { value: paymentStatus, onChange: (event) => setPaymentStatus(event.target.value), children: paymentStatusOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status, children: paymentLabels[status] }, status)) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: savePayment, disabled: savingPayment, children: savingPayment ? "Saving…" : "Save Payment Status" })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Fulfillment" }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Fulfillment Status" }),
          /* @__PURE__ */ jsx("select", { value: fulfillmentStatus, onChange: (event) => setFulfillmentStatus(event.target.value), children: fulfillmentStatusOptions.map((status) => /* @__PURE__ */ jsx("option", { value: status, children: fulfillmentLabels[status] }, status)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Tracking Number" }),
          /* @__PURE__ */ jsx("input", { value: trackingNumber, onChange: (event) => setTrackingNumber(event.target.value), placeholder: "Optional" })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: saveFulfillment, disabled: savingFulfillment, children: savingFulfillment ? "Saving…" : "Save Fulfillment Status" })
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
            entry.field === "payment_status" ? "Payment" : "Fulfillment",
            ": ",
            entry.old_value ?? "—",
            " → ",
            entry.new_value
          ] })
        ] }, entry.id)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "dash-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Email History" }),
        order.emails.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-muted", children: "No emails sent yet." }) : /* @__PURE__ */ jsx("ul", { className: "dash-timeline", children: order.emails.map((entry) => /* @__PURE__ */ jsxs("li", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-timeline__time", children: new Date(entry.sent_at).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short"
          }) }),
          /* @__PURE__ */ jsxs("span", { children: [
            entry.email_type,
            " → ",
            entry.sent_to,
            " ",
            entry.success ? "" : "(failed)"
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
