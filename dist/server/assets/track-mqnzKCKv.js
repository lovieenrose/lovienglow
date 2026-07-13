import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Search, Loader2, PackageSearch, CheckCircle2, Circle } from "lucide-react";
import { useState, useEffect } from "react";
import { f as formatPrice } from "./shipping-DGz5nmQT.js";
import { R as Route, t as trackOrderFn } from "./router-CEcpJq9W.js";
import { o as orderStatusLabels, a as orderStatusBadgeClass } from "./statusLabels-CPAV1ZKD.js";
import "@tanstack/react-router";
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
const STATUS_DESCRIPTIONS = {
  pending_payment: "We're validating your payment. This usually takes up to 24 hours.",
  processing: "Your payment is confirmed and your order is being prepared.",
  shipped: "Your order has shipped and is on its way to you.",
  delivered: "Your order has been delivered. We hope you love it!",
  cancelled: "This order has been cancelled."
};
function buildMilestones(order) {
  const findTimestamp = (status) => order.history.find((h) => h.new_value === status)?.changed_at ?? null;
  const reachedProcessing = order.order_status === "processing" || order.order_status === "shipped" || order.order_status === "delivered";
  const reachedShipped = order.order_status === "shipped" || order.order_status === "delivered";
  const reachedDelivered = order.order_status === "delivered";
  const processingAt = findTimestamp("processing");
  return [{
    label: "Order Received",
    done: true,
    timestamp: order.created_at
  }, {
    label: "Payment Confirmed",
    done: reachedProcessing,
    timestamp: processingAt
  }, {
    label: "Processing",
    done: reachedProcessing,
    timestamp: processingAt
  }, {
    label: "Shipped",
    done: reachedShipped,
    timestamp: findTimestamp("shipped")
  }, {
    label: "Delivered",
    done: reachedDelivered,
    timestamp: findTimestamp("delivered")
  }];
}
function TrackPage() {
  const {
    code
  } = Route.useSearch();
  const [input, setInput] = useState(code ?? "");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [order, setOrder] = useState(null);
  const runSearch = async (trackingCode) => {
    if (!trackingCode.trim()) return;
    setLoading(true);
    setSearched(true);
    const result = await trackOrderFn({
      data: {
        trackingCode: trackingCode.trim()
      }
    });
    setOrder(result);
    setLoading(false);
  };
  useEffect(() => {
    if (code) runSearch(code);
  }, []);
  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(input);
  };
  return /* @__PURE__ */ jsxs("div", { className: "track-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "track-page__hero", children: [
      /* @__PURE__ */ jsx("h1", { children: "Track Your Order" }),
      /* @__PURE__ */ jsx("p", { children: "Enter the tracking code from your confirmation email — no account needed." }),
      /* @__PURE__ */ jsxs("form", { className: "track-page__form", onSubmit: handleSubmit, children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-search-field", style: {
          background: "#fff"
        }, children: [
          /* @__PURE__ */ jsx(Search, { size: 16 }),
          /* @__PURE__ */ jsx("input", { placeholder: "e.g. LNG-20260713-000123", value: input, onChange: (e) => setInput(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "button button--dark", type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 14 }),
          " Searching…"
        ] }) : "Track Order" })
      ] })
    ] }),
    searched && !loading && !order && /* @__PURE__ */ jsxs("div", { className: "track-page__empty", children: [
      /* @__PURE__ */ jsx(PackageSearch, { size: 28 }),
      /* @__PURE__ */ jsx("p", { children: "We couldn't find an order with that tracking code. Please double-check and try again." })
    ] }),
    order && /* @__PURE__ */ jsxs("div", { className: "track-page__result", children: [
      /* @__PURE__ */ jsxs("div", { className: "track-page__summary", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "track-page__label", children: "Tracking Number" }),
          /* @__PURE__ */ jsx("b", { children: order.tracking_code })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "track-page__label", children: "Order Number" }),
          /* @__PURE__ */ jsx("b", { children: order.reference })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "track-page__label", children: "Last Updated" }),
          /* @__PURE__ */ jsx("b", { children: new Date(order.updated_at).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short"
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "track-page__status", children: [
        /* @__PURE__ */ jsx("span", { className: `dash-badge ${orderStatusBadgeClass[order.order_status]}`, children: orderStatusLabels[order.order_status] }),
        /* @__PURE__ */ jsx("p", { children: STATUS_DESCRIPTIONS[order.order_status] })
      ] }),
      order.order_status !== "cancelled" && /* @__PURE__ */ jsx("ul", { className: "track-page__timeline", children: buildMilestones(order).map((m) => /* @__PURE__ */ jsxs("li", { className: m.done ? "is-done" : "", children: [
        m.done ? /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) : /* @__PURE__ */ jsx(Circle, { size: 18 }),
        /* @__PURE__ */ jsx("span", { children: m.label }),
        m.timestamp && /* @__PURE__ */ jsx("span", { className: "track-page__timeline-time", children: new Date(m.timestamp).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric"
        }) })
      ] }, m.label)) }),
      /* @__PURE__ */ jsx("h2", { className: "track-page__items-title", children: "Ordered Items" }),
      /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Product" }),
          /* @__PURE__ */ jsx("th", { children: "Qty" }),
          /* @__PURE__ */ jsx("th", { children: "Unit Price" }),
          /* @__PURE__ */ jsx("th", { children: "Line Total" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: order.items.map((item, i) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: item.product_name }),
          /* @__PURE__ */ jsx("td", { children: item.quantity }),
          /* @__PURE__ */ jsx("td", { children: formatPrice(item.unit_price) }),
          /* @__PURE__ */ jsx("td", { children: formatPrice(item.line_total) })
        ] }, i)) })
      ] })
    ] })
  ] });
}
export {
  TrackPage as component
};
