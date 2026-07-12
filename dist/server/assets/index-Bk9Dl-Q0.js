import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { TrendingUp, Wallet, Clock, PackageCheck, AlertTriangle } from "lucide-react";
import { f as formatPrice } from "./products-DjF4Usiw.js";
import { p as paymentLabels, f as fulfillmentLabels } from "./statusLabels-C3cdH2PC.js";
import { R as Route } from "./router-DtENt4eu.js";
import "react";
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
function DashboardHome() {
  const data = Route.useLoaderData();
  const cards = [{
    label: "Today's Orders",
    value: data.todayOrders,
    icon: TrendingUp
  }, {
    label: "Today's Revenue",
    value: formatPrice(data.todayRevenue),
    icon: Wallet
  }, {
    label: "Pending Payments",
    value: data.pendingPayments,
    icon: Clock
  }, {
    label: "Pending Fulfillments",
    value: data.pendingFulfillments,
    icon: PackageCheck
  }];
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Dashboard" }),
    /* @__PURE__ */ jsx("div", { className: "dash-cards", children: cards.map((card) => {
      const Icon = card.icon;
      return /* @__PURE__ */ jsxs("div", { className: "dash-card", children: [
        /* @__PURE__ */ jsx("div", { className: "dash-card__icon", children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: card.label }),
          /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: card.value })
        ] })
      ] }, card.label);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "dash-cards dash-cards--secondary", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-card dash-card--warn", children: [
        /* @__PURE__ */ jsx("div", { className: "dash-card__icon", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: "Low Stock Items" }),
          /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: data.lowStockCount })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-card dash-card--danger", children: [
        /* @__PURE__ */ jsx("div", { className: "dash-card__icon", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: "Out of Stock Items" }),
          /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: data.outOfStockCount })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-card", children: [
        /* @__PURE__ */ jsx("div", { className: "dash-card__icon", children: /* @__PURE__ */ jsx(TrendingUp, { size: 18 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: "Top Selling Product" }),
          /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: data.topProduct ? `${data.topProduct.name} (${data.topProduct.units} units)` : "—" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("h2", { className: "dash-section-title", children: "Recent Orders" }),
    /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Reference" }),
        /* @__PURE__ */ jsx("th", { children: "Customer" }),
        /* @__PURE__ */ jsx("th", { children: "Total" }),
        /* @__PURE__ */ jsx("th", { children: "Payment" }),
        /* @__PURE__ */ jsx("th", { children: "Fulfillment" }),
        /* @__PURE__ */ jsx("th", { children: "Placed" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        data.recentOrders.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "dash-table__empty", children: "No orders yet." }) }),
        data.recentOrders.map((order) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Link, { to: "/dashboard/orders/$ref", params: {
            ref: order.reference
          }, children: order.reference }) }),
          /* @__PURE__ */ jsx("td", { children: order.full_name }),
          /* @__PURE__ */ jsx("td", { children: formatPrice(order.total) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${order.payment_status}`, children: paymentLabels[order.payment_status] }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${order.fulfillment_status}`, children: fulfillmentLabels[order.fulfillment_status] }) }),
          /* @__PURE__ */ jsx("td", { children: new Date(order.placed_at).toLocaleDateString("en-PH") })
        ] }, order.id))
      ] })
    ] }) })
  ] });
}
export {
  DashboardHome as component
};
