import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Plus, X, Trash2, PackageCheck } from "lucide-react";
import { useState, useMemo } from "react";
import { G as Route, H as createPurchaseOrderFn, I as updatePurchaseOrderStatusFn, J as receivePurchaseOrderFn } from "./router-B6tvQDP-.js";
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
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
const FILTERS = [{
  key: "all",
  label: "All"
}, {
  key: "pending",
  label: "Pending"
}, {
  key: "in_transit",
  label: "In Transit"
}, {
  key: "received",
  label: "Received"
}, {
  key: "cancelled",
  label: "Cancelled"
}];
function IncomingStockPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [viewingPo, setViewingPo] = useState(null);
  const visible = useMemo(() => filter === "all" ? data.purchaseOrders : data.purchaseOrders.filter((po) => po.status === filter), [data.purchaseOrders, filter]);
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-inv-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "dash-page__title", style: {
          marginBottom: 4
        }, children: "Incoming Stock" }),
        /* @__PURE__ */ jsx("p", { children: "Track purchase orders and receive deliveries into inventory" })
      ] }),
      /* @__PURE__ */ jsxs("button", { className: "button button--dark", onClick: () => setShowCreate(true), children: [
        /* @__PURE__ */ jsx(Plus, { size: 14 }),
        " New Purchase Order"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dash-range-tabs", style: {
      marginBottom: "var(--space-lg)",
      width: "fit-content"
    }, children: FILTERS.map((f) => /* @__PURE__ */ jsx("button", { type: "button", className: `dash-range-tab ${filter === f.key ? "is-active" : ""}`, onClick: () => setFilter(f.key), children: f.label }, f.key)) }),
    /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Supplier" }),
        /* @__PURE__ */ jsx("th", { children: "Items" }),
        /* @__PURE__ */ jsx("th", { children: "Expected Date" }),
        /* @__PURE__ */ jsx("th", { children: "Total Cost" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        visible.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "dash-table__empty", children: "No purchase orders yet." }) }),
        visible.map((po) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: po.supplier?.name ?? "—" }),
          /* @__PURE__ */ jsxs("td", { children: [
            po.items.length,
            " item",
            po.items.length === 1 ? "" : "s"
          ] }),
          /* @__PURE__ */ jsx("td", { children: po.expected_date ? new Date(po.expected_date).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
          }) : "—" }),
          /* @__PURE__ */ jsx("td", { children: formatPeso(po.total_cost) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${po.status}`, children: po.status.replace("_", " ") }) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("a", { href: "#", className: "dash-view-link", onClick: (e) => {
            e.preventDefault();
            setViewingPo(po);
          }, children: "View →" }) })
        ] }, po.id))
      ] })
    ] }) }),
    showCreate && /* @__PURE__ */ jsx(CreatePurchaseOrderModal, { suppliers: data.suppliers, products: data.products, onClose: () => setShowCreate(false), onSaved: async () => {
      setShowCreate(false);
      await router.invalidate();
    } }),
    viewingPo && /* @__PURE__ */ jsx(PurchaseOrderModal, { po: viewingPo, onClose: () => setViewingPo(null), onChanged: async (updated) => {
      setViewingPo(updated);
      await router.invalidate();
    } })
  ] });
}
function CreatePurchaseOrderModal({
  suppliers,
  products,
  onClose,
  onSaved
}) {
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [handlingFee, setHandlingFee] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const addItem = () => {
    if (products.length === 0) return;
    setItems([...items, {
      product_id: products[0].id,
      quantity_ordered: 1,
      unit_cost: products[0].cost_price
    }]);
  };
  const total = items.reduce((s, i) => s + i.quantity_ordered * i.unit_cost, 0) + handlingFee + shippingFee;
  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0 || !supplierId) return;
    setSaving(true);
    await createPurchaseOrderFn({
      data: {
        supplier_id: supplierId,
        expected_date: expectedDate || null,
        handling_fee: handlingFee,
        shipping_fee: shippingFee,
        notes: notes || void 0,
        items
      }
    });
    onSaved();
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "New Purchase Order" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Supplier *" }),
          /* @__PURE__ */ jsxs("select", { required: true, value: supplierId, onChange: (e) => setSupplierId(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Select supplier" }),
            suppliers.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Expected delivery date" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: expectedDate, onChange: (e) => setExpectedDate(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Handling fee" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", placeholder: "0.00", value: handlingFee || "", onChange: (e) => setHandlingFee(Number(e.target.value)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Shipping fee" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", placeholder: "0.00", value: shippingFee || "", onChange: (e) => setShippingFee(Number(e.target.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-inv-filters", style: {
        justifyContent: "space-between",
        marginTop: "var(--space-sm)"
      }, children: [
        /* @__PURE__ */ jsx("span", { style: {
          fontWeight: 600,
          fontSize: 14,
          color: "var(--ink)"
        }, children: "Items" }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: "dash-link-btn", onClick: addItem, children: [
          /* @__PURE__ */ jsx(Plus, { size: 13 }),
          " Add item"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-line-items", children: [
        items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "dash-line-item", children: [
          /* @__PURE__ */ jsx("select", { value: item.product_id, onChange: (e) => {
            const next = [...items];
            next[i] = {
              ...item,
              product_id: e.target.value
            };
            setItems(next);
          }, children: products.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 1, placeholder: "Qty", value: item.quantity_ordered, onChange: (e) => {
            const next = [...items];
            next[i] = {
              ...item,
              quantity_ordered: Number(e.target.value)
            };
            setItems(next);
          } }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", placeholder: "Unit cost", value: item.unit_cost, onChange: (e) => {
            const next = [...items];
            next[i] = {
              ...item,
              unit_cost: Number(e.target.value)
            };
            setItems(next);
          } }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "dash-line-item__remove", onClick: () => setItems(items.filter((_, idx) => idx !== i)), children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
        ] }, i)),
        items.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-empty-state", style: {
          padding: "var(--space-md)"
        }, children: "No items yet — add at least one." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Notes" }),
        /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-financials", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Handling fee" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(handlingFee) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Shipping fee" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(shippingFee) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-financials__total", children: [
          /* @__PURE__ */ jsx("span", { children: "Estimated total" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(total) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving || items.length === 0 || !supplierId, children: saving ? "Creating…" : "Create order" })
    ] })
  ] }) });
}
function PurchaseOrderModal({
  po,
  onClose,
  onChanged
}) {
  const [status, setStatus] = useState(po.status === "received" ? "in_transit" : po.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [quantities, setQuantities] = useState(Object.fromEntries(po.items.map((i) => [i.id, Math.max(0, i.quantity_ordered - i.quantity_received)])));
  const editable = po.status === "pending" || po.status === "in_transit";
  const saveStatus = async () => {
    setSavingStatus(true);
    const updated = await updatePurchaseOrderStatusFn({
      data: {
        id: po.id,
        status
      }
    });
    setSavingStatus(false);
    onChanged(updated);
  };
  const markReceived = async () => {
    setReceiving(true);
    const updated = await receivePurchaseOrderFn({
      data: {
        purchaseOrderId: po.id,
        items: Object.entries(quantities).filter(([, qty]) => qty > 0).map(([purchaseOrderItemId, quantityReceivedNow]) => ({
          purchaseOrderItemId,
          quantityReceivedNow
        }))
      }
    });
    setReceiving(false);
    onChanged(updated);
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        "Purchase Order — ",
        po.supplier?.name ?? "Unknown supplier"
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-po-top", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-po-top__left", children: [
          /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--${po.status}`, children: po.status.replace("_", " ") }),
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: po.expected_date ? `Expected ${new Date(po.expected_date).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}` : "No expected date" })
        ] }),
        editable && /* @__PURE__ */ jsxs("div", { className: "dash-po-top__right", children: [
          /* @__PURE__ */ jsxs("label", { className: "dash-field", style: {
            gap: 4
          }, children: [
            /* @__PURE__ */ jsx("span", { children: "Status" }),
            /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), children: [
              /* @__PURE__ */ jsx("option", { value: "pending", children: "Pending" }),
              /* @__PURE__ */ jsx("option", { value: "in_transit", children: "In Transit" }),
              /* @__PURE__ */ jsx("option", { value: "cancelled", children: "Cancelled" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: saveStatus, disabled: savingStatus || status === po.status, children: savingStatus ? "Saving…" : "Save changes" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", style: {
        border: "none"
      }, children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Product" }),
          /* @__PURE__ */ jsx("th", { children: "Ordered" }),
          /* @__PURE__ */ jsx("th", { children: "Received" }),
          /* @__PURE__ */ jsx("th", { children: "Unit Cost" }),
          /* @__PURE__ */ jsx("th", { children: "Line Total" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: po.items.map((item) => {
          const remaining = item.quantity_ordered - item.quantity_received;
          return /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: item.product?.name ?? "Product" }),
            /* @__PURE__ */ jsx("td", { children: item.quantity_ordered }),
            /* @__PURE__ */ jsxs("td", { children: [
              editable && remaining > 0 ? /* @__PURE__ */ jsx("input", { type: "number", className: "dash-inline-input", min: 0, max: remaining, value: quantities[item.id] ?? 0, onChange: (e) => setQuantities({
                ...quantities,
                [item.id]: Math.min(remaining, Number(e.target.value))
              }) }) : item.quantity_received,
              /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                " / ",
                item.quantity_ordered
              ] })
            ] }),
            /* @__PURE__ */ jsx("td", { children: formatPeso(item.unit_cost) }),
            /* @__PURE__ */ jsx("td", { children: formatPeso(item.unit_cost * item.quantity_ordered) })
          ] }, item.id);
        }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "dash-financials", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Handling fee" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(po.handling_fee) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Shipping fee" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(po.shipping_fee) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-financials__total", children: [
          /* @__PURE__ */ jsx("span", { children: "Current total" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(po.total_cost) })
        ] })
      ] })
    ] }),
    editable && /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", style: {
      justifyContent: "space-between",
      alignItems: "center"
    }, children: [
      /* @__PURE__ */ jsx("p", { className: "dash-muted", style: {
        maxWidth: 380
      }, children: "Marking as received automatically adds these quantities to inventory and updates cost pricing — no manual stock entry needed." }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--dark", onClick: markReceived, disabled: receiving, children: [
        /* @__PURE__ */ jsx(PackageCheck, { size: 14 }),
        " ",
        receiving ? "Receiving…" : "Mark as Received"
      ] })
    ] })
  ] }) });
}
export {
  IncomingStockPage as component
};
