import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { X, FileText, Image, Download, Settings2, Plus, Search, SlidersHorizontal, Package, ChevronUp, ChevronDown, Pencil, Trash2, Minus } from "lucide-react";
import { useRef, useState, useMemo, Fragment as Fragment$1, useEffect } from "react";
import { x as Route, y as deleteProductFn, j as deleteProductSetFn, z as updateProductFn, A as createProductFn, B as adjustProductStockFn, C as createCategoryFn, D as createSupplierFn, E as deleteCategoryFn, F as deleteSupplierFn, G as updateProductSetFn, H as createProductSetFn, I as deleteProductBatchFn, J as updateProductBatchFn, K as createProductBatchFn } from "./router-2rQkfpAr.js";
import { I as ImageUploaderSingle } from "./ImageUploader-BHaOVhLu.js";
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
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const ROW_HEIGHT = 22;
const HEADER_ROW_HEIGHT = 26;
const CATEGORY_ROW_HEIGHT = 22;
const UNCATEGORIZED = "Uncategorized";
function formatGeneratedAt() {
  return (/* @__PURE__ */ new Date()).toLocaleString("en-PH", { dateStyle: "long", timeStyle: "short" });
}
function groupByCategory(products) {
  const byName = /* @__PURE__ */ new Map();
  for (const product of products) {
    const name = product.category?.name ?? UNCATEGORIZED;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(product);
  }
  return [...byName.entries()].sort(([a], [b]) => {
    if (a === UNCATEGORIZED) return 1;
    if (b === UNCATEGORIZED) return -1;
    return a.localeCompare(b, void 0, { numeric: true, sensitivity: "base" });
  }).map(([name, items]) => ({
    name,
    items: items.sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true, sensitivity: "base" }))
  }));
}
function ExportInventoryModal({ products, onClose }) {
  const previewRef = useRef(null);
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState("");
  const groups = groupByCategory(products);
  const generatedAt = formatGeneratedAt();
  const exportPdf = async () => {
    setGenerating("pdf");
    setError("");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const colItemX = MARGIN;
      const colStockX = PAGE_WIDTH - MARGIN - 160;
      const drawReportHeader = () => {
        let y2 = MARGIN;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Inventory Report", colItemX, y2);
        y2 += 20;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(110);
        doc.text(`Generated on ${generatedAt}`, colItemX, y2);
        doc.setTextColor(0);
        return y2 + 24;
      };
      const drawColumnHeader = (y2) => {
        doc.setFillColor(214, 51, 108);
        doc.rect(colItemX, y2, PAGE_WIDTH - MARGIN * 2, HEADER_ROW_HEIGHT, "F");
        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Item Name", colItemX + 8, y2 + 17);
        doc.text("Remaining Stocks", colStockX + 8, y2 + 17);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        return y2 + HEADER_ROW_HEIGHT;
      };
      const drawCategoryLabel = (y2, name) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(214, 51, 108);
        doc.text(name, colItemX, y2 + 15);
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        return y2 + CATEGORY_ROW_HEIGHT;
      };
      let y = drawReportHeader();
      const bottomLimit = PAGE_HEIGHT - MARGIN;
      groups.forEach((group) => {
        if (y + CATEGORY_ROW_HEIGHT + HEADER_ROW_HEIGHT + ROW_HEIGHT > bottomLimit) {
          doc.addPage();
          y = MARGIN;
        }
        y = drawCategoryLabel(y, group.name);
        y = drawColumnHeader(y);
        group.items.forEach((product, i) => {
          if (y + ROW_HEIGHT > bottomLimit) {
            doc.addPage();
            y = MARGIN;
            y = drawCategoryLabel(y, `${group.name} (continued)`);
            y = drawColumnHeader(y);
          }
          if (i % 2 === 1) {
            doc.setFillColor(250, 236, 242);
            doc.rect(colItemX, y, PAGE_WIDTH - MARGIN * 2, ROW_HEIGHT, "F");
          }
          doc.setFontSize(10);
          doc.text(product.name, colItemX + 8, y + 15, { maxWidth: colStockX - colItemX - 16 });
          doc.text(`${product.stock_quantity} ${product.unit}`, colStockX + 8, y + 15);
          y += ROW_HEIGHT;
        });
        y += 12;
      });
      doc.setFontSize(9);
      doc.setTextColor(150);
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.text(`Page ${p} of ${pageCount}`, PAGE_WIDTH - MARGIN - 60, PAGE_HEIGHT - 20);
      }
      doc.save(`inventory-report-${Date.now()}.pdf`);
    } catch {
      setError("Could not generate PDF.");
    } finally {
      setGenerating(null);
    }
  };
  const exportPng = async () => {
    if (!previewRef.current) return;
    setGenerating("png");
    setError("");
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 3 });
      const link = document.createElement("a");
      link.download = `inventory-report-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      setError("Could not generate PNG.");
    } finally {
      setGenerating(null);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-modal--export", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "Export Inventory" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body dash-export-layout", children: [
      /* @__PURE__ */ jsx("div", { className: "dash-export-preview-wrap", children: /* @__PURE__ */ jsxs("div", { className: "dash-export-preview", ref: previewRef, children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-export-preview__head", children: [
          /* @__PURE__ */ jsx("h3", { children: "Inventory Report" }),
          /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
            "Generated on ",
            generatedAt
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "dash-export-preview__groups", children: groups.map((group) => /* @__PURE__ */ jsxs("div", { className: "dash-export-preview__group", children: [
          /* @__PURE__ */ jsx("h4", { className: "dash-export-preview__category", children: group.name }),
          /* @__PURE__ */ jsxs("table", { className: "dash-invoice-preview__table", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { children: "Item Name" }),
              /* @__PURE__ */ jsx("th", { children: "Remaining Stocks" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { children: group.items.map((product) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { children: product.name }),
              /* @__PURE__ */ jsxs("td", { children: [
                product.stock_quantity,
                " ",
                product.unit
              ] })
            ] }, product.id)) })
          ] })
        ] }, group.name)) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "dash-export-side", children: [
        /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Choose a format to download the complete stock list." }),
        /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide", onClick: exportPdf, disabled: generating !== null, children: [
          /* @__PURE__ */ jsx(FileText, { size: 14 }),
          " ",
          generating === "pdf" ? "Generating…" : "Export as PDF"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "button button--outline button--wide", onClick: exportPng, disabled: generating !== null, children: [
          /* @__PURE__ */ jsx(Image, { size: 14 }),
          " ",
          generating === "png" ? "Generating…" : "Export as PNG"
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
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
function effectiveCostPrice(product) {
  const activeBatch = product.batches?.find((b) => b.quantity > 0);
  return activeBatch ? activeBatch.cost_price : product.cost_price;
}
function stockBadgeClass(product) {
  if (product.stock_quantity <= 0) return "dash-badge--stock-out";
  if (product.stock_quantity <= product.reorder_level) return "dash-badge--stock-low";
  return "dash-badge--stock-ok";
}
function InventoryPage() {
  const data = Route.useLoaderData();
  const router = useRouter();
  const [tab, setTab] = useState("products");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalProduct, setModalProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const visible = useMemo(() => {
    return data.products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (lowStockOnly && p.stock_quantity > p.reorder_level) return false;
      if (search) {
        const term = search.toLowerCase();
        const match = p.name.toLowerCase().includes(term) || (p.sku ?? "").toLowerCase().includes(term) || (p.barcode ?? "").toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name, void 0, {
      numeric: true,
      sensitivity: "base"
    }));
  }, [data.products, search, categoryId, lowStockOnly]);
  const removeProduct = async (product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    await deleteProductFn({
      data: {
        id: product.id
      }
    });
    await router.invalidate();
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-inv-header", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "dash-page__title", style: {
          marginBottom: 4
        }, children: "Inventory" }),
        /* @__PURE__ */ jsx("p", { children: "Manage products, stock levels, categories, and suppliers" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-toolbar__actions", children: [
        /* @__PURE__ */ jsxs("button", { className: "button button--outline", onClick: () => setShowExportModal(true), children: [
          /* @__PURE__ */ jsx(Download, { size: 14 }),
          " Export"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "button button--outline", onClick: () => setShowCatalogModal(true), children: [
          /* @__PURE__ */ jsx(Settings2, { size: 14 }),
          " Categories & Suppliers"
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "button button--dark", onClick: () => setModalProduct("new"), children: [
          /* @__PURE__ */ jsx(Plus, { size: 14 }),
          " Add Product"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-tabs", children: [
      /* @__PURE__ */ jsx("button", { className: `dash-tab ${tab === "products" ? "is-active" : ""}`, onClick: () => setTab("products"), children: "Products" }),
      /* @__PURE__ */ jsx("button", { className: `dash-tab ${tab === "sets" ? "is-active" : ""}`, onClick: () => setTab("sets"), children: "Product Sets" })
    ] }),
    tab === "products" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-inv-filters", children: [
        /* @__PURE__ */ jsxs("div", { className: "dash-search-field", children: [
          /* @__PURE__ */ jsx(Search, { size: 14 }),
          /* @__PURE__ */ jsx("input", { placeholder: "Search by name, SKU, or barcode…", value: search, onChange: (e) => setSearch(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("select", { value: categoryId, onChange: (e) => setCategoryId(e.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "All categories" }),
          data.categories.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: `dash-toggle-btn dash-toggle-btn--danger ${lowStockOnly ? "is-active" : ""}`, onClick: () => setLowStockOnly(!lowStockOnly), children: [
          /* @__PURE__ */ jsx(SlidersHorizontal, { size: 13 }),
          " Low stock only"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { children: "Product" }),
          /* @__PURE__ */ jsx("th", { children: "SKU" }),
          /* @__PURE__ */ jsx("th", { children: "Category" }),
          /* @__PURE__ */ jsx("th", { children: "Cost" }),
          /* @__PURE__ */ jsx("th", { children: "Price" }),
          /* @__PURE__ */ jsx("th", { children: "Stock" }),
          /* @__PURE__ */ jsx("th", { children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { children: [
          visible.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "dash-table__empty", children: "No products match." }) }),
          visible.map((product) => {
            const batches = product.batches ?? [];
            const isBatchTracked = batches.length > 0;
            const isExpanded = expandedProductId === product.id;
            return /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "dash-product-cell", children: [
                  product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: "" }) : /* @__PURE__ */ jsx("span", { className: "dash-product-cell__icon", children: /* @__PURE__ */ jsx(Package, { size: 14 }) }),
                  product.name
                ] }) }),
                /* @__PURE__ */ jsx("td", { children: product.sku ?? "—" }),
                /* @__PURE__ */ jsx("td", { children: product.category?.name ?? "—" }),
                /* @__PURE__ */ jsx("td", { children: formatPeso(effectiveCostPrice(product)) }),
                /* @__PURE__ */ jsx("td", { children: formatPeso(product.selling_price) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }, children: [
                  /* @__PURE__ */ jsxs("span", { className: `dash-badge ${stockBadgeClass(product)}`, children: [
                    product.stock_quantity,
                    " ",
                    product.unit
                  ] }),
                  isBatchTracked && /* @__PURE__ */ jsx("button", { type: "button", className: "dash-icon-btn", title: `${batches.length} batch(es) — click to ${isExpanded ? "hide" : "view"}`, onClick: () => setExpandedProductId(isExpanded ? null : product.id), children: isExpanded ? /* @__PURE__ */ jsx(ChevronUp, { size: 13 }) : /* @__PURE__ */ jsx(ChevronDown, { size: 13 }) })
                ] }) }),
                /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "dash-row-actions", children: [
                  /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Adjust stock", onClick: () => setAdjustingProduct(product), children: /* @__PURE__ */ jsx(SlidersHorizontal, { size: 14 }) }),
                  /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Edit", onClick: () => setModalProduct(product), children: /* @__PURE__ */ jsx(Pencil, { size: 14 }) }),
                  /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", title: "Delete", onClick: () => removeProduct(product), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
                ] }) })
              ] }),
              isExpanded && isBatchTracked && /* @__PURE__ */ jsx("tr", { className: "dash-batch-subrow", children: /* @__PURE__ */ jsx("td", { colSpan: 7, children: /* @__PURE__ */ jsx("ul", { className: "dash-batch-list", children: batches.map((batch) => /* @__PURE__ */ jsxs("li", { children: [
                /* @__PURE__ */ jsx("b", { children: batch.quantity }),
                " ",
                product.unit,
                " left ",
                /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                  "(",
                  batch.batch_name,
                  ")"
                ] }),
                " ",
                /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                  "@ ",
                  formatPeso(batch.cost_price),
                  " cost"
                ] }),
                batch.expiration_date && /* @__PURE__ */ jsxs("span", { className: "dash-muted", children: [
                  " — exp. ",
                  batch.expiration_date
                ] })
              ] }, batch.id)) }) }) })
            ] }, product.id);
          })
        ] })
      ] }) })
    ] }),
    tab === "sets" && /* @__PURE__ */ jsx(ProductSetsTab, { productSets: data.productSets, products: data.products }),
    modalProduct && /* @__PURE__ */ jsx(ProductModal, { product: modalProduct === "new" ? null : modalProduct, categories: data.categories, suppliers: data.suppliers, onClose: () => setModalProduct(null), onSaved: async () => {
      setModalProduct(null);
      await router.invalidate();
    } }),
    adjustingProduct && /* @__PURE__ */ jsx(AdjustStockModal, { product: adjustingProduct, onClose: () => setAdjustingProduct(null), onSaved: async () => {
      setAdjustingProduct(null);
      await router.invalidate();
    } }),
    showCatalogModal && /* @__PURE__ */ jsx(CategoriesSuppliersModal, { categories: data.categories, suppliers: data.suppliers, onClose: () => setShowCatalogModal(false) }),
    showExportModal && /* @__PURE__ */ jsx(ExportInventoryModal, { products: data.products, onClose: () => setShowExportModal(false) })
  ] });
}
function ProductModal({
  product,
  categories,
  suppliers,
  onClose,
  onSaved
}) {
  const router = useRouter();
  const hasActiveBatches = product?.batches?.some((b) => b.quantity > 0) ?? false;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category_id: product?.category_id ?? "",
    supplier_id: product?.supplier_id ?? "",
    cost_price: product ? effectiveCostPrice(product) : 0,
    selling_price: product?.selling_price ?? 0,
    stock_quantity: product?.stock_quantity ?? 0,
    reorder_level: product?.reorder_level ?? 5,
    unit: product?.unit ?? "pc",
    image_url: product?.image_url ?? "",
    description: product?.description ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        supplier_id: form.supplier_id || null
      };
      if (product) {
        const {
          stock_quantity: _stock,
          ...editablePayload
        } = payload;
        await updateProductFn({
          data: {
            id: product.id,
            ...editablePayload
          }
        });
      } else {
        await createProductFn({
          data: payload
        });
      }
      onSaved();
    } catch {
      setError("Could not save product.");
    } finally {
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: product ? "Edit Product" : "Add Product" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
        /* @__PURE__ */ jsxs("label", { className: "dash-field dash-field--span2", children: [
          /* @__PURE__ */ jsx("span", { children: "Inventory image" }),
          /* @__PURE__ */ jsx(ImageUploaderSingle, { value: form.image_url, onChange: (url) => setForm({
            ...form,
            image_url: url
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field dash-field--span2", children: [
          /* @__PURE__ */ jsx("span", { children: "Product name *" }),
          /* @__PURE__ */ jsx("input", { required: true, placeholder: "e.g. Ceramic Mug", value: form.name, onChange: (e) => setForm({
            ...form,
            name: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "SKU *" }),
          /* @__PURE__ */ jsx("input", { required: true, placeholder: "e.g. MUG-001", value: form.sku, onChange: (e) => setForm({
            ...form,
            sku: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Barcode" }),
          /* @__PURE__ */ jsx("input", { placeholder: "Optional", value: form.barcode, onChange: (e) => setForm({
            ...form,
            barcode: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Category" }),
          /* @__PURE__ */ jsxs("select", { value: form.category_id, onChange: (e) => setForm({
            ...form,
            category_id: e.target.value
          }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Uncategorized" }),
            categories.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Supplier" }),
          /* @__PURE__ */ jsxs("select", { value: form.supplier_id, onChange: (e) => setForm({
            ...form,
            supplier_id: e.target.value
          }), children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "None" }),
            suppliers.map((s) => /* @__PURE__ */ jsx("option", { value: s.id, children: s.name }, s.id))
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: `dash-field ${hasActiveBatches ? "dash-field--locked" : ""}`, children: [
          /* @__PURE__ */ jsx("span", { children: "Cost price *" }),
          /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: 0, required: true, disabled: hasActiveBatches, title: hasActiveBatches ? "Computed from the oldest active batch below" : void 0, value: form.cost_price, onChange: (e) => setForm({
            ...form,
            cost_price: Number(e.target.value)
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Selling price *" }),
          /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: 0, required: true, value: form.selling_price, onChange: (e) => setForm({
            ...form,
            selling_price: Number(e.target.value)
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: `dash-field ${product ? "dash-field--locked" : ""}`, children: [
          /* @__PURE__ */ jsx("span", { children: "Stock quantity *" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, required: true, disabled: Boolean(product), value: form.stock_quantity, onChange: (e) => setForm({
            ...form,
            stock_quantity: Number(e.target.value)
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Reorder level *" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: 0, required: true, value: form.reorder_level, onChange: (e) => setForm({
            ...form,
            reorder_level: Number(e.target.value)
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Unit" }),
          /* @__PURE__ */ jsx("input", { value: form.unit, onChange: (e) => setForm({
            ...form,
            unit: e.target.value
          }) })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "dash-field dash-field--span2", children: [
          /* @__PURE__ */ jsx("span", { children: "Description" }),
          /* @__PURE__ */ jsx("textarea", { value: form.description, onChange: (e) => setForm({
            ...form,
            description: e.target.value
          }) })
        ] })
      ] }),
      product && /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: hasActiveBatches ? "Stock quantity and cost price are locked here — both are computed automatically from the batches below (cost follows the oldest active batch, next up for FIFO)." : 'Stock quantity is locked here — use "Adjust Stock" for manual corrections so every change stays audited.' }),
      product && /* @__PURE__ */ jsx(ProductBatchesSection, { product, onChanged: () => router.invalidate() }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving, children: saving ? "Saving…" : product ? "Save changes" : "Add product" })
    ] })
  ] }) });
}
function ProductBatchesSection({
  product,
  onChanged
}) {
  const [batches, setBatches] = useState(product.batches ?? []);
  const [newBatch, setNewBatch] = useState({
    batch_name: "",
    quantity: "",
    cost_price: String(product.cost_price ?? 0),
    expiration_date: ""
  });
  const [savingId, setSavingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const total = batches.reduce((sum, b) => sum + b.quantity, 0);
  const commitBatch = async (batch, patch) => {
    setSavingId(batch.id);
    setError("");
    try {
      const updated = await updateProductBatchFn({
        data: {
          id: batch.id,
          ...patch
        }
      });
      setBatches((prev) => prev.map((b) => b.id === batch.id ? updated : b));
      onChanged();
    } catch {
      setError("Could not save batch change.");
    } finally {
      setSavingId(null);
    }
  };
  const addBatch = async () => {
    if (!newBatch.batch_name.trim()) return;
    setAdding(true);
    setError("");
    try {
      const created = await createProductBatchFn({
        data: {
          productId: product.id,
          batch_name: newBatch.batch_name.trim(),
          quantity: Number(newBatch.quantity) || 0,
          cost_price: Number(newBatch.cost_price) || 0,
          expiration_date: newBatch.expiration_date || void 0
        }
      });
      setBatches((prev) => [...prev, created]);
      setNewBatch({
        batch_name: "",
        quantity: "",
        cost_price: String(product.cost_price ?? 0),
        expiration_date: ""
      });
      onChanged();
    } catch {
      setError("Could not add batch.");
    } finally {
      setAdding(false);
    }
  };
  const removeBatch = async (batch) => {
    if (!confirm(`Remove batch "${batch.batch_name}"?`)) return;
    setSavingId(batch.id);
    setError("");
    try {
      await deleteProductBatchFn({
        data: {
          id: batch.id
        }
      });
      setBatches((prev) => prev.filter((b) => b.id !== batch.id));
      onChanged();
    } catch {
      setError("Could not remove batch.");
    } finally {
      setSavingId(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-batch-section", children: [
    /* @__PURE__ */ jsx("div", { className: "dash-section-divider", children: "Batches" }),
    /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Split this product's stock into manufacturing/arrival batches. Sales deduct from the oldest batch first (FIFO)." }),
    batches.length > 0 && /* @__PURE__ */ jsxs("div", { className: "dash-batch-row-head", children: [
      /* @__PURE__ */ jsx("span", { children: "Batch name" }),
      /* @__PURE__ */ jsx("span", { children: "Qty" }),
      /* @__PURE__ */ jsx("span", { children: "Cost price" }),
      /* @__PURE__ */ jsx("span", { children: "Expiry" }),
      /* @__PURE__ */ jsx("span", {})
    ] }),
    batches.map((batch) => /* @__PURE__ */ jsx(BatchRow, { batch, unit: product.unit, saving: savingId === batch.id, onCommit: (patch) => commitBatch(batch, patch), onRemove: () => removeBatch(batch) }, batch.id)),
    /* @__PURE__ */ jsxs("div", { className: "dash-batch-row", onKeyDown: (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (!adding && newBatch.batch_name.trim()) void addBatch();
    }, children: [
      /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Batch name, e.g. June Batch", value: newBatch.batch_name, onChange: (e) => setNewBatch({
        ...newBatch,
        batch_name: e.target.value
      }) }),
      /* @__PURE__ */ jsx("input", { type: "number", min: 0, placeholder: "Qty", value: newBatch.quantity, onChange: (e) => setNewBatch({
        ...newBatch,
        quantity: e.target.value
      }) }),
      /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", placeholder: "Cost price", title: "Cost price for this batch", value: newBatch.cost_price, onChange: (e) => setNewBatch({
        ...newBatch,
        cost_price: e.target.value
      }) }),
      /* @__PURE__ */ jsx("input", { type: "date", value: newBatch.expiration_date, onChange: (e) => setNewBatch({
        ...newBatch,
        expiration_date: e.target.value
      }) }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--outline", disabled: adding || !newBatch.batch_name.trim(), onClick: addBatch, children: [
        /* @__PURE__ */ jsx(Plus, { size: 13 }),
        " Add New Batch"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "dash-batch-total", children: [
      "Total across batches: ",
      /* @__PURE__ */ jsx("b", { children: total }),
      " ",
      product.unit
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
  ] });
}
function BatchRow({
  batch,
  unit,
  saving,
  onCommit,
  onRemove
}) {
  const [name, setName] = useState(batch.batch_name);
  const [quantity, setQuantity] = useState(batch.quantity);
  const [costPrice, setCostPrice] = useState(batch.cost_price);
  const [expiration, setExpiration] = useState(batch.expiration_date ?? "");
  useEffect(() => {
    setName(batch.batch_name);
    setQuantity(batch.quantity);
    setCostPrice(batch.cost_price);
    setExpiration(batch.expiration_date ?? "");
  }, [batch]);
  return /* @__PURE__ */ jsxs("div", { className: "dash-batch-row", onKeyDown: (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    document.activeElement?.blur();
  }, children: [
    /* @__PURE__ */ jsx("input", { type: "text", value: name, disabled: saving, onChange: (e) => setName(e.target.value), onBlur: () => {
      if (name.trim() && name !== batch.batch_name) onCommit({
        batch_name: name.trim()
      });
    } }),
    /* @__PURE__ */ jsx("input", { type: "number", min: 0, title: `Quantity (${unit})`, value: quantity, disabled: saving, onChange: (e) => setQuantity(Number(e.target.value)), onBlur: () => {
      if (quantity !== batch.quantity) onCommit({
        quantity
      });
    } }),
    /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", title: "Cost price for this batch", value: costPrice, disabled: saving, onChange: (e) => setCostPrice(Number(e.target.value)), onBlur: () => {
      if (costPrice !== batch.cost_price) onCommit({
        cost_price: costPrice
      });
    } }),
    /* @__PURE__ */ jsx("input", { type: "date", value: expiration, disabled: saving, onChange: (e) => setExpiration(e.target.value), onBlur: () => {
      if (expiration !== (batch.expiration_date ?? "")) onCommit({
        expiration_date: expiration || null
      });
    } }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "dash-line-item__remove", disabled: saving, onClick: onRemove, children: /* @__PURE__ */ jsx(Trash2, { size: 15 }) })
  ] });
}
const ADJUST_REASONS = ["Stock recount", "Damaged / Lost", "Restock", "Return from customer", "Other"];
function AdjustStockModal({
  product,
  onClose,
  onSaved
}) {
  const [direction, setDirection] = useState("add");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState(ADJUST_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) return;
    setSaving(true);
    setError("");
    try {
      await adjustProductStockFn({
        data: {
          id: product.id,
          direction,
          quantity,
          reason,
          notes: notes || void 0
        }
      });
      onSaved();
    } catch {
      setError("Could not save adjustment.");
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsxs("h2", { children: [
        "Adjust stock — ",
        product.name
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("p", { className: "dash-current-qty", children: [
        "Current quantity: ",
        /* @__PURE__ */ jsxs("b", { children: [
          product.stock_quantity,
          " ",
          product.unit
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "dash-segmented", children: [
        /* @__PURE__ */ jsxs("button", { type: "button", className: `dash-segmented__btn dash-segmented__btn--add ${direction === "add" ? "is-active" : ""}`, onClick: () => setDirection("add"), children: [
          /* @__PURE__ */ jsx(Plus, { size: 14 }),
          " Add stock"
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "button", className: `dash-segmented__btn dash-segmented__btn--remove ${direction === "remove" ? "is-active" : ""}`, onClick: () => setDirection("remove"), children: [
          /* @__PURE__ */ jsx(Minus, { size: 14 }),
          " Remove stock"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Quantity" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: quantity || "", onChange: (e) => setQuantity(Number(e.target.value)), required: true })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Reason" }),
        /* @__PURE__ */ jsx("select", { value: reason, onChange: (e) => setReason(e.target.value), children: ADJUST_REASONS.map((r) => /* @__PURE__ */ jsx("option", { value: r, children: r }, r)) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Notes (optional)" }),
        /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value) })
      ] }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving || quantity <= 0, children: saving ? "Saving…" : "Save adjustment" })
    ] })
  ] }) });
}
function CategoriesSuppliersModal({
  categories,
  suppliers,
  onClose
}) {
  const router = useRouter();
  const [tab, setTab] = useState("categories");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const addCategory = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createCategoryFn({
      data: {
        name
      }
    });
    setName("");
    setSaving(false);
    await router.invalidate();
  };
  const addSupplier = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createSupplierFn({
      data: {
        name
      }
    });
    setName("");
    setSaving(false);
    await router.invalidate();
  };
  const removeCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await deleteCategoryFn({
      data: {
        id
      }
    });
    await router.invalidate();
  };
  const removeSupplier = async (id) => {
    if (!confirm("Delete this supplier?")) return;
    await deleteSupplierFn({
      data: {
        id
      }
    });
    await router.invalidate();
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "dash-modal dash-cs-modal", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "Manage Categories & Suppliers" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-cs-tabs", children: [
        /* @__PURE__ */ jsx("button", { className: `dash-cs-tab ${tab === "categories" ? "is-active" : ""}`, onClick: () => {
          setTab("categories");
          setName("");
        }, children: "Categories" }),
        /* @__PURE__ */ jsx("button", { className: `dash-cs-tab ${tab === "suppliers" ? "is-active" : ""}`, onClick: () => {
          setTab("suppliers");
          setName("");
        }, children: "Suppliers" })
      ] }),
      /* @__PURE__ */ jsxs("form", { className: "dash-cs-add-row", onSubmit: (e) => {
        e.preventDefault();
        tab === "categories" ? addCategory() : addSupplier();
      }, children: [
        /* @__PURE__ */ jsx("input", { placeholder: tab === "categories" ? "New category name" : "New supplier name", value: name, onChange: (e) => setName(e.target.value) }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: saving || !name.trim(), children: /* @__PURE__ */ jsx(Plus, { size: 16 }) })
      ] }),
      tab === "categories" ? /* @__PURE__ */ jsxs("div", { className: "dash-cs-list", children: [
        categories.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-cs-list__empty", children: "No categories yet." }),
        categories.map((c) => /* @__PURE__ */ jsxs("div", { className: "dash-cs-list__row", children: [
          /* @__PURE__ */ jsx("span", { children: c.name }),
          /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", onClick: () => removeCategory(c.id), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
        ] }, c.id))
      ] }) : /* @__PURE__ */ jsxs("div", { className: "dash-cs-list", children: [
        suppliers.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-cs-list__empty", children: "No suppliers yet." }),
        suppliers.map((s) => /* @__PURE__ */ jsxs("div", { className: "dash-cs-list__row", children: [
          /* @__PURE__ */ jsx("span", { children: s.name }),
          /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", onClick: () => removeSupplier(s.id), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
        ] }, s.id))
      ] })
    ] })
  ] }) });
}
function ProductSetsTab({
  productSets,
  products
}) {
  const router = useRouter();
  const [modalSet, setModalSet] = useState(null);
  const remove = async (id) => {
    if (!confirm("Delete this product set?")) return;
    await deleteProductSetFn({
      data: {
        id
      }
    });
    await router.invalidate();
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-toolbar", children: [
      /* @__PURE__ */ jsx("div", {}),
      /* @__PURE__ */ jsxs("button", { className: "button button--dark", onClick: () => setModalSet("new"), children: [
        /* @__PURE__ */ jsx(Plus, { size: 14 }),
        " Add Product Set"
      ] })
    ] }),
    productSets.length === 0 ? /* @__PURE__ */ jsx("p", { className: "dash-empty-state", children: "No product sets yet. Bundle products together for quick POS access." }) : /* @__PURE__ */ jsx("div", { className: "dash-cards", children: productSets.map((set) => /* @__PURE__ */ jsxs("div", { className: "dash-card", style: {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 8
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        display: "flex",
        justifyContent: "space-between",
        width: "100%"
      }, children: [
        /* @__PURE__ */ jsx("b", { children: set.name }),
        /* @__PURE__ */ jsxs("div", { className: "dash-row-actions", children: [
          /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Edit", onClick: () => setModalSet(set), children: /* @__PURE__ */ jsx(Pencil, { size: 13 }) }),
          /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", title: "Delete", onClick: () => remove(set.id), children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("ul", { style: {
        fontSize: 13,
        color: "var(--muted)",
        paddingLeft: 16
      }, children: set.items.map((item) => /* @__PURE__ */ jsxs("li", { children: [
        item.quantity,
        "× ",
        item.product?.name ?? "Unknown product"
      ] }, item.id)) })
    ] }, set.id)) }),
    modalSet && /* @__PURE__ */ jsx(ProductSetModal, { set: modalSet === "new" ? null : modalSet, products, onClose: () => setModalSet(null), onSaved: async () => {
      setModalSet(null);
      await router.invalidate();
    } })
  ] });
}
function ProductSetModal({
  set,
  products,
  onClose,
  onSaved
}) {
  const [name, setName] = useState(set?.name ?? "");
  const [items, setItems] = useState(set?.items.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity
  })) ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name, void 0, {
    numeric: true,
    sensitivity: "base"
  })), [products]);
  const addItem = () => {
    if (sortedProducts.length === 0) return;
    setItems([...items, {
      product_id: sortedProducts[0].id,
      quantity: 1
    }]);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || items.length === 0) return;
    setSaving(true);
    setError("");
    try {
      if (set) {
        await updateProductSetFn({
          data: {
            id: set.id,
            name,
            icon: set.icon ?? void 0,
            color: set.color ?? void 0,
            sort_order: set.sort_order,
            items
          }
        });
      } else {
        await createProductSetFn({
          data: {
            name,
            items
          }
        });
      }
      onSaved();
    } catch {
      setError("Could not save product set.");
      setSaving(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: set ? "Edit Product Set" : "Add Product Set" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Set Name *" }),
        /* @__PURE__ */ jsx("input", { required: true, value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "dash-line-items", children: items.map((item, i) => /* @__PURE__ */ jsxs("div", { className: "dash-line-item", children: [
        /* @__PURE__ */ jsx("select", { value: item.product_id, onChange: (e) => {
          const next = [...items];
          next[i] = {
            ...item,
            product_id: e.target.value
          };
          setItems(next);
        }, children: sortedProducts.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) }),
        /* @__PURE__ */ jsx("input", { type: "number", min: 1, value: item.quantity, onChange: (e) => {
          const next = [...items];
          next[i] = {
            ...item,
            quantity: Number(e.target.value)
          };
          setItems(next);
        } }),
        /* @__PURE__ */ jsx("div", {}),
        /* @__PURE__ */ jsx("button", { type: "button", className: "dash-line-item__remove", onClick: () => setItems(items.filter((_, idx) => idx !== i)), children: /* @__PURE__ */ jsx(X, { size: 16 }) })
      ] }, i)) }),
      /* @__PURE__ */ jsxs("button", { type: "button", className: "button button--outline", onClick: addItem, children: [
        /* @__PURE__ */ jsx(Plus, { size: 13 }),
        " Add Item"
      ] }),
      items.length === 0 && /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Add at least one product to this set." }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving || !name.trim() || items.length === 0, children: saving ? "Saving…" : set ? "Save changes" : "Save Set" })
    ] })
  ] }) });
}
export {
  InventoryPage as component
};
