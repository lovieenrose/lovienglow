import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { f as Route, g as updateInventoryFn } from "./router-DtENt4eu.js";
import "./products-DjF4Usiw.js";
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
function stockStatus(row) {
  if (row.stock === 0) return {
    label: "Out of Stock",
    className: "dash-badge--rejected"
  };
  if (row.stock <= row.low_stock_threshold) return {
    label: "Low Stock",
    className: "dash-badge--pending"
  };
  return {
    label: "In Stock",
    className: "dash-badge--confirmed"
  };
}
function InventoryRowItem({
  row
}) {
  const router = useRouter();
  const [stock, setStock] = useState(row.stock);
  const [threshold, setThreshold] = useState(row.low_stock_threshold);
  const [saving, setSaving] = useState(false);
  const status = stockStatus({
    ...row,
    stock,
    low_stock_threshold: threshold
  });
  const dirty = stock !== row.stock || threshold !== row.low_stock_threshold;
  const percent = Math.min(100, Math.round(stock / Math.max(1, threshold * 4) * 100));
  const save = async () => {
    setSaving(true);
    await updateInventoryFn({
      data: {
        productId: row.product_id,
        stock,
        lowStockThreshold: threshold
      }
    });
    await router.invalidate();
    setSaving(false);
  };
  return /* @__PURE__ */ jsxs("tr", { children: [
    /* @__PURE__ */ jsx("td", { children: row.product_name }),
    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { type: "number", className: "dash-inline-input", value: stock, min: 0, onChange: (event) => setStock(Number(event.target.value)) }) }),
    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("input", { type: "number", className: "dash-inline-input", value: threshold, min: 0, onChange: (event) => setThreshold(Number(event.target.value)) }) }),
    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge ${status.className}`, children: status.label }) }),
    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("div", { className: "dash-stock-bar", children: /* @__PURE__ */ jsx("div", { className: "dash-stock-bar__fill", style: {
      width: `${percent}%`
    } }) }) }),
    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("button", { className: "button button--outline", onClick: save, disabled: !dirty || saving, children: [
      /* @__PURE__ */ jsx(Save, { size: 13 }),
      " ",
      saving ? "Saving…" : "Save"
    ] }) })
  ] });
}
function InventoryPage() {
  const rows = Route.useLoaderData();
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Inventory" }),
    /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Product" }),
        /* @__PURE__ */ jsx("th", { children: "Stock" }),
        /* @__PURE__ */ jsx("th", { children: "Low Stock Threshold" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Level" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: rows.map((row) => /* @__PURE__ */ jsx(InventoryRowItem, { row }, row.product_id)) })
    ] }) })
  ] });
}
export {
  InventoryPage as component
};
