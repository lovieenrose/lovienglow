import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { a as Route, g as getDashboardMetricsFn } from "./router-Cv-N2EiY.js";
import "@tanstack/react-router";
import "./shipping-B_aQucIA.js";
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
const RANGES = [{
  key: "7d",
  label: "7 Days"
}, {
  key: "30d",
  label: "30 Days"
}, {
  key: "90d",
  label: "90 Days"
}, {
  key: "12m",
  label: "12 Months"
}];
const DONUT_COLORS = ["#c8546f", "#e5a3b3", "#8a3b52", "#f0c9d2", "#a06a10", "#6a3d9e", "#2a5f9e"];
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
function DashboardHome() {
  const initial = Route.useLoaderData();
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardMetricsFn({
      data: {
        range
      }
    }).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [range]);
  const cards = [{
    label: "Total Revenue",
    value: formatPeso(data.totalRevenue),
    icon: Wallet
  }, {
    label: "Total COGS",
    value: formatPeso(data.totalCogs),
    icon: Wallet
  }, {
    label: "Gross Profit",
    value: formatPeso(data.grossProfit),
    icon: TrendingUp
  }, {
    label: "Total Expenses",
    value: formatPeso(data.totalExpenses),
    icon: TrendingDown
  }, {
    label: "Net Profit",
    value: formatPeso(data.netProfit),
    icon: data.netProfit >= 0 ? TrendingUp : TrendingDown
  }, {
    label: "Inventory Value",
    value: formatPeso(data.inventoryValue),
    icon: Wallet
  }, {
    label: "Total Orders",
    value: String(data.totalOrders),
    icon: Clock
  }, {
    label: "Pending Deliveries",
    value: String(data.pendingDeliveries),
    icon: Clock
  }];
  const maxTrend = Math.max(1, ...data.salesTrend.map((d) => d.revenue));
  const totalExpense = data.expenseBreakdown.reduce((sum, e) => sum + e.amount, 0) || 1;
  let cumulative = 0;
  const donutStops = data.expenseBreakdown.map((entry, i) => {
    const start = cumulative / totalExpense * 360;
    cumulative += entry.amount;
    const end = cumulative / totalExpense * 360;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}deg ${end}deg`;
  });
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", style: {
    opacity: loading ? 0.7 : 1
  }, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-toolbar", children: [
      /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Dashboard" }),
      /* @__PURE__ */ jsx("div", { className: "dash-range-tabs", children: RANGES.map((r) => /* @__PURE__ */ jsx("button", { type: "button", className: `dash-range-tab ${range === r.key ? "is-active" : ""}`, onClick: () => setRange(r.key), children: r.label }, r.key)) })
    ] }),
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
    /* @__PURE__ */ jsx("div", { className: "dash-cards dash-cards--secondary", children: /* @__PURE__ */ jsxs("div", { className: "dash-card dash-card--warn", children: [
      /* @__PURE__ */ jsx("div", { className: "dash-card__icon", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 18 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: "Low Stock Alerts" }),
        /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: data.lowStock.count })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "dash-chart-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-chart-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Sales Trend" }),
        data.salesTrend.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No sales in this range." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "dash-bar-chart", children: data.salesTrend.map((d) => /* @__PURE__ */ jsxs("div", { className: "dash-bar-chart__col", children: [
            /* @__PURE__ */ jsx("div", { className: "dash-bar-chart__bar dash-bar-chart__bar--profit", style: {
              height: `${Math.max(2, Math.max(0, d.profit) / maxTrend * 100)}%`
            }, title: `Profit: ${formatPeso(d.profit)}` }),
            /* @__PURE__ */ jsx("div", { className: "dash-bar-chart__bar", style: {
              height: `${Math.max(2, d.revenue / maxTrend * 100)}%`
            }, title: `Revenue: ${formatPeso(d.revenue)}` }),
            /* @__PURE__ */ jsx("span", { className: "dash-bar-chart__label", children: new Date(d.date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric"
            }) })
          ] }, d.date)) }),
          /* @__PURE__ */ jsxs("div", { className: "dash-bar-chart__legend", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("i", { className: "dash-bar-chart__swatch", style: {
                background: "var(--pink)"
              } }),
              " Revenue"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx("i", { className: "dash-bar-chart__swatch", style: {
                background: "var(--deep-pink)"
              } }),
              " Profit"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-chart-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Top Products" }),
        data.topProducts.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No sales yet." }) : /* @__PURE__ */ jsx("div", { className: "dash-top-products", children: data.topProducts.map((p, i) => /* @__PURE__ */ jsxs("div", { className: "dash-top-product", children: [
          /* @__PURE__ */ jsx("span", { className: "dash-top-product__rank", children: i + 1 }),
          /* @__PURE__ */ jsx("span", { className: "dash-top-product__name", children: p.name }),
          /* @__PURE__ */ jsxs("span", { className: "dash-top-product__meta", children: [
            p.unitsSold,
            " sold · ",
            formatPeso(p.profit),
            " profit"
          ] })
        ] }, p.productId ?? p.name)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-chart-grid", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-chart-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Expense Breakdown" }),
        data.expenseBreakdown.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No expenses recorded in this range." }) : /* @__PURE__ */ jsxs("div", { className: "dash-donut", children: [
          /* @__PURE__ */ jsx("div", { className: "dash-donut__ring", style: {
            background: `conic-gradient(${donutStops.join(", ")})`
          } }),
          /* @__PURE__ */ jsx("ul", { className: "dash-donut__legend", children: data.expenseBreakdown.map((entry, i) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsxs("span", { className: "dash-donut__legend-label", children: [
              /* @__PURE__ */ jsx("i", { className: "dash-donut__swatch", style: {
                background: DONUT_COLORS[i % DONUT_COLORS.length]
              } }),
              entry.category
            ] }),
            /* @__PURE__ */ jsx("span", { children: formatPeso(entry.amount) })
          ] }, entry.category)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-chart-panel", children: [
        /* @__PURE__ */ jsx("h2", { children: "Low Stock Items" }),
        data.lowStock.items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "Everything is well stocked." }) : /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", style: {
          border: "none"
        }, children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { children: "Product" }),
            /* @__PURE__ */ jsx("th", { children: "Stock" }),
            /* @__PURE__ */ jsx("th", { children: "Reorder Level" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: data.lowStock.items.map((item) => /* @__PURE__ */ jsxs("tr", { className: "dash-row-warn", children: [
            /* @__PURE__ */ jsx("td", { children: item.name }),
            /* @__PURE__ */ jsx("td", { children: item.stock_quantity }),
            /* @__PURE__ */ jsx("td", { children: item.reorder_level })
          ] }, item.id)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  DashboardHome as component
};
