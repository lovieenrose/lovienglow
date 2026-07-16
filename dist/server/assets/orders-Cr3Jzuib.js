import { jsx, jsxs } from "react/jsx-runtime";
import { useMatches, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { Download, Search, Copy } from "lucide-react";
import { useState, useMemo } from "react";
import { c as couriers, f as formatPrice } from "./shipping-B_aQucIA.js";
import { v as Route, w as exportOrdersCsvFn } from "./router-CZa_PGzA.js";
import { o as orderStatusLabels, a as orderStatusBadgeClass } from "./statusLabels-CPAV1ZKD.js";
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
const ORDER_STATUS_OPTIONS = ["pending_payment", "processing", "shipped", "delivered", "cancelled"];
function OrdersPage() {
  const matches = useMatches();
  const hasChildRoute = matches.some((m) => m.routeId === "/dashboard/orders/$ref");
  if (hasChildRoute) return /* @__PURE__ */ jsx(Outlet, {});
  return /* @__PURE__ */ jsx(OrdersListView, {});
}
function OrdersListView() {
  const search = Route.useSearch();
  const page = search.page ?? 1;
  const navigate = useNavigate({
    from: Route.fullPath
  });
  const data = Route.useLoaderData();
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [copiedRef, setCopiedRef] = useState(null);
  const sortedOrders = useMemo(() => {
    const rows = [...data.orders];
    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "total") return (a.total - b.total) * dir;
      if (sortKey === "reference") return a.reference.localeCompare(b.reference) * dir;
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    });
    return rows;
  }, [data.orders, sortKey, sortDir]);
  const updateSearch = (patch) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...patch,
        page: patch.page ?? 1
      })
    });
  };
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const copyTrackingCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopiedRef(code);
    setTimeout(() => setCopiedRef(null), 1500);
  };
  const handleExport = async () => {
    const csv = await exportOrdersCsvFn({
      data: {
        search: search.search || void 0,
        orderStatus: search.orderStatus || void 0,
        courier: search.courier || void 0
      }
    });
    const blob = new Blob([csv], {
      type: "text/csv"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lovienglow-orders-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-page__header", children: [
      /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Orders" }),
      /* @__PURE__ */ jsxs("button", { className: "button button--outline dash-export-btn", onClick: handleExport, children: [
        /* @__PURE__ */ jsx(Download, { size: 14 }),
        " Export CSV"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-filters", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-search-field", children: [
        /* @__PURE__ */ jsx(Search, { size: 14 }),
        /* @__PURE__ */ jsx("input", { placeholder: "Search reference, tracking code, name, phone, email…", defaultValue: search.search ?? "", onChange: (event) => updateSearch({
          search: event.target.value
        }) })
      ] }),
      /* @__PURE__ */ jsxs("select", { value: search.orderStatus ?? "", onChange: (event) => updateSearch({
        orderStatus: event.target.value
      }), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All Statuses" }),
        ORDER_STATUS_OPTIONS.map((status) => /* @__PURE__ */ jsx("option", { value: status, children: orderStatusLabels[status] }, status))
      ] }),
      /* @__PURE__ */ jsxs("select", { value: search.courier ?? "", onChange: (event) => updateSearch({
        courier: event.target.value
      }), children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "All Couriers" }),
        couriers.map((courier) => /* @__PURE__ */ jsx("option", { value: courier.id, children: courier.label }, courier.id))
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "is-sortable", onClick: () => toggleSort("reference"), children: "Reference" }),
        /* @__PURE__ */ jsx("th", { children: "Tracking Code" }),
        /* @__PURE__ */ jsx("th", { children: "Customer" }),
        /* @__PURE__ */ jsx("th", { className: "is-sortable", onClick: () => toggleSort("total"), children: "Total" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Courier" }),
        /* @__PURE__ */ jsx("th", { className: "is-sortable", onClick: () => toggleSort("created_at"), children: "Placed" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        sortedOrders.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "dash-table__empty", children: "No orders match your filters." }) }),
        sortedOrders.map((order) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(Link, { to: "/dashboard/orders/$ref", params: {
            ref: order.reference
          }, children: order.reference }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "dash-tracking-code-cell", children: [
            order.tracking_code,
            /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Copy tracking code", onClick: () => copyTrackingCode(order.tracking_code), children: /* @__PURE__ */ jsx(Copy, { size: 12 }) }),
            copiedRef === order.tracking_code && /* @__PURE__ */ jsx("span", { className: "dash-copied-hint", children: "Copied" })
          ] }) }),
          /* @__PURE__ */ jsx("td", { children: order.full_name }),
          /* @__PURE__ */ jsx("td", { children: formatPrice(order.total) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge ${orderStatusBadgeClass[order.order_status]}`, children: orderStatusLabels[order.order_status] }) }),
          /* @__PURE__ */ jsx("td", { children: order.courier === "lalamove" ? "Lalamove" : "J&T Express" }),
          /* @__PURE__ */ jsx("td", { children: new Date(order.placed_at).toLocaleDateString("en-PH") })
        ] }, order.id))
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "dash-pagination", children: [
      /* @__PURE__ */ jsx("button", { className: "button button--outline", disabled: page <= 1, onClick: () => updateSearch({
        page: page - 1
      }), children: "Previous" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Page ",
        page,
        " of ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx("button", { className: "button button--outline", disabled: page >= totalPages, onClick: () => updateSearch({
        page: page + 1
      }), children: "Next" })
    ] })
  ] });
}
export {
  OrdersPage as component
};
