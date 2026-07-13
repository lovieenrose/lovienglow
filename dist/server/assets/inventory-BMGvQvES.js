import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Settings2, Plus, Search, SlidersHorizontal, Package, Pencil, Trash2, X, Minus } from "lucide-react";
import { useState, useMemo } from "react";
import { x as Route, y as deleteProductFn, e as deleteProductSetFn, z as updateProductFn, A as createProductFn, B as adjustProductStockFn, C as createCategoryFn, D as createSupplierFn, E as deleteCategoryFn, F as deleteSupplierFn, i as createProductSetFn } from "./router-B6tvQDP-.js";
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
    });
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
          visible.map((product) => /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "dash-product-cell", children: [
              product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: "" }) : /* @__PURE__ */ jsx("span", { className: "dash-product-cell__icon", children: /* @__PURE__ */ jsx(Package, { size: 14 }) }),
              product.name
            ] }) }),
            /* @__PURE__ */ jsx("td", { children: product.sku ?? "—" }),
            /* @__PURE__ */ jsx("td", { children: product.category?.name ?? "—" }),
            /* @__PURE__ */ jsx("td", { children: formatPeso(product.cost_price) }),
            /* @__PURE__ */ jsx("td", { children: formatPeso(product.selling_price) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: `dash-badge ${stockBadgeClass(product)}`, children: [
              product.stock_quantity,
              " ",
              product.unit
            ] }) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "dash-row-actions", children: [
              /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Adjust stock", onClick: () => setAdjustingProduct(product), children: /* @__PURE__ */ jsx(SlidersHorizontal, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "dash-icon-btn", title: "Edit", onClick: () => setModalProduct(product), children: /* @__PURE__ */ jsx(Pencil, { size: 14 }) }),
              /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", title: "Delete", onClick: () => removeProduct(product), children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
            ] }) })
          ] }, product.id))
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
    showCatalogModal && /* @__PURE__ */ jsx(CategoriesSuppliersModal, { categories: data.categories, suppliers: data.suppliers, onClose: () => setShowCatalogModal(false) })
  ] });
}
function ProductModal({
  product,
  categories,
  suppliers,
  onClose,
  onSaved
}) {
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category_id: product?.category_id ?? "",
    supplier_id: product?.supplier_id ?? "",
    cost_price: product?.cost_price ?? 0,
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
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: product ? "Edit Product" : "Add Product" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("div", { className: "dash-form-grid", children: [
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
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Cost price *" }),
          /* @__PURE__ */ jsx("input", { type: "number", step: "0.01", min: 0, required: true, value: form.cost_price, onChange: (e) => setForm({
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
        /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
          /* @__PURE__ */ jsx("span", { children: "Image URL" }),
          /* @__PURE__ */ jsx("input", { value: form.image_url, onChange: (e) => setForm({
            ...form,
            image_url: e.target.value
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
      product && /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: 'Stock quantity is locked here — use "Adjust Stock" for manual corrections so every change stays audited.' }),
      error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving, children: saving ? "Saving…" : product ? "Save changes" : "Add product" })
    ] })
  ] }) });
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
  const [showModal, setShowModal] = useState(false);
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
      /* @__PURE__ */ jsxs("button", { className: "button button--dark", onClick: () => setShowModal(true), children: [
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
        /* @__PURE__ */ jsx("button", { className: "dash-icon-btn dash-icon-btn--danger", onClick: () => remove(set.id), children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) })
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
    showModal && /* @__PURE__ */ jsx(ProductSetModal, { products, onClose: () => setShowModal(false), onSaved: async () => {
      setShowModal(false);
      await router.invalidate();
    } })
  ] });
}
function ProductSetModal({
  products,
  onClose,
  onSaved
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const addItem = () => {
    if (products.length === 0) return;
    setItems([...items, {
      product_id: products[0].id,
      quantity: 1
    }]);
  };
  const submit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSaving(true);
    await createProductSetFn({
      data: {
        name,
        items
      }
    });
    onSaved();
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs("form", { className: "dash-modal dash-modal--wide", onClick: (e) => e.stopPropagation(), onSubmit: submit, children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__header", children: [
      /* @__PURE__ */ jsx("h2", { children: "Add Product Set" }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "dash-modal__close", onClick: onClose, children: /* @__PURE__ */ jsx(X, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__body", children: [
      /* @__PURE__ */ jsxs("label", { className: "dash-field", children: [
        /* @__PURE__ */ jsx("span", { children: "Set Name" }),
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
        }, children: products.map((p) => /* @__PURE__ */ jsx("option", { value: p.id, children: p.name }, p.id)) }),
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
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "dash-modal__footer", children: [
      /* @__PURE__ */ jsx("button", { type: "button", className: "button button--outline", onClick: onClose, children: "Cancel" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "button button--dark", disabled: saving || items.length === 0, children: saving ? "Saving…" : "Save Set" })
    ] })
  ] }) });
}
export {
  InventoryPage as component
};
