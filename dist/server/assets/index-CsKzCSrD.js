import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { X, Check, ChevronDown, Minus, Plus, ShoppingCart, Truck, ShieldCheck, Eye, Star, Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import { f as formatPrice, p as products, c as categories } from "./products-DjF4Usiw.js";
import { u as useStore, P as ProductVisual } from "./router-B6tvQDP-.js";
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
function ProductModal({ product, onClose }) {
  const { addToCart, setCartOpen } = useStore();
  const [variant, setVariant] = useState(product.strength[0]);
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const handleAddToCart = () => {
    addToCart(product.id, quantity);
    onClose();
    setCartOpen(true);
  };
  const handleBuyNow = () => {
    addToCart(product.id, quantity);
    setCartOpen(true);
    onClose();
  };
  return /* @__PURE__ */ jsxs("div", { className: "modal-layer product-modal-layer", children: [
    /* @__PURE__ */ jsx("button", { className: "modal-backdrop", onClick: onClose, "aria-label": "Close product details" }),
    /* @__PURE__ */ jsxs("div", { className: "product-modal", role: "dialog", "aria-label": `${product.name} — Product Details`, children: [
      /* @__PURE__ */ jsx("button", { className: "modal-close", onClick: onClose, "aria-label": "Close", children: /* @__PURE__ */ jsx(X, { size: 16 }) }),
      /* @__PURE__ */ jsxs("div", { className: "product-modal__scroll", children: [
        /* @__PURE__ */ jsxs("div", { className: "gallery", children: [
          /* @__PURE__ */ jsx("div", { className: "gallery-thumbs", children: [0, 1, 2].map((item) => /* @__PURE__ */ jsx(
            "button",
            {
              className: image === item ? "active" : "",
              onClick: () => setImage(item),
              "aria-label": `View image ${item + 1}`,
              children: /* @__PURE__ */ jsx(ProductVisual, { product, compact: true })
            },
            item
          )) }),
          /* @__PURE__ */ jsx("div", { className: `gallery-main gallery-main--${image}`, children: /* @__PURE__ */ jsx(ProductVisual, { product }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "purchase-panel", children: [
          /* @__PURE__ */ jsx("span", { className: "product-category-label", children: product.category }),
          /* @__PURE__ */ jsx("h1", { children: product.name }),
          /* @__PURE__ */ jsxs("div", { className: "rating", children: [
            /* @__PURE__ */ jsx("span", { className: "stars", children: "★★★★★" }),
            /* @__PURE__ */ jsx("b", { children: product.rating }),
            /* @__PURE__ */ jsxs("span", { children: [
              product.reviews,
              " reviews"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "detail-price", children: [
            /* @__PURE__ */ jsx("b", { children: formatPrice(product.price) }),
            product.compareAt && /* @__PURE__ */ jsx("del", { children: formatPrice(product.compareAt) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "detail-description", children: product.description }),
          /* @__PURE__ */ jsxs("div", { className: "stock", children: [
            /* @__PURE__ */ jsx("i", {}),
            product.stock < 15 ? `Only ${product.stock} left — order soon` : "In stock and ready to ship"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "variant-picker", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("b", { children: product.form === "jar" || product.form === "bottle" ? "Size" : "Strength" }),
              /* @__PURE__ */ jsx("span", { children: variant })
            ] }),
            /* @__PURE__ */ jsx("div", { children: product.strength.map((option) => /* @__PURE__ */ jsx(
              "button",
              {
                className: variant === option ? "active" : "",
                onClick: () => setVariant(option),
                children: option
              },
              option
            )) })
          ] }),
          product.benefits.length > 0 && /* @__PURE__ */ jsx("ul", { className: "modal-benefits", children: product.benefits.map((benefit) => /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx(Check, { size: 12 }),
            benefit
          ] }, benefit)) }),
          product.included && /* @__PURE__ */ jsxs("div", { className: "modal-included", children: [
            /* @__PURE__ */ jsx("b", { children: "What's included" }),
            /* @__PURE__ */ jsx("div", { children: product.included.map((item) => /* @__PURE__ */ jsx("span", { children: item }, item)) })
          ] }),
          /* @__PURE__ */ jsxs("details", { className: "modal-usage", children: [
            /* @__PURE__ */ jsxs("summary", { children: [
              "Suggested Use ",
              /* @__PURE__ */ jsx(ChevronDown, { size: 14 })
            ] }),
            /* @__PURE__ */ jsx("p", { children: "Use only as directed by your qualified healthcare professional. Review all included preparation and storage guidance before use." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "purchase-actions", children: [
            /* @__PURE__ */ jsxs("div", { className: "quantity", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuantity(Math.max(1, quantity - 1)),
                  "aria-label": "Decrease quantity",
                  children: /* @__PURE__ */ jsx(Minus, { size: 13 })
                }
              ),
              /* @__PURE__ */ jsx("span", { children: quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuantity(quantity + 1),
                  "aria-label": "Increase quantity",
                  children: /* @__PURE__ */ jsx(Plus, { size: 13 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: "button button--dark",
                onClick: handleAddToCart,
                id: `modal-add-to-cart-${product.id}`,
                children: [
                  /* @__PURE__ */ jsx(ShoppingCart, { size: 15 }),
                  " Add to Cart"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "button button--pink button--wide",
              onClick: handleBuyNow,
              id: `modal-buy-now-${product.id}`,
              children: "Buy Now"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "purchase-assurances", children: [
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Truck, { size: 13 }),
              " Discreet delivery"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(ShieldCheck, { size: 13 }),
              " Quality sourced"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              /* @__PURE__ */ jsx(Check, { size: 13 }),
              " Human support"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function ProductCard({ product }) {
  const { addToCart } = useStore();
  const [open, setOpen] = useState(false);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("article", { className: "product-card", children: [
      /* @__PURE__ */ jsxs("div", { className: "product-card__visual", children: [
        /* @__PURE__ */ jsx("button", { className: "visual-open", onClick: () => setOpen(true), "aria-label": `View ${product.name}`, children: /* @__PURE__ */ jsx(ProductVisual, { product }) }),
        /* @__PURE__ */ jsxs("div", { className: "card-badges", children: [
          product.isBestSeller && /* @__PURE__ */ jsx("span", { className: "badge badge--bestseller", children: "Best Seller" }),
          product.isNew && /* @__PURE__ */ jsx("span", { className: "badge badge--new", children: "New" })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "quick-button", onClick: () => setOpen(true), children: [
          /* @__PURE__ */ jsx(Eye, { size: 13 }),
          " Quick View"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "product-card__body", children: [
        /* @__PURE__ */ jsxs("div", { className: "product-meta", children: [
          /* @__PURE__ */ jsx("span", { className: "product-category", children: product.shortCategory }),
          /* @__PURE__ */ jsxs("span", { className: "product-rating", children: [
            /* @__PURE__ */ jsx(Star, { size: 10, fill: "currentColor" }),
            " ",
            product.rating
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "product-card__title", onClick: () => setOpen(true), children: /* @__PURE__ */ jsx("h3", { children: product.name }) }),
        /* @__PURE__ */ jsx("p", { className: "product-card__desc", children: product.shortDescription }),
        /* @__PURE__ */ jsxs("div", { className: "product-card__footer", children: [
          /* @__PURE__ */ jsxs("div", { className: "product-card__price", children: [
            /* @__PURE__ */ jsx("b", { children: formatPrice(product.price) }),
            product.compareAt && /* @__PURE__ */ jsx("del", { children: formatPrice(product.compareAt) })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: "btn-add-cart",
              onClick: () => addToCart(product.id),
              "aria-label": `Add ${product.name} to cart`,
              id: `add-to-cart-${product.id}`,
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 13 }),
                "Add to Cart"
              ]
            }
          )
        ] })
      ] })
    ] }),
    open && /* @__PURE__ */ jsx(ProductModal, { product, onClose: () => setOpen(false) })
  ] });
}
function ShopPage() {
  const {
    query,
    setQuery
  } = useStore();
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(12);
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return [...products].filter((product) => category === "All" || product.category === category).filter((product) => `${product.name} ${product.shortDescription} ${product.category}`.toLowerCase().includes(normalized)).sort((first, second) => {
      if (sort === "newest") return Number(second.isNew) - Number(first.isNew);
      if (sort === "best") return second.reviews - first.reviews;
      if (sort === "price-low") return first.price - second.price;
      if (sort === "price-high") return second.price - first.price;
      if (sort === "name") return first.name.localeCompare(second.name);
      return Number(second.isBestSeller) - Number(first.isBestSeller);
    });
  }, [category, query, sort]);
  return /* @__PURE__ */ jsxs("div", { className: "catalog-page", id: "top", children: [
    /* @__PURE__ */ jsxs("div", { className: "catalog-toolbar", children: [
      /* @__PURE__ */ jsx("div", { className: "toolbar-left", children: /* @__PURE__ */ jsxs("div", { className: "search-field", role: "search", children: [
        /* @__PURE__ */ jsx(Search, { size: 15, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("input", { value: query, onChange: (event) => {
          setQuery(event.target.value);
          setVisible(12);
        }, placeholder: "Search products…", "aria-label": "Search products", id: "product-search" }),
        query && /* @__PURE__ */ jsx("button", { onClick: () => setQuery(""), "aria-label": "Clear search", children: /* @__PURE__ */ jsx(X, { size: 13 }) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "toolbar-right", children: /* @__PURE__ */ jsxs("label", { className: "sort-label", htmlFor: "sort-select", children: [
        /* @__PURE__ */ jsx(SlidersHorizontal, { size: 14, "aria-hidden": "true" }),
        /* @__PURE__ */ jsx("span", { children: "Sort" }),
        /* @__PURE__ */ jsxs("select", { id: "sort-select", value: sort, onChange: (event) => setSort(event.target.value), children: [
          /* @__PURE__ */ jsx("option", { value: "featured", children: "Featured" }),
          /* @__PURE__ */ jsx("option", { value: "newest", children: "Newest" }),
          /* @__PURE__ */ jsx("option", { value: "best", children: "Best Selling" }),
          /* @__PURE__ */ jsx("option", { value: "price-low", children: "Price: Low to High" }),
          /* @__PURE__ */ jsx("option", { value: "price-high", children: "Price: High to Low" }),
          /* @__PURE__ */ jsx("option", { value: "name", children: "Name A–Z" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "category-tabs", role: "tablist", "aria-label": "Product categories", children: categories.map((item) => /* @__PURE__ */ jsx("button", { role: "tab", "aria-selected": category === item, className: category === item ? "active" : "", onClick: () => {
      setCategory(item);
      setVisible(12);
    }, children: item }, item)) }),
    /* @__PURE__ */ jsx("div", { className: "catalog-meta", children: /* @__PURE__ */ jsxs("span", { className: "catalog-count", children: [
      /* @__PURE__ */ jsx("b", { children: filtered.length }),
      " ",
      filtered.length === 1 ? "product" : "products",
      category !== "All" && /* @__PURE__ */ jsxs(Fragment, { children: [
        " in ",
        /* @__PURE__ */ jsx("em", { children: category })
      ] })
    ] }) }),
    filtered.length ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "product-grid catalog-grid", children: filtered.slice(0, visible).map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id)) }),
      visible < filtered.length && /* @__PURE__ */ jsx("div", { className: "load-more-wrap", children: /* @__PURE__ */ jsx("button", { className: "button button--outline load-more", onClick: () => setVisible((current) => current + 8), children: "Load More Products" }) })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "empty-results", children: [
      /* @__PURE__ */ jsx(Search, { size: 32, "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("h2", { children: "No products found" }),
      /* @__PURE__ */ jsx("p", { children: "Try a different search term or clear your filters to browse all products." }),
      /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: () => {
        setQuery("");
        setCategory("All");
      }, children: "View All Products" })
    ] })
  ] });
}
export {
  ShopPage as component
};
