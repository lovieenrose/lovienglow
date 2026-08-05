import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { X, Download, Image, FileCheck, Pencil, Trash2, Plus, Search, ChevronUp, ChevronDown, ShoppingCart } from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import { f as formatPeso$1, d as uploadPaymentProofFn, m as markSalePaidFn, e as updateSaleInvoiceItemsFn, h as updateSaleInvoiceTitleFn, i as updateSaleInvoiceDiscountFn, j as deleteProductSetFn, r as reorderProductSetsFn, k as updatePromoFn, l as createPromoFn, n as deletePromoFn, p as Route, q as completeSaleFn, s as createExpenseFn, t as reverseSaleFn, v as deleteSalesOrderFn } from "./router-2rQkfpAr.js";
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
function OfficialReceiptModal({
  order,
  businessProfile,
  onClose
}) {
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const downloadPng = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    setError("");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = `${order.receipt_number ?? order.order_number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setError("Could not generate PNG.");
    } finally {
      setDownloading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--invoice", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "DIGITAL RECIEPT" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body dash-invoice-layout", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview", ref: receiptRef, children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__head", children: [
          /* @__PURE__ */ jsx("h3", { children: businessProfile?.business_name || "DIGITAL RECIEPT" }),
          /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__meta", children: [
            /* @__PURE__ */ jsx("b", { children: "DIGITAL RECIEPT" }),
            /* @__PURE__ */ jsx("span", { children: order.receipt_number ?? "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__info", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Date Paid" }),
            /* @__PURE__ */ jsx("br", {}),
            order.paid_at ? new Date(order.paid_at).toLocaleString("en-PH") : "—"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Received From" }),
            /* @__PURE__ */ jsx("br", {}),
            order.customer_name || "Walk-in"
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Payment Method" }),
            /* @__PURE__ */ jsx("br", {}),
            order.payment_method
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Order Reference" }),
            /* @__PURE__ */ jsx("br", {}),
            order.order_number
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-receipt-amount", children: [
          /* @__PURE__ */ jsx("span", { children: "Amount Received" }),
          /* @__PURE__ */ jsx("b", { children: formatPeso$1(order.total) })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "dash-invoice-preview__note", children: [
          "Payment received in full for Order ",
          order.order_number,
          ". Thank you so much for your purchase! I’m truly grateful for your trust and support. Until next time! :D"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-invoice-side", children: [
        /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide", onClick: downloadPng, disabled: downloading, children: [
          /* @__PURE__ */ jsx(Download, { size: 14 }),
          " ",
          downloading ? "Generating…" : "Download Digital Reciept (PNG)"
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
      ] })
    ] })
  ] }) });
}
function itemizedDefault(order) {
  return (order.items ?? []).map((item) => ({
    label: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price
  }));
}
function InvoiceItemsEditor({ order, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(order.invoice_items ?? itemizedDefault(order));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isCustomized = Boolean(order.invoice_items && order.invoice_items.length > 0);
  const startEditing = () => {
    setDraft(isCustomized ? order.invoice_items : itemizedDefault(order));
    setError("");
    setEditing(true);
  };
  const addLine = () => setDraft((prev) => [...prev, { label: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (i) => setDraft((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, patch) => setDraft((prev) => prev.map((line, idx) => idx === i ? { ...line, ...patch } : line));
  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const cleaned = draft.filter((line) => line.label.trim().length > 0);
      const updated = await updateSaleInvoiceItemsFn({ data: { id: order.id, invoiceItems: cleaned } });
      onSaved(updated);
      setEditing(false);
    } catch {
      setError("Could not save invoice items.");
    } finally {
      setSaving(false);
    }
  };
  const resetToItemized = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateSaleInvoiceItemsFn({ data: { id: order.id, invoiceItems: null } });
      onSaved(updated);
      setDraft(itemizedDefault(updated));
      setEditing(false);
    } catch {
      setError("Could not reset invoice items.");
    } finally {
      setSaving(false);
    }
  };
  if (!editing) {
    return /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
      /* @__PURE__ */ jsx("span", { children: "Invoice Items" }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--outline button--wide", onClick: startEditing, children: [
        /* @__PURE__ */ jsx(Pencil, { size: 14 }),
        " Customize Invoice Items"
      ] }),
      isCustomized && /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Showing a customized invoice — your real per-item sale record is unaffected." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "dash-field dash-invoice-editor", children: [
    /* @__PURE__ */ jsx("span", { children: "Customize Invoice Items" }),
    /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: `Replace the itemized breakdown with whatever you want printed (e.g. one "TR15 Complete Set" line instead of every component). This only changes what's shown on the invoice — your real sales/COGS data is unaffected.` }),
    draft.map((line, i) => /* @__PURE__ */ jsxs("div", { className: "dash-invoice-editor__row", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          placeholder: "Item label",
          value: line.label,
          onChange: (e) => updateLine(i, { label: e.target.value })
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          placeholder: "Qty",
          value: line.quantity,
          onChange: (e) => updateLine(i, { quantity: Number(e.target.value) })
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          step: "0.01",
          placeholder: "Unit price",
          value: line.unit_price,
          onChange: (e) => updateLine(i, { unit_price: Number(e.target.value) })
        }
      ),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-line-item__remove", onClick: () => removeLine(i), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
    ] }, i)),
    /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--outline", onClick: addLine, children: [
      /* @__PURE__ */ jsx(Plus, { size: 13 }),
      " Add Line"
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
    /* @__PURE__ */ jsxs("div", { className: "dash-invoice-editor__actions", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: () => setEditing(false), disabled: saving, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: resetToItemized, disabled: saving, children: "Reset to itemized" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "button button--dark",
          onClick: save,
          disabled: saving || draft.every((l) => !l.label.trim()),
          children: saving ? "Saving…" : "Save"
        }
      )
    ] })
  ] });
}
function InvoiceTitleEditor({
  order,
  defaultTitle,
  onSaved
}) {
  const [title, setTitle] = useState(order.invoice_title ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const commit = async (value) => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateSaleInvoiceTitleFn({ data: { id: order.id, invoiceTitle: value } });
      onSaved(updated);
    } catch {
      setError("Could not save invoice title.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
    /* @__PURE__ */ jsx("span", { children: "Invoice Title" }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        placeholder: defaultTitle,
        value: title,
        disabled: saving,
        onChange: (e) => setTitle(e.target.value),
        onBlur: () => {
          const trimmed = title.trim();
          if (trimmed !== (order.invoice_title ?? "")) void commit(trimmed || null);
        }
      }
    ),
    /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: 'Defaults to your business name — override it for an occasional co-branded sale (e.g. "LOVIE X PINC").' }),
    order.invoice_title && /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "dash-link-btn",
        disabled: saving,
        onClick: () => {
          setTitle("");
          void commit(null);
        },
        children: "Reset to business name"
      }
    ),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
  ] });
}
function InvoiceDiscountEditor({ order, onSaved }) {
  const hasDiscount = order.invoice_discount != null;
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(order.invoice_discount ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const commit = async (value) => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateSaleInvoiceDiscountFn({ data: { id: order.id, invoiceDiscount: value } });
      onSaved(updated);
      setEditing(false);
    } catch {
      setError("Could not save invoice discount.");
    } finally {
      setSaving(false);
    }
  };
  if (!hasDiscount && !editing) {
    return /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
      /* @__PURE__ */ jsx("span", { children: "Invoice Discount" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          className: "button button--outline button--wide",
          onClick: () => {
            setAmount(0);
            setEditing(true);
          },
          children: [
            /* @__PURE__ */ jsx(Plus, { size: 13 }),
            " Add Discount"
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Optional — this is independent of the real discount applied at checkout. It only affects what's printed here." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
    /* @__PURE__ */ jsx("span", { children: "Invoice Discount" }),
    /* @__PURE__ */ jsxs("div", { className: "dash-invoice-editor__row", style: { marginTop: 0 }, children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          min: 0,
          step: "0.01",
          value: amount,
          disabled: saving,
          onChange: (e) => setAmount(Number(e.target.value))
        }
      ),
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--dark", disabled: saving, onClick: () => void commit(amount), children: saving ? "Saving…" : "Save" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "button button--outline",
          disabled: saving,
          onClick: () => {
            if (hasDiscount) void commit(null);
            else setEditing(false);
          },
          children: "Remove"
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
  ] });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const [, base64] = result.split(",");
      resolve({ base64, contentType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const STATUS_LABEL = {
  awaiting_payment: "Awaiting Payment",
  paid: "Paid",
  reversed: "Reversed"
};
function InvoiceModal({
  order,
  businessProfile,
  onClose,
  onChanged
}) {
  const router = useRouter();
  const invoiceRef = useRef(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [marking, setMarking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [error, setError] = useState("");
  const displayItems = order.invoice_items && order.invoice_items.length > 0 ? order.invoice_items : itemizedDefault(order);
  const displaySubtotal = displayItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const displayDiscount = order.invoice_discount ?? order.discount;
  const directCourierShipping = order.courier === "Lalamove (Pay Courier Directly)";
  const freeShippingPromo = !directCourierShipping && order.shipping_paid_by === "business" && order.shipping_fee > 0;
  const displayShippingCharge = !directCourierShipping && !freeShippingPromo ? order.shipping_fee : 0;
  const displayTotal = Math.max(0, displaySubtotal - displayDiscount) + displayShippingCharge;
  const handleProofUpload = async (file) => {
    setUploadingProof(true);
    setError("");
    try {
      const { base64, contentType } = await fileToBase64(file);
      const updated = await uploadPaymentProofFn({ data: { saleId: order.id, filename: file.name, contentType, base64 } });
      onChanged(updated);
      await router.invalidate();
    } catch {
      setError("Could not upload payment receipt.");
    } finally {
      setUploadingProof(false);
    }
  };
  const markPaid = async () => {
    setMarking(true);
    setError("");
    try {
      const updated = await markSalePaidFn({ data: { id: order.id } });
      onChanged(updated);
      await router.invalidate();
    } catch {
      setError("Could not update payment status.");
    } finally {
      setMarking(false);
    }
  };
  const downloadPng = async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(invoiceRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const link = document.createElement("a");
      link.download = `${order.order_number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setError("Could not generate PNG.");
    } finally {
      setDownloading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-modal-overlay", onClick: onClose, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--invoice", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "Order Form / Invoice" }),
          /* @__PURE__ */ jsxs("span", { className: `dash-badge dash-badge--sale-${order.status}`, children: [
            "Status: ",
            STATUS_LABEL[order.status]
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-modal__body dash-invoice-layout", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview", ref: invoiceRef, children: [
          /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__head", children: [
            /* @__PURE__ */ jsx("h3", { children: order.invoice_title || businessProfile?.business_name || "Invoice" }),
            /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__meta", children: [
              /* @__PURE__ */ jsx("b", { children: "INVOICE" }),
              /* @__PURE__ */ jsx("span", { children: order.order_number })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__info", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Invoice Date" }),
              /* @__PURE__ */ jsx("br", {}),
              new Date(order.created_at).toLocaleString("en-PH")
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Customer" }),
              /* @__PURE__ */ jsx("br", {}),
              order.customer_name || "Walk-in"
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Payment Method" }),
              /* @__PURE__ */ jsx("br", {}),
              order.payment_method
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Payment Terms" }),
              /* @__PURE__ */ jsx("br", {}),
              "Payment first before fulfillment"
            ] }),
            order.courier && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Courier" }),
              /* @__PURE__ */ jsx("br", {}),
              order.courier
            ] })
          ] }),
          /* @__PURE__ */ jsxs("table", { className: "dash-invoice-preview__table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "Item" }),
              /* @__PURE__ */ jsx("th", { children: "Qty" }),
              /* @__PURE__ */ jsx("th", { children: "Unit" }),
              /* @__PURE__ */ jsx("th", { children: "Amount" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: displayItems.map((item, i) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { children: item.label }),
              /* @__PURE__ */ jsx("td", { children: item.quantity }),
              /* @__PURE__ */ jsx("td", { children: formatPeso$1(item.unit_price) }),
              /* @__PURE__ */ jsx("td", { children: formatPeso$1(item.quantity * item.unit_price) })
            ] }, i)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__totals", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Subtotal (Products)" }),
              /* @__PURE__ */ jsx("span", { children: formatPeso$1(displaySubtotal) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
              /* @__PURE__ */ jsx("span", { children: directCourierShipping ? "Pay courier directly" : order.shipping_fee <= 0 ? "FREE" : formatPeso$1(order.shipping_fee) })
            ] }),
            freeShippingPromo && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Free Shipping Promo" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "-",
                formatPeso$1(order.shipping_fee)
              ] })
            ] }),
            displayDiscount > 0 && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { children: "Discount" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "-",
                formatPeso$1(displayDiscount)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "dash-invoice-preview__due", children: [
              /* @__PURE__ */ jsx("span", { children: "TOTAL AMOUNT DUE" }),
              /* @__PURE__ */ jsx("span", { children: formatPeso$1(displayTotal) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "dash-invoice-preview__note", children: "Thank you for your order. Please send your payment receipt to complete confirmation." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-invoice-side", children: [
          /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide", onClick: downloadPng, disabled: downloading, children: [
            /* @__PURE__ */ jsx(Download, { size: 14 }),
            " ",
            downloading ? "Generating…" : "Download Invoice (PNG)"
          ] }),
          /* @__PURE__ */ jsx(InvoiceItemsEditor, { order, onSaved: onChanged }),
          /* @__PURE__ */ jsx(InvoiceTitleEditor, { order, defaultTitle: businessProfile?.business_name ?? "Invoice", onSaved: onChanged }),
          /* @__PURE__ */ jsx(InvoiceDiscountEditor, { order, onSaved: onChanged }),
          order.status !== "reversed" && /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
            /* @__PURE__ */ jsx("span", { children: "Payment Proof" }),
            order.receipt_url && /* @__PURE__ */ jsx("img", { src: order.receipt_url, alt: "proof", className: "dash-invoice-side__banner-preview" }),
            /* @__PURE__ */ jsxs("label", { className: "button button--outline button--wide", style: { cursor: "pointer" }, children: [
              /* @__PURE__ */ jsx(Image, { size: 14 }),
              " ",
              uploadingProof ? "Uploading…" : "Upload Payment Receipt",
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  hidden: true,
                  disabled: uploadingProof,
                  onChange: (e) => e.target.files?.[0] && handleProofUpload(e.target.files[0])
                }
              )
            ] })
          ] }),
          error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
          order.status === "awaiting_payment" && /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: markPaid, disabled: marking, children: marking ? "Saving…" : "Mark as Paid" }),
          order.status === "paid" && /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide", onClick: () => setShowReceipt(true), children: [
            /* @__PURE__ */ jsx(FileCheck, { size: 14 }),
            " Download Official Receipt"
          ] })
        ] })
      ] })
    ] }),
    showReceipt && /* @__PURE__ */ jsx(OfficialReceiptModal, { order, businessProfile, onClose: () => setShowReceipt(false) })
  ] });
}
function bySortOrder(sets) {
  return [...sets].sort((a, b) => a.sort_order - b.sort_order);
}
function ManageProductSetsModal({
  productSets,
  onClose,
  onChanged
}) {
  const [filter, setFilter] = useState("");
  const [order, setOrder] = useState(() => bySortOrder(productSets));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    setOrder(bySortOrder(productSets));
  }, [productSets]);
  const isFiltering = filter.trim().length > 0;
  const visible = useMemo(
    () => order.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase())),
    [order, filter]
  );
  const persistOrder = async (next) => {
    setSaving(true);
    setError("");
    try {
      await reorderProductSetsFn({ data: { ids: next.map((s) => s.id) } });
      await onChanged();
    } catch {
      setError("Could not save the new order. Please try again.");
      setOrder(bySortOrder(productSets));
    } finally {
      setSaving(false);
    }
  };
  const move = (id, direction) => {
    if (isFiltering || saving) return;
    const idx = order.findIndex((s) => s.id === id);
    const targetIdx = idx + direction;
    if (idx === -1 || targetIdx < 0 || targetIdx >= order.length) return;
    const next = [...order];
    [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
    setOrder(next);
    void persistOrder(next);
  };
  const remove = async (id) => {
    if (!confirm("Delete this product set?")) return;
    await deleteProductSetFn({ data: { id } });
    await onChanged();
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--sets dash-modal--sets-reorder", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "Manage Product Sets" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsx("p", { className: "dash-muted", style: { marginTop: 0, marginBottom: 12 }, children: "Use the arrows to change the order sets appear in on the Sales / POS grid." }),
      /* @__PURE__ */ jsxs("div", { className: "dash-sets-list-panel__head", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-search-field", style: { flex: 1 }, children: [
          /* @__PURE__ */ jsx(Search, { size: 13 }),
          /* @__PURE__ */ jsx("input", { placeholder: "Filter sets…", value: filter, onChange: (e) => setFilter(e.target.value) })
        ] }),
        saving && /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Saving order…" })
      ] }),
      isFiltering && /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Clear the filter to reorder sets." }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "dash-sets-list-panel dash-sets-list-panel--full", children: [
        visible.map((set) => {
          const idx = order.findIndex((s) => s.id === set.id);
          return /* @__PURE__ */ jsxs("div", { className: "dash-set-row", children: [
            /* @__PURE__ */ jsxs("div", { className: "dash-set-row__reorder", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "dash-icon-btn",
                  title: "Move up",
                  disabled: isFiltering || saving || idx === 0,
                  onClick: () => move(set.id, -1),
                  children: /* @__PURE__ */ jsx(ChevronUp, { size: 13 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "dash-icon-btn",
                  title: "Move down",
                  disabled: isFiltering || saving || idx === order.length - 1,
                  onClick: () => move(set.id, 1),
                  children: /* @__PURE__ */ jsx(ChevronDown, { size: 13 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "dash-set-row__body", children: [
              /* @__PURE__ */ jsx("b", { children: set.name }),
              /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                set.items.length,
                " item(s)"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                "Display order: ",
                idx + 1
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "dash-set-row__actions", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "dash-link-btn dash-link-btn--danger", onClick: () => remove(set.id), children: [
              /* @__PURE__ */ jsx(Trash2, { size: 12 }),
              " Delete"
            ] }) })
          ] }, set.id);
        }),
        visible.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No sets match." })
      ] })
    ] })
  ] }) });
}
function emptyForm() {
  return { id: null, code: "", reward_type: "fixed_discount", reward_value: 0, active: true, trigger_product_ids: [], reward_product_ids: [] };
}
function rewardSummary(promo, products) {
  if (promo.reward_type === "fixed_discount") return `Fixed amount discount: ${formatPeso$1(promo.reward_value)}`;
  if (promo.reward_type === "percent_discount") return `Percent discount: ${promo.reward_value}%`;
  const names = promo.reward_product_ids.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean);
  if (names.length === 0) return "Free item: (no products selected)";
  const [first, ...rest] = names;
  return `Free item: ${first}${rest.length ? ` +${rest.length} more` : ""}`;
}
function triggerSummary(promo, products) {
  const names = promo.trigger_product_ids.map((id) => products.find((p) => p.id === id)?.name).filter(Boolean);
  if (names.length === 0) return "Applies to any cart";
  const [first, ...rest] = names;
  return `Trigger Products: ${first}${rest.length ? ` +${rest.length} more` : ""}`;
}
function PromoManagerModal({
  promos,
  products,
  onClose,
  onChanged
}) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const toggleTrigger = (id) => {
    setForm((f) => ({
      ...f,
      trigger_product_ids: f.trigger_product_ids.includes(id) ? f.trigger_product_ids.filter((x) => x !== id) : [...f.trigger_product_ids, id]
    }));
  };
  const toggleReward = (id) => {
    setForm((f) => ({
      ...f,
      reward_product_ids: f.reward_product_ids.includes(id) ? f.reward_product_ids.filter((x) => x !== id) : [...f.reward_product_ids, id]
    }));
  };
  const startEdit = (promo) => {
    setForm({
      id: promo.id,
      code: promo.code,
      reward_type: promo.reward_type,
      reward_value: promo.reward_value,
      active: promo.active,
      trigger_product_ids: promo.trigger_product_ids,
      reward_product_ids: promo.reward_product_ids
    });
  };
  const remove = async (id) => {
    if (!confirm("Delete this promo?")) return;
    await deletePromoFn({ data: { id } });
    await onChanged();
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        reward_type: form.reward_type,
        reward_value: form.reward_value,
        active: form.active,
        trigger_product_ids: form.trigger_product_ids,
        reward_product_ids: form.reward_product_ids
      };
      if (form.id) {
        await updatePromoFn({ data: { id: form.id, ...payload } });
      } else {
        await createPromoFn({ data: payload });
      }
      await onChanged();
      setForm(emptyForm());
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--promos", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { children: "Promo / Discount Manager" }),
        /* @__PURE__ */ jsx("p", { className: "dash-muted", children: "Lightweight vouchers based on selected inventory products." })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body dash-promo-layout", children: [
      /* @__PURE__ */ jsxs("form", { className: "dash-promo-form", onSubmit: submit, children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Promo Code" }),
          /* @__PURE__ */ jsx("input", { required: true, value: form.code, onChange: (e) => setForm({ ...form, code: e.target.value }), placeholder: "FIRSTDAY" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Trigger Product(s)" }),
          /* @__PURE__ */ jsx("div", { className: "dash-checklist", children: products.map((p) => /* @__PURE__ */ jsxs("label", { className: "dash-checklist__row", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.trigger_product_ids.includes(p.id), onChange: () => toggleTrigger(p.id) }),
            /* @__PURE__ */ jsx("span", { children: p.name }),
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: formatPeso$1(p.selling_price) })
          ] }, p.id)) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Reward" }),
          /* @__PURE__ */ jsxs("select", { value: form.reward_type, onChange: (e) => setForm({ ...form, reward_type: e.target.value }), children: [
            /* @__PURE__ */ jsx("option", { value: "fixed_discount", children: "Fixed amount discount" }),
            /* @__PURE__ */ jsx("option", { value: "percent_discount", children: "Percent discount" }),
            /* @__PURE__ */ jsx("option", { value: "free_item", children: "Free item" })
          ] })
        ] }),
        form.reward_type === "free_item" ? /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Reward Item(s)" }),
          /* @__PURE__ */ jsx("div", { className: "dash-checklist", children: products.map((p) => /* @__PURE__ */ jsxs("label", { className: "dash-checklist__row", children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.reward_product_ids.includes(p.id), onChange: () => toggleReward(p.id) }),
            /* @__PURE__ */ jsx("span", { children: p.name }),
            /* @__PURE__ */ jsx("span", { className: "dash-muted", children: formatPeso$1(p.selling_price) })
          ] }, p.id)) })
        ] }) : /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: form.reward_type === "percent_discount" ? "Percent off (%)" : "Discount amount" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", value: form.reward_value, onChange: (e) => setForm({ ...form, reward_value: Number(e.target.value) }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-checklist__row", style: { padding: "4px 0" }, children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: form.active, onChange: (e) => setForm({ ...form, active: e.target.checked }) }),
          /* @__PURE__ */ jsx("span", { children: "Active" })
        ] }),
        /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark button--wide", disabled: saving, children: saving ? "Saving…" : form.id ? "Save changes" : "Add Promo" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-promo-list", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-promo-list__head", children: [
          /* @__PURE__ */ jsx("h3", { children: "Promo Vouchers" }),
          /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
            promos.length,
            " total"
          ] })
        ] }),
        promos.map((promo) => /* @__PURE__ */ jsxs("div", { className: "dash-promo-card", children: [
          /* @__PURE__ */ jsxs("div", { className: "dash-promo-card__head", children: [
            /* @__PURE__ */ jsx("b", { children: promo.code }),
            /* @__PURE__ */ jsx("span", { className: `dash-badge ${promo.active ? "dash-badge--stock-ok" : "dash-badge--stock-out"}`, children: promo.active ? "Active" : "Inactive" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "dash-muted", children: triggerSummary(promo, products) }),
          /* @__PURE__ */ jsxs("p", { className: "dash-muted", children: [
            "Reward: ",
            rewardSummary(promo, products)
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "dash-promo-card__actions", children: [
            /* @__PURE__ */ jsx("button", { type: "button", className: "dash-icon-btn", onClick: () => startEdit(promo), children: /* @__PURE__ */ jsx(Pencil, { size: 13 }) }),
            /* @__PURE__ */ jsx("button", { type: "button", className: "dash-icon-btn dash-icon-btn--danger", onClick: () => remove(promo.id), children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) })
          ] })
        ] }, promo.id)),
        promos.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No promos yet." })
      ] })
    ] })
  ] }) });
}
function SaleDetailsModal({ order, onClose }) {
  const directCourierShipping = order.courier === "Lalamove (Pay Courier Directly)";
  const freeShippingPromo = !directCourierShipping && order.shipping_paid_by === "business" && order.shipping_fee > 0;
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        "Order ",
        order.order_number
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Status" }),
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--sale-${order.status}`, children: order.status.replace("_", " ") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Customer" }),
          /* @__PURE__ */ jsx("br", {}),
          order.customer_name || "Walk-in"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Payment Method" }),
          /* @__PURE__ */ jsx("br", {}),
          order.payment_method
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Date" }),
          /* @__PURE__ */ jsx("br", {}),
          new Date(order.created_at).toLocaleString("en-PH")
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Courier" }),
          /* @__PURE__ */ jsx("br", {}),
          order.courier || "—"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Shipping Fee" }),
          /* @__PURE__ */ jsx("br", {}),
          directCourierShipping ? "Pay courier directly" : order.shipping_fee > 0 ? `${formatPeso$1(order.shipping_fee)} (${freeShippingPromo ? "free shipping promo" : "added to invoice"})` : "None"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", style: { border: "none" }, children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Product" }),
          /* @__PURE__ */ jsx("th", { children: "Qty" }),
          /* @__PURE__ */ jsx("th", { children: "Unit Cost" }),
          /* @__PURE__ */ jsx("th", { children: "Unit Price" }),
          /* @__PURE__ */ jsx("th", { children: "Line Profit" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: order.items?.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: item.product_name }),
          /* @__PURE__ */ jsx("td", { children: item.quantity }),
          /* @__PURE__ */ jsx("td", { children: formatPeso$1(item.unit_cost) }),
          /* @__PURE__ */ jsx("td", { children: formatPeso$1(item.unit_price) }),
          /* @__PURE__ */ jsx("td", { children: formatPeso$1(item.line_profit) })
        ] }, item.id)) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "dash-financials", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso$1(order.subtotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Discount" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatPeso$1(order.discount)
          ] })
        ] }),
        order.shipping_fee > 0 && !directCourierShipping && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso$1(order.shipping_fee) })
        ] }),
        freeShippingPromo && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Free Shipping Promo" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatPeso$1(order.shipping_fee)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Total Cost (COGS)" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso$1(order.total_cost) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Gross Profit" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso$1(order.gross_profit) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Margin" }),
          /* @__PURE__ */ jsxs("span", { children: [
            order.margin_pct.toFixed(2),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "dash-financials__total", children: [
          /* @__PURE__ */ jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso$1(order.total) })
        ] })
      ] }),
      order.receipt_url && /* @__PURE__ */ jsxs("div", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment Proof" }),
        /* @__PURE__ */ jsx("img", { src: order.receipt_url, alt: "proof", className: "dash-invoice-side__banner-preview" })
      ] })
    ] })
  ] }) });
}
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
const PAYMENT_METHODS = ["Maribank", "GoTyme", "GCash"];
const COURIER_LALAMOVE_DIRECT = "Lalamove (Pay Courier Directly)";
const COURIER_LALAMOVE_INVOICE = "Lalamove (Add to Invoice)";
const COURIER_JNT = "J&T";
const COURIERS = [COURIER_LALAMOVE_DIRECT, COURIER_LALAMOVE_INVOICE, COURIER_JNT];
function localDateTimeParts(date = /* @__PURE__ */ new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`
  };
}
function toOrderTimestamp(orderDate, orderTime) {
  if (!orderDate || !orderTime) return void 0;
  const local = /* @__PURE__ */ new Date(`${orderDate}T${orderTime}:00`);
  return Number.isNaN(local.getTime()) ? void 0 : local.toISOString();
}
function PosPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState("new_sale");
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-inv-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "dash-page__title", style: {
          marginBottom: 4
        }, children: "Sales / POS" }),
        /* @__PURE__ */ jsx("p", { children: "Check out orders and review your sales history" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-toolbar__actions", children: [
        /* @__PURE__ */ jsx("button", { className: `button ${tab === "new_sale" ? "button--dark" : "button--outline"}`, onClick: () => setTab("new_sale"), children: "New Sale" }),
        /* @__PURE__ */ jsx("button", { className: `button ${tab === "history" ? "button--dark" : "button--outline"}`, onClick: () => setTab("history"), children: "History" })
      ] })
    ] }),
    tab === "new_sale" ? /* @__PURE__ */ jsx(NewSaleView, { products: data.products, categories: data.categories, productSets: data.productSets, promos: data.promos, businessProfile: data.businessProfile, onSaleCreated: async () => {
      await router.invalidate();
    } }) : /* @__PURE__ */ jsx(HistoryView, { salesOrders: data.salesOrders, businessProfile: data.businessProfile, onChanged: async () => router.invalidate() })
  ] });
}
function NewSaleView({
  products,
  categories,
  productSets,
  promos,
  businessProfile,
  onSaleCreated
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [setQuery, setSetQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [shippingFee, setShippingFee] = useState(0);
  const [courier, setCourier] = useState("");
  const [shippingPaidBy, setShippingPaidBy] = useState("customer");
  const [freeShippingPromo, setFreeShippingPromo] = useState(false);
  const [orderDate, setOrderDate] = useState(() => localDateTimeParts().date);
  const [orderTime, setOrderTime] = useState(() => localDateTimeParts().time);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [showManageSets, setShowManageSets] = useState(false);
  const [showPromoManager, setShowPromoManager] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (search) {
        const term = search.toLowerCase();
        if (!p.name.toLowerCase().includes(term) && !(p.sku ?? "").toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [products, search, categoryId]);
  useEffect(() => {
    setProductPage(1);
  }, [search, categoryId]);
  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const pagedProducts = useMemo(() => filteredProducts.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE), [filteredProducts, productPage]);
  const filteredSets = useMemo(() => productSets.filter((s) => s.name.toLowerCase().includes(setQuery.toLowerCase())), [productSets, setQuery]);
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id && !l.isFreeReward);
      if (existing) {
        const nextQty = Math.min(product.stock_quantity, existing.quantity + quantity);
        return prev.map((l) => l === existing ? {
          ...l,
          quantity: nextQty
        } : l);
      }
      if (product.stock_quantity <= 0) return prev;
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: product.selling_price,
        costPrice: product.cost_price,
        quantity: Math.min(product.stock_quantity, quantity),
        maxStock: product.stock_quantity
      }];
    });
  };
  const addSet = (set) => {
    for (const item of set.items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) addToCart(product, item.quantity);
    }
  };
  const updateQty = (index, delta) => {
    setCart((prev) => prev.map((l, i) => i === index ? {
      ...l,
      quantity: Math.max(0, Math.min(l.maxStock, l.quantity + delta))
    } : l).filter((l) => l.quantity > 0));
  };
  const updatePrice = (index, price) => {
    setCart((prev) => prev.map((l, i) => i === index ? {
      ...l,
      unitPrice: Math.max(0, price)
    } : l));
  };
  const removeLine = (index) => setCart((prev) => prev.filter((_, i) => i !== index));
  const applyPromo = () => {
    setError("");
    const match = promos.find((p) => p.active && p.code.toLowerCase() === promoCode.trim().toLowerCase());
    if (!match) {
      setAppliedPromo(null);
      if (promoCode.trim()) setError("Promo code not found.");
      return;
    }
    setAppliedPromo(match);
    if (match.reward_type === "free_item") {
      const eligible = match.reward_product_ids.map((id) => products.find((p) => p.id === id)).find((p) => p && p.stock_quantity > 0);
      if (eligible && !cart.some((l) => l.isFreeReward && l.productId === eligible.id)) {
        setCart((prev) => [...prev, {
          productId: eligible.id,
          name: `${eligible.name} (Free — ${match.code})`,
          sku: eligible.sku,
          unitPrice: 0,
          costPrice: eligible.cost_price,
          quantity: 1,
          maxStock: eligible.stock_quantity,
          isFreeReward: true
        }]);
      }
    }
  };
  const cartHasTrigger = appliedPromo ? appliedPromo.trigger_product_ids.length === 0 || cart.some((l) => appliedPromo.trigger_product_ids.includes(l.productId)) : false;
  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const cogs = cart.reduce((s, l) => s + l.costPrice * l.quantity, 0);
  const discount = useMemo(() => {
    if (!appliedPromo || !cartHasTrigger) return 0;
    if (appliedPromo.reward_type === "fixed_discount") return Math.min(subtotal, appliedPromo.reward_value);
    if (appliedPromo.reward_type === "percent_discount") return subtotal * (appliedPromo.reward_value / 100);
    return 0;
  }, [appliedPromo, cartHasTrigger, subtotal]);
  const paysCourierDirectly = courier === COURIER_LALAMOVE_DIRECT;
  const shippingCharge = !paysCourierDirectly && !freeShippingPromo ? shippingFee : 0;
  const shippingPromoDiscount = !paysCourierDirectly && freeShippingPromo ? shippingFee : 0;
  const total = Math.max(0, subtotal - discount) + shippingCharge;
  const grossProfit = total - cogs;
  const marginPct = total > 0 ? grossProfit / total * 100 : 0;
  const checkout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setError("");
    try {
      const order = await completeSaleFn({
        data: {
          customerName: customerName || void 0,
          paymentMethod,
          discount,
          shippingFee,
          courier: courier || void 0,
          shippingPaidBy: freeShippingPromo ? "business" : shippingPaidBy,
          orderCreatedAt: toOrderTimestamp(orderDate, orderTime),
          items: cart.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice
          }))
        }
      });
      if (!paysCourierDirectly && shippingFee > 0) {
        try {
          await createExpenseFn({
            data: {
              category: "Shipping",
              description: `${freeShippingPromo ? "Free shipping promo" : "Shipping courier expense"} for order ${order.order_number}${courier ? ` (${courier})` : ""}`,
              amount: shippingFee,
              expense_date: orderDate
            }
          });
        } catch {
        }
      }
      setInvoiceOrder(order);
      setCart([]);
      setShippingFee(0);
      setCourier("");
      setShippingPaidBy("customer");
      setFreeShippingPromo(false);
      const nowParts = localDateTimeParts();
      setOrderDate(nowParts.date);
      setOrderTime(nowParts.time);
      setPromoCode("");
      setAppliedPromo(null);
      setCustomerName("");
      await onSaleCreated();
    } catch {
      setError("Checkout failed — check stock availability and try again.");
    } finally {
      setCheckingOut(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "pos-layout", children: [
    /* @__PURE__ */ jsxs("div", { className: "pos-catalog", children: [
      /* @__PURE__ */ jsxs("div", { className: "pos-sets-panel", children: [
        /* @__PURE__ */ jsxs("div", { className: "pos-sets-panel__header", children: [
          /* @__PURE__ */ jsxs("div", { className: "dash-search-field", style: {
            flex: 1
          }, children: [
            /* @__PURE__ */ jsx(Search, { size: 14 }),
            /* @__PURE__ */ jsx("input", { placeholder: "Search product sets…", value: setQuery, onChange: (e) => setSetQuery(e.target.value) })
          ] }),
          /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: () => setShowManageSets(true), children: "Manage sets" })
        ] }),
        filteredSets.length > 0 && /* @__PURE__ */ jsx("div", { className: "pos-set-cards", children: filteredSets.map((set) => /* @__PURE__ */ jsxs("div", { className: "pos-set-card", style: {
          borderColor: set.color ?? void 0
        }, children: [
          /* @__PURE__ */ jsxs("div", { className: "pos-set-card__head", children: [
            /* @__PURE__ */ jsx("span", { className: "pos-set-card__icon", style: {
              background: set.color ?? void 0
            }, children: "📦" }),
            /* @__PURE__ */ jsxs("div", { className: "pos-set-card__title", children: [
              /* @__PURE__ */ jsx("b", { children: set.name }),
              /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                set.items.length,
                " items"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("ul", { className: "pos-set-card__items", children: [
            set.items.slice(0, 2).map((item) => /* @__PURE__ */ jsxs("li", { children: [
              item.quantity,
              "× ",
              item.product?.name ?? "Product"
            ] }, item.id)),
            set.items.length > 2 && /* @__PURE__ */ jsxs("li", { className: "pos-set-card__items-more-wrap", children: [
              /* @__PURE__ */ jsxs("span", { className: "pos-set-card__items-more", children: [
                "+",
                set.items.length - 2,
                " more"
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "pos-set-card__items-popover", children: set.items.slice(2).map((item) => /* @__PURE__ */ jsxs("li", { children: [
                item.quantity,
                "× ",
                item.product?.name ?? "Product"
              ] }, item.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide pos-set-card__add", onClick: () => addSet(set), children: [
            /* @__PURE__ */ jsx(Plus, { size: 13 }),
            " Quick add"
          ] })
        ] }, set.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pos-search", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-search-field", style: {
          flex: 1
        }, children: [
          /* @__PURE__ */ jsx(Search, { size: 14 }),
          /* @__PURE__ */ jsx("input", { placeholder: "Search products to add…", value: search, onChange: (e) => setSearch(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All Categories" }),
          categories.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pos-grid", children: [
        pagedProducts.map((product) => /* @__PURE__ */ jsxs("button", { className: "pos-product", disabled: product.stock_quantity <= 0, onClick: () => addToCart(product), children: [
          product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: "", className: "pos-product__img" }) : /* @__PURE__ */ jsx("div", { className: "pos-product__img pos-product__img--placeholder" }),
          /* @__PURE__ */ jsx("span", { className: "pos-product__name", children: product.name }),
          /* @__PURE__ */ jsx("span", { className: "pos-product__price", children: formatPeso(product.selling_price) }),
          /* @__PURE__ */ jsx("span", { className: `pos-product__stock ${product.stock_quantity <= product.reorder_level ? "pos-product__stock--low" : ""}`, children: product.stock_quantity > 0 ? `${product.stock_quantity} left` : "Out of stock" })
        ] }, product.id)),
        filteredProducts.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No products match." })
      ] }),
      filteredProducts.length > PRODUCTS_PER_PAGE && /* @__PURE__ */ jsxs("div", { className: "pos-pagination", children: [
        /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", disabled: productPage <= 1, onClick: () => setProductPage((p) => Math.max(1, p - 1)), children: "Previous" }),
        /* @__PURE__ */ jsxs("span", { className: "pos-pagination__label", children: [
          "Page ",
          productPage,
          " of ",
          productPageCount
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", disabled: productPage >= productPageCount, onClick: () => setProductPage((p) => Math.min(productPageCount, p + 1)), children: "Next" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "pos-cart", children: [
      /* @__PURE__ */ jsxs("div", { className: "pos-cart__header", children: [
        /* @__PURE__ */ jsxs("h2", { children: [
          /* @__PURE__ */ jsx(ShoppingCart, { size: 16, style: {
            verticalAlign: -3
          } }),
          " Current Order"
        ] }),
        cart.length > 0 && /* @__PURE__ */ jsxs("button", { className: "dash-link-btn", onClick: () => setCart([]), children: [
          /* @__PURE__ */ jsx(Trash2, { size: 13 }),
          " Clear all"
        ] })
      ] }),
      cart.length === 0 ? /* @__PURE__ */ jsxs("p", { className: "pos-cart__empty", children: [
        "Cart is empty",
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsx("span", { className: "dash-muted", children: "Select products from the left to start a sale." })
      ] }) : /* @__PURE__ */ jsx("div", { style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }, children: cart.map((line, i) => /* @__PURE__ */ jsxs("div", { className: "pos-cart__item", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "pos-cart__item-name", children: line.name }),
          /* @__PURE__ */ jsxs("div", { className: "pos-cart__item-price", children: [
            "Cost ",
            formatPeso(line.costPrice),
            " each"
          ] })
        ] }),
        /* @__PURE__ */ jsx("input", { type: "number", className: "dash-inline-input", min: 0, max: line.maxStock, value: line.quantity, onChange: (e) => updateQty(i, Number(e.target.value) - line.quantity), disabled: line.isFreeReward }),
        /* @__PURE__ */ jsx("input", { type: "number", className: "dash-inline-input", min: 0, step: "0.01", value: line.unitPrice, onChange: (e) => updatePrice(i, Number(e.target.value)), disabled: line.isFreeReward }),
        /* @__PURE__ */ jsx("button", { className: "pos-cart__remove", onClick: () => removeLine(i), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
      ] }, `${line.productId}-${i}`)) }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Customer name (optional)" }),
        /* @__PURE__ */ jsx("input", { value: customerName, onChange: (e) => setCustomerName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Date" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: orderDate, onChange: (e) => setOrderDate(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Time" }),
          /* @__PURE__ */ jsx("input", { type: "time", value: orderTime, onChange: (e) => setOrderTime(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Courier" }),
          /* @__PURE__ */ jsxs("select", { value: courier, onChange: (e) => {
            const next = e.target.value;
            setCourier(next);
            setFreeShippingPromo(false);
            if (next === COURIER_LALAMOVE_DIRECT) {
              setShippingFee(0);
              setShippingPaidBy("customer");
            } else if (next === COURIER_JNT || next === COURIER_LALAMOVE_INVOICE) {
              setShippingPaidBy("customer");
            }
          }, children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "— None —" }),
            COURIERS.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c))
          ] })
        ] }),
        courier !== COURIER_LALAMOVE_DIRECT && /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", value: shippingFee || "", placeholder: "0", onChange: (e) => setShippingFee(Number(e.target.value)) })
        ] })
      ] }),
      courier === COURIER_LALAMOVE_DIRECT ? /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Customer pays the Lalamove rider directly, so shipping is not added to the invoice total." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-check-row", children: [
          /* @__PURE__ */ jsx("input", { type: "checkbox", checked: freeShippingPromo, disabled: !courier || shippingFee <= 0, onChange: (e) => {
            setFreeShippingPromo(e.target.checked);
            setShippingPaidBy(e.target.checked ? "business" : "customer");
          } }),
          /* @__PURE__ */ jsx("span", { children: "Free Shipping Promo" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: freeShippingPromo ? "Shipping is calculated and logged as a Shipping expense, then deducted from the customer invoice." : "Shipping is added to the invoice total. J&T uses this by default, and Lalamove can use it when the customer pays in advance." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Promo / Discount Code" }),
        /* @__PURE__ */ jsx("input", { value: promoCode, onChange: (e) => setPromoCode(e.target.value), placeholder: "e.g. FIRSTDAY" })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--outline button--wide", onClick: applyPromo, children: [
        /* @__PURE__ */ jsx(Plus, { size: 13 }),
        " Add Promo / Discount"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "dash-muted", style: {
        fontSize: 12
      }, children: [
        promos.length,
        " promo",
        promos.length === 1 ? "" : "s",
        " saved • ",
        promos.filter((p) => p.active).length,
        " active",
        " · ",
        /* @__PURE__ */ jsx("button", { type: "button", className: "dash-link-btn", onClick: () => setShowPromoManager(true), children: "Manage" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Payment Method" }),
        /* @__PURE__ */ jsx("select", { value: paymentMethod, onChange: (e) => setPaymentMethod(e.target.value), children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m, children: m }, m)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "pos-cart__totals", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(subtotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { children: [
            "Shipping Fee",
            courier ? ` (${courier})` : ""
          ] }),
          /* @__PURE__ */ jsx("span", { children: courier === COURIER_LALAMOVE_DIRECT ? "Pay courier directly" : shippingFee > 0 ? `${formatPeso(shippingFee)} — ${freeShippingPromo ? "free promo" : "added to invoice"}` : "None" })
        ] }),
        shippingPromoDiscount > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Free Shipping Promo" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatPeso(shippingPromoDiscount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Promo / Discount Code" }),
          /* @__PURE__ */ jsx("span", { children: appliedPromo ? appliedPromo.code : "None" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Discount" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "-",
            formatPeso(discount)
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Total Revenue" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(total) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Total Cost (COGS)" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(cogs) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { children: "Gross Profit" }),
          /* @__PURE__ */ jsx("span", { children: formatPeso(grossProfit) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "pos-cart__grand", children: [
          /* @__PURE__ */ jsx("span", { children: "Margin" }),
          /* @__PURE__ */ jsxs("span", { children: [
            marginPct.toFixed(2),
            "%"
          ] })
        ] })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
      /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: checkout, disabled: cart.length === 0 || checkingOut, children: checkingOut ? "Processing…" : "Make Order Form" })
    ] }),
    invoiceOrder && /* @__PURE__ */ jsx(InvoiceModal, { order: invoiceOrder, businessProfile, onClose: () => setInvoiceOrder(null), onChanged: setInvoiceOrder }),
    showManageSets && /* @__PURE__ */ jsx(ManageProductSetsModal, { productSets, onClose: () => setShowManageSets(false), onChanged: onSaleCreated }),
    showPromoManager && /* @__PURE__ */ jsx(PromoManagerModal, { promos, products, onClose: () => setShowPromoManager(false), onChanged: onSaleCreated })
  ] });
}
function HistoryView({
  salesOrders,
  businessProfile,
  onChanged
}) {
  const [detailsOrder, setDetailsOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const reverse = async (order) => {
    if (!confirm(`Reverse order ${order.order_number}? This restores stock and cannot be undone.`)) return;
    await reverseSaleFn({
      data: {
        id: order.id
      }
    });
    await onChanged();
  };
  const remove = async (order) => {
    if (!confirm(`Permanently delete order ${order.order_number}? This cannot be undone.`)) return;
    await deleteSalesOrderFn({
      data: {
        id: order.id
      }
    });
    await onChanged();
  };
  if (salesOrders.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "dash-empty-card", children: [
      /* @__PURE__ */ jsx("div", { className: "dash-empty-card__icon", children: /* @__PURE__ */ jsx(ShoppingCart, { size: 22 }) }),
      /* @__PURE__ */ jsx("h2", { children: "No sales yet" }),
      /* @__PURE__ */ jsx("p", { children: "Completed sales will appear here with full profit breakdowns." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "dash-table-wrap", children: [
    /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Order #" }),
        /* @__PURE__ */ jsx("th", { children: "Status" }),
        /* @__PURE__ */ jsx("th", { children: "Customer" }),
        /* @__PURE__ */ jsx("th", { children: "Date" }),
        /* @__PURE__ */ jsx("th", { children: "Items" }),
        /* @__PURE__ */ jsx("th", { children: "Revenue" }),
        /* @__PURE__ */ jsx("th", { children: "COGS" }),
        /* @__PURE__ */ jsx("th", { children: "Profit" }),
        /* @__PURE__ */ jsx("th", { children: "Margin" }),
        /* @__PURE__ */ jsx("th", { children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: salesOrders.map((order) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: order.order_number }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `dash-badge dash-badge--sale-${order.status}`, children: order.status.replace("_", " ") }) }),
        /* @__PURE__ */ jsx("td", { children: order.customer_name || "Walk-in" }),
        /* @__PURE__ */ jsx("td", { children: new Date(order.created_at).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        }) }),
        /* @__PURE__ */ jsx("td", { children: order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0 }),
        /* @__PURE__ */ jsx("td", { children: formatPeso(order.total) }),
        /* @__PURE__ */ jsx("td", { children: formatPeso(order.total_cost) }),
        /* @__PURE__ */ jsx("td", { children: formatPeso(order.gross_profit) }),
        /* @__PURE__ */ jsxs("td", { children: [
          order.margin_pct.toFixed(2),
          "%"
        ] }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "dash-row-actions", children: [
          /* @__PURE__ */ jsx("button", { className: "dash-link-btn", onClick: () => setDetailsOrder(order), children: "Details" }),
          /* @__PURE__ */ jsx("button", { className: "dash-link-btn", onClick: () => setInvoiceOrder(order), children: "Invoice" }),
          order.status === "paid" && /* @__PURE__ */ jsx("button", { className: "dash-link-btn", onClick: () => setReceiptOrder(order), children: "Official Receipt" }),
          order.status !== "reversed" ? /* @__PURE__ */ jsx("button", { className: "dash-link-btn dash-link-btn--danger", onClick: () => reverse(order), children: "Reverse" }) : /* @__PURE__ */ jsx("button", { className: "dash-link-btn dash-link-btn--danger", onClick: () => remove(order), children: "Delete" })
        ] }) })
      ] }, order.id)) })
    ] }),
    detailsOrder && /* @__PURE__ */ jsx(SaleDetailsModal, { order: detailsOrder, onClose: () => setDetailsOrder(null) }),
    invoiceOrder && /* @__PURE__ */ jsx(InvoiceModal, { order: invoiceOrder, businessProfile, onClose: () => setInvoiceOrder(null), onChanged: setInvoiceOrder }),
    receiptOrder && /* @__PURE__ */ jsx(OfficialReceiptModal, { order: receiptOrder, businessProfile, onClose: () => setReceiptOrder(null) })
  ] });
}
export {
  PosPage as component,
  formatPeso
};
