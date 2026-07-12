import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, notFound, createRouter } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Search, X, ShoppingCart, Check, Minus, Plus, ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import { p as products, f as formatPrice } from "./products-DjF4Usiw.js";
import { useState, createContext, useContext, useRef } from "react";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
import { z } from "zod";
function ProductVisual({ product, compact = false }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `product-visual product-visual--${product.form} ${compact ? "product-visual--compact" : ""}`,
      style: { "--tone": product.palette[0], "--ink": product.palette[1], "--wash": product.palette[2] },
      "aria-label": `${product.name} product presentation`,
      role: "img",
      children: [
        /* @__PURE__ */ jsx("span", { className: "visual-orb visual-orb--one" }),
        /* @__PURE__ */ jsx("span", { className: "visual-orb visual-orb--two" }),
        /* @__PURE__ */ jsxs("div", { className: "product-object", children: [
          /* @__PURE__ */ jsx("span", { className: "product-cap" }),
          /* @__PURE__ */ jsxs("span", { className: "product-label", children: [
            /* @__PURE__ */ jsx("i", { children: "LG" }),
            /* @__PURE__ */ jsx("b", { children: product.name.split(" ")[0] }),
            /* @__PURE__ */ jsx("small", { children: product.shortCategory })
          ] })
        ] }),
        product.form === "set" && /* @__PURE__ */ jsxs("div", { className: "product-object product-object--secondary", children: [
          /* @__PURE__ */ jsx("span", { className: "product-cap" }),
          /* @__PURE__ */ jsxs("span", { className: "product-label", children: [
            /* @__PURE__ */ jsx("i", { children: "LG" }),
            /* @__PURE__ */ jsx("b", { children: "Pure" }),
            /* @__PURE__ */ jsx("small", { children: "bac water" })
          ] })
        ] }),
        product.form === "supply" && /* @__PURE__ */ jsxs("div", { className: "supply-card", children: [
          "ritual",
          /* @__PURE__ */ jsx("br", {}),
          "essentials"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "visual-shadow" })
      ]
    }
  );
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const orderItemSchema = z.object({
  productId: z.number(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number()
});
const submitOrderSchema = z.object({
  fullName: z.string().min(1),
  contactNumber: z.string().min(1),
  email: z.string(),
  socialHandle: z.string(),
  address: z.string().min(1),
  courier: z.string(),
  region: z.string(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number(),
  shippingFee: z.number(),
  total: z.number(),
  receiptBase64: z.string().min(1),
  receiptFilename: z.string().min(1),
  receiptContentType: z.string().min(1)
});
const submitOrderFn = createServerFn({
  method: "POST"
}).inputValidator(submitOrderSchema).handler(createSsrRpc("064d14f6f3a2070bd188f3b9743e542e76e323c704d94d1ca754c9bf98e20a16"));
const adminLoginFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  email: z.string(),
  password: z.string()
})).handler(createSsrRpc("b5d79a62f2ea696c5b87d78cff58af6a89b0580c9013340d4fb5b595b897788e"));
const adminLogoutFn = createServerFn({
  method: "POST"
}).handler(createSsrRpc("43470274709025f0a7d964e6a157857b90e8747ee547ddd70966eb725556d62d"));
const verifyAdminFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("6975ab3f225fad98c98116f277d223680c1181cc5355801e269c5cd6d7a57eb7"));
const listFiltersSchema = z.object({
  search: z.string().optional(),
  paymentStatus: z.string().optional(),
  fulfillmentStatus: z.string().optional(),
  courier: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
});
const getOrdersFn = createServerFn({
  method: "GET"
}).inputValidator(listFiltersSchema).handler(createSsrRpc("6e67e02fbf33a494dc9044cb0d5cddec95a42992e87cb33f8eea83a50ebe0d56"));
const exportOrdersCsvFn = createServerFn({
  method: "GET"
}).inputValidator(listFiltersSchema).handler(createSsrRpc("4caa419df7311540a4fdad8800efb1b003c7d3bef5434f5a5790fa2d7d05ca6c"));
const getOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  reference: z.string()
})).handler(createSsrRpc("8043a5616716260d3cb6bacac09dfef2ab7bd4aa64a6ef2bf0b0cf0581649467"));
const updateOrderSchema = z.object({
  reference: z.string(),
  paymentStatus: z.enum(["pending", "confirmed", "rejected", "refunded"]).optional(),
  fulfillmentStatus: z.enum(["pending", "processing", "packed", "ready_for_pickup", "shipped", "delivered", "completed", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  internalNotes: z.string().optional(),
  note: z.string().optional()
});
const updateOrderStatusFn = createServerFn({
  method: "POST"
}).inputValidator(updateOrderSchema).handler(createSsrRpc("ae98de1e3dee0c96f3905503bd835f884b47d468b119b80da7c5f80c8568ecd3"));
const getInventoryFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("eecd1c438edee933e1e65c2799a7c7ca2df76f1c9dea4176720f7a4df62eed46"));
const updateInventoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  productId: z.number(),
  stock: z.number(),
  lowStockThreshold: z.number()
})).handler(createSsrRpc("12aae7892b451b40fafdec001a0f062e2d9392f6c8ef0ccece5495327a141ebd"));
const getDashboardAnalyticsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("dbbcdafebc1a4c8e685e56052c07093a2f97c6423de77ab9cbb9db2ade60765d"));
const emptyBuyer = { fullName: "", socialHandle: "", contactNumber: "", email: "", address: "" };
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const ORDER_COUNTER_KEY = "lng_order_counter";
function generateReference() {
  if (typeof localStorage === "undefined") return "LNG-000000";
  const last = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) ?? "0", 10);
  const next = last + 1;
  localStorage.setItem(ORDER_COUNTER_KEY, String(next));
  return `LNG-${String(next).padStart(6, "0")}`;
}
const StoreContext = createContext(null);
function StoreProvider({ children }) {
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [courier, setCourier] = useState("jnt");
  const [region, setRegion] = useState("luzon");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [orderReference, setOrderReference] = useState(generateReference);
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const addToCart = (id, quantity = 1) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + quantity }));
    notify("Added to cart");
  };
  const removeFromCart = (id) => {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCart((current) => ({ ...current, [id]: quantity }));
  };
  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutStep(1);
    setOrderReference(generateReference());
    setCheckoutOpen(true);
  };
  const closeCheckout = () => setCheckoutOpen(false);
  const goToStep = (step) => setCheckoutStep(step);
  const setBuyerField = (field, value) => setBuyer((current) => ({ ...current, [field]: value }));
  const placeOrder = async () => {
    if (!receiptFile) return null;
    setPlacingOrder(true);
    try {
      const lines = Object.entries(cart).map(([id, quantity]) => {
        const product = products.find((item) => item.id === Number(id));
        return { productId: product.id, name: product.name, price: product.price, quantity };
      });
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      const shippingFee = courier === "lalamove" ? 0 : region === "visayas" ? 180 : region === "mindanao" ? 200 : 120;
      const total = subtotal + shippingFee;
      const receiptBase64 = await fileToBase64(receiptFile);
      const saved = await submitOrderFn({
        data: {
          fullName: buyer.fullName,
          contactNumber: buyer.contactNumber,
          email: buyer.email,
          socialHandle: buyer.socialHandle,
          address: buyer.address,
          courier,
          region,
          paymentMethod: paymentMethodId,
          items: lines.map((line) => ({
            productId: line.productId,
            productName: line.name,
            unitPrice: line.price,
            quantity: line.quantity,
            lineTotal: line.price * line.quantity
          })),
          subtotal,
          shippingFee,
          total,
          receiptBase64,
          receiptFilename: receiptFile.name,
          receiptContentType: receiptFile.type || "application/octet-stream"
        }
      });
      const order = {
        reference: saved.reference,
        placedAt: saved.placed_at,
        lines,
        subtotal: saved.subtotal,
        shippingFee: saved.shipping_fee,
        total: saved.total,
        buyer,
        courier,
        region,
        paymentMethod: paymentMethodId,
        receiptName: receiptFile.name
      };
      setLastOrder(order);
      setCart({});
      return order;
    } finally {
      setPlacingOrder(false);
    }
  };
  const startNewOrder = () => {
    setLastOrder(null);
    setBuyer(emptyBuyer);
    setCourier("jnt");
    setRegion("luzon");
    setPaymentMethodId("");
    setReceiptFile(null);
    setCheckoutStep(1);
    setOrderReference(generateReference());
    setCheckoutOpen(false);
  };
  return /* @__PURE__ */ jsx(
    StoreContext.Provider,
    {
      value: {
        cart,
        cartOpen,
        toast,
        query,
        setQuery,
        addToCart,
        removeFromCart,
        updateQuantity,
        setCartOpen,
        checkoutOpen,
        checkoutStep,
        openCheckout,
        closeCheckout,
        goToStep,
        buyer,
        setBuyerField,
        courier,
        setCourier,
        region,
        setRegion,
        paymentMethodId,
        setPaymentMethodId,
        receiptFile,
        setReceiptFile,
        orderReference,
        placingOrder,
        lastOrder,
        placeOrder,
        startNewOrder
      },
      children
    }
  );
}
function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
function Header() {
  const { cart, setCartOpen, query, setQuery } = useStore();
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "announcement", children: "Premium peptides, skinboosters & research supplies — all in one shop." }),
    /* @__PURE__ */ jsxs("header", { className: "site-header", children: [
      /* @__PURE__ */ jsx("a", { href: "#top", className: "logo-link", "aria-label": "Go to shop home", children: /* @__PURE__ */ jsx("img", { src: "/lovieNglow-logo-banner.png", alt: "LovieNGlow", className: "site-logo" }) }),
      /* @__PURE__ */ jsxs("div", { className: "header-search", children: [
        /* @__PURE__ */ jsx(Search, { size: 15 }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: "Search products…",
            "aria-label": "Search products"
          }
        ),
        query && /* @__PURE__ */ jsx("button", { onClick: () => setQuery(""), "aria-label": "Clear search", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "header-actions", children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: "icon-button badge-button",
          onClick: () => setCartOpen(true),
          "aria-label": `Shopping cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`,
          id: "cart-button",
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 20 }),
            itemCount > 0 && /* @__PURE__ */ jsx("span", { children: itemCount })
          ]
        }
      ) })
    ] })
  ] });
}
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, openCheckout } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((item) => item.id === Number(id)),
    quantity
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return /* @__PURE__ */ jsxs("div", { className: `drawer-layer ${cartOpen ? "drawer-layer--open" : ""}`, "aria-hidden": !cartOpen, children: [
    /* @__PURE__ */ jsx("button", { className: "drawer-backdrop", onClick: () => setCartOpen(false), "aria-label": "Close cart" }),
    /* @__PURE__ */ jsxs("aside", { className: "cart-drawer", role: "dialog", "aria-label": "Shopping cart", children: [
      /* @__PURE__ */ jsxs("div", { className: "drawer-header", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "Your Cart" }),
          lines.length > 0 && /* @__PURE__ */ jsxs("span", { className: "cart-count", children: [
            lines.length,
            " item",
            lines.length !== 1 ? "s" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "icon-button", onClick: () => setCartOpen(false), "aria-label": "Close cart", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      lines.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "empty-cart", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { size: 36, strokeWidth: 1.3 }),
        /* @__PURE__ */ jsx("h3", { children: "Your cart is empty" }),
        /* @__PURE__ */ jsx("p", { children: "Add products to your cart to get started." }),
        /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: () => setCartOpen(false), children: "Continue Shopping" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "cart-lines", children: lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "cart-line", children: [
          /* @__PURE__ */ jsx(ProductVisual, { product, compact: true }),
          /* @__PURE__ */ jsxs("div", { className: "cart-line__info", children: [
            /* @__PURE__ */ jsx("h3", { children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "cart-line__variant", children: product.strength[0] }),
            /* @__PURE__ */ jsxs("p", { className: "cart-line__unit-price", children: [
              formatPrice(product.price),
              " each"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "quantity", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(product.id, quantity - 1),
                  "aria-label": "Decrease quantity",
                  children: "−"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(product.id, quantity + 1),
                  "aria-label": "Increase quantity",
                  children: "+"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "cart-price", children: [
            /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) }),
            /* @__PURE__ */ jsx("button", { onClick: () => removeFromCart(product.id), "aria-label": `Remove ${product.name}`, children: "Remove" })
          ] })
        ] }, product.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "cart-footer", children: [
          /* @__PURE__ */ jsxs("div", { className: "cart-subtotal", children: [
            /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
            /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "cart-shipping-note", children: "Shipping calculated at checkout." }),
          /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: openCheckout, id: "checkout-button", children: "Checkout" })
        ] })
      ] })
    ] })
  ] });
}
function Footer() {
  return /* @__PURE__ */ jsxs("footer", { className: "site-footer", children: [
    /* @__PURE__ */ jsxs("div", { className: "footer-brand", children: [
      /* @__PURE__ */ jsx("img", { src: "/lovieNglow-logo-banner.png", alt: "LovieNGlow", className: "site-logo site-logo--footer" }),
      /* @__PURE__ */ jsx("p", { className: "footer-tagline", children: "Premium peptides, skinboosters & research supplies." })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "footer-links", "aria-label": "Footer navigation", children: [
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", children: "Contact" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Shipping & Returns" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Privacy Policy" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Terms & Conditions" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "footer-right", children: [
      /* @__PURE__ */ jsxs("div", { className: "footer-social", children: [
        /* @__PURE__ */ jsx("a", { href: "#top", "aria-label": "Instagram", className: "social-link", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }),
          /* @__PURE__ */ jsx("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }),
          /* @__PURE__ */ jsx("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" })
        ] }) }),
        /* @__PURE__ */ jsx("a", { href: "#top", "aria-label": "TikTok", className: "social-link", children: /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" }) }) })
      ] }),
      /* @__PURE__ */ jsx("small", { className: "footer-copy", children: "© 2026 LovieNGlow. For research and wellness education only. Always consult a qualified professional." })
    ] })
  ] });
}
function Toast() {
  const { toast } = useStore();
  return /* @__PURE__ */ jsxs("div", { className: `toast ${toast ? "toast--visible" : ""}`, role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ jsx(Check, { size: 14 }),
    toast
  ] });
}
const paymentMethods = [
  { id: "gcash", label: "GCash", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/gcash.png", note: "Scan the QR or send to the number above." },
  { id: "maya", label: "Maya", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/maya.png", note: "Scan the QR or send to the number above." },
  { id: "bdo", label: "BDO", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BDO Savings Account." },
  { id: "bpi", label: "BPI", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BPI Savings Account." },
  { id: "gotyme", label: "GoTyme", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "GoTyme Save Up Account." },
  { id: "maribank", label: "Maribank", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "Maribank Savings Account." }
];
const couriers = [
  { id: "jnt", label: "J&T Express", note: "Nationwide delivery" },
  { id: "lalamove", label: "Lalamove", note: "Metro Manila only" }
];
const shippingRegions = [
  { id: "luzon", label: "Luzon", fee: 120 },
  { id: "visayas", label: "Visayas", fee: 180 },
  { id: "mindanao", label: "Mindanao", fee: 200 }
];
const steps = [
  { number: 1, label: "Order" },
  { number: 2, label: "Shipping Details" },
  { number: 3, label: "Payment" }
];
function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, goToStep, lastOrder, startNewOrder } = useStore();
  if (!checkoutOpen) return null;
  return /* @__PURE__ */ jsxs("div", { className: "modal-layer checkout-layer", "aria-hidden": !checkoutOpen, children: [
    /* @__PURE__ */ jsx("button", { className: "modal-backdrop", onClick: closeCheckout, "aria-label": "Close checkout" }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-modal", role: "dialog", "aria-label": "Checkout", children: [
      /* @__PURE__ */ jsx("button", { className: "modal-close", onClick: closeCheckout, "aria-label": "Close checkout", children: /* @__PURE__ */ jsx(X, { size: 16 }) }),
      lastOrder ? /* @__PURE__ */ jsx(OrderConfirmed, { onDone: startNewOrder }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "checkout-progress", children: steps.map((step) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `checkout-progress__step ${checkoutStep === step.number ? "is-active" : ""} ${checkoutStep > step.number ? "is-done" : ""}`,
            children: [
              /* @__PURE__ */ jsx("span", { children: checkoutStep > step.number ? /* @__PURE__ */ jsx(Check, { size: 12 }) : step.number }),
              /* @__PURE__ */ jsx("b", { children: step.label })
            ]
          },
          step.number
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "checkout-body", children: [
          checkoutStep === 1 && /* @__PURE__ */ jsx(StepOrder, { onContinue: () => goToStep(2) }),
          checkoutStep === 2 && /* @__PURE__ */ jsx(StepDetails, { onBack: () => goToStep(1), onContinue: () => goToStep(3) }),
          checkoutStep === 3 && /* @__PURE__ */ jsx(StepPayment, { onBack: () => goToStep(2) })
        ] })
      ] })
    ] })
  ] });
}
function useCartLines() {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((item) => item.id === Number(id)),
    quantity
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return { lines, subtotal, updateQuantity, removeFromCart };
}
function StepOrder({ onContinue }) {
  const { lines, subtotal, updateQuantity, removeFromCart } = useCartLines();
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Order Summary" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Review your items and adjust quantities before continuing." }),
    /* @__PURE__ */ jsx("div", { className: "order-card", children: lines.length === 0 ? /* @__PURE__ */ jsx("p", { className: "order-empty", children: "Your cart is empty. Close this window and add products first." }) : lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "order-line", children: [
      /* @__PURE__ */ jsx(ProductVisual, { product, compact: true }),
      /* @__PURE__ */ jsxs("div", { className: "order-line__info", children: [
        /* @__PURE__ */ jsx("h3", { children: product.name }),
        /* @__PURE__ */ jsxs("span", { children: [
          formatPrice(product.price),
          " each"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "quantity", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => updateQuantity(product.id, quantity - 1),
            "aria-label": "Decrease quantity",
            children: /* @__PURE__ */ jsx(Minus, { size: 12 })
          }
        ),
        /* @__PURE__ */ jsx("span", { children: quantity }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => updateQuantity(product.id, quantity + 1),
            "aria-label": "Increase quantity",
            children: /* @__PURE__ */ jsx(Plus, { size: 12 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "order-line__price", children: [
        /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) }),
        /* @__PURE__ */ jsx("button", { onClick: () => removeFromCart(product.id), children: "Remove" })
      ] })
    ] }, product.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer", children: [
      /* @__PURE__ */ jsxs("div", { className: "checkout-total-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Items Subtotal" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark button--wide",
          disabled: !lines.length,
          onClick: onContinue,
          id: "checkout-continue-to-shipping",
          children: "Continue to Shipping"
        }
      )
    ] })
  ] });
}
const requiredFields = ["fullName", "contactNumber", "address"];
function StepDetails({ onBack, onContinue }) {
  const { buyer, setBuyerField, courier, setCourier, region, setRegion } = useStore();
  const [touched, setTouched] = useState(false);
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const isLalamove = courier === "lalamove";
  const valid = requiredFields.every((field) => buyer[field].trim().length > 0);
  const handleContinue = () => {
    setTouched(true);
    if (valid) onContinue();
  };
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Shipping Details" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Enter your delivery information. Fields marked with * are required." }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-form", children: [
      /* @__PURE__ */ jsxs("label", { className: touched && !buyer.fullName ? "has-error" : "", children: [
        /* @__PURE__ */ jsx("span", { children: "Full Name *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.fullName,
            onChange: (event) => setBuyerField("fullName", event.target.value),
            placeholder: "e.g. Juana Dela Cruz",
            autoComplete: "name"
          }
        ),
        touched && !buyer.fullName && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Full name is required." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: touched && !buyer.contactNumber ? "has-error" : "", children: [
        /* @__PURE__ */ jsx("span", { children: "Contact Number *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.contactNumber,
            onChange: (event) => setBuyerField("contactNumber", event.target.value),
            placeholder: "09XX XXX XXXX",
            type: "tel",
            autoComplete: "tel"
          }
        ),
        touched && !buyer.contactNumber && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Contact number is required." })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Email Address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: buyer.email,
            onChange: (event) => setBuyerField("email", event.target.value),
            placeholder: "you@email.com (optional)",
            autoComplete: "email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Discord / Social Handle" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.socialHandle,
            onChange: (event) => setBuyerField("socialHandle", event.target.value),
            placeholder: "@username (optional)"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: `span-2 ${touched && !buyer.address ? "has-error" : ""}`, children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Address *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: buyer.address,
            onChange: (event) => setBuyerField("address", event.target.value),
            placeholder: "House/unit, street, barangay, city, province",
            rows: 3,
            autoComplete: "street-address"
          }
        ),
        touched && !buyer.address && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Delivery address is required." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Courier" }),
    /* @__PURE__ */ jsx("div", { className: "option-grid", children: couriers.map((item) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: `option-tile ${courier === item.id ? "is-active" : ""}`,
        onClick: () => setCourier(item.id),
        children: [
          /* @__PURE__ */ jsx("b", { children: item.label }),
          /* @__PURE__ */ jsx("span", { children: item.note })
        ]
      },
      item.id
    )) }),
    isLalamove ? /* @__PURE__ */ jsxs("div", { className: "checkout-notice checkout-notice--lalamove", role: "note", children: [
      /* @__PURE__ */ jsx("strong", { children: "Choosing Lalamove?" }),
      " Please get in touch with us at",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", className: "notice-link", children: "lovin.glow.ph@gmail.com" }),
      " ",
      "to arrange your booking.",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("strong", { children: "Note:" }),
      " The delivery fee is handled separately and will",
      " ",
      /* @__PURE__ */ jsx("em", { children: "not" }),
      " be charged at checkout."
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Shipping Region" }),
      /* @__PURE__ */ jsx("div", { className: "option-grid option-grid--three", children: shippingRegions.map((item) => /* @__PURE__ */ jsxs(
        "button",
        {
          className: `option-tile ${region === item.id ? "is-active" : ""}`,
          onClick: () => setRegion(item.id),
          children: [
            /* @__PURE__ */ jsx("b", { children: item.label }),
            /* @__PURE__ */ jsx("span", { children: formatPrice(item.fee) })
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "checkout-notice", children: [
        /* @__PURE__ */ jsx("strong", { children: "Note:" }),
        " Shipping fees are estimates and may vary depending on package weight and the number of parcels. Your selected region (",
        selectedRegion.label,
        ") adds",
        " ",
        formatPrice(selectedRegion.fee),
        " to your total."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer checkout-footer--split", children: [
      /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: onBack, id: "checkout-back-to-order", children: "Back" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark",
          onClick: handleContinue,
          id: "checkout-continue-to-payment",
          children: "Continue to Payment"
        }
      )
    ] })
  ] });
}
function StepPayment({ onBack }) {
  const {
    paymentMethodId,
    setPaymentMethodId,
    receiptFile,
    setReceiptFile,
    region,
    courier,
    orderReference,
    placingOrder,
    placeOrder
  } = useStore();
  const { lines, subtotal } = useCartLines();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const isLalamove = courier === "lalamove";
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const shippingFee = isLalamove ? 0 : selectedRegion.fee;
  const total = subtotal + shippingFee;
  const method = paymentMethods.find((item) => item.id === paymentMethodId);
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;
    setReceiptFile(file);
  };
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Payment" }),
    /* @__PURE__ */ jsxs("p", { className: "checkout-step__hint", children: [
      "Order Reference: ",
      /* @__PURE__ */ jsx("b", { className: "order-ref", children: orderReference })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-card order-card--summary", children: [
      lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          product.name,
          " × ",
          quantity
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) })
      ] }, product.id)),
      /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsx("span", { children: "Order Subtotal" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "summary-line", children: isLalamove ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
        /* @__PURE__ */ jsx("b", { className: "shipping-arranged", children: "Arranged separately" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Shipping Fee (",
          selectedRegion.label,
          ")"
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(shippingFee) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "summary-line summary-line--total", children: [
        /* @__PURE__ */ jsx("span", { children: "Total Amount Due" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(total) })
      ] })
    ] }),
    isLalamove && /* @__PURE__ */ jsxs("div", { className: "checkout-notice checkout-notice--lalamove", role: "note", children: [
      /* @__PURE__ */ jsx("strong", { children: "Lalamove delivery fee not included." }),
      " Please contact us at",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", className: "notice-link", children: "lovin.glow.ph@gmail.com" }),
      " ",
      "to coordinate your booking after placing your order."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Payment Method" }),
    /* @__PURE__ */ jsx("div", { className: "payment-grid", children: paymentMethods.map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        className: `payment-pill ${paymentMethodId === item.id ? "is-active" : ""}`,
        onClick: () => setPaymentMethodId(item.id),
        children: item.label
      },
      item.id
    )) }),
    method && /* @__PURE__ */ jsxs("div", { className: "payment-details", children: [
      method.qrImage && /* @__PURE__ */ jsx(
        "img",
        {
          src: method.qrImage,
          alt: `${method.label} QR code`,
          className: "payment-qr",
          onError: (event) => {
            event.target.style.display = "none";
          }
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: method.accountName }),
        /* @__PURE__ */ jsx("span", { children: method.accountNumber }),
        method.note && /* @__PURE__ */ jsx("p", { children: method.note })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Upload Payment Receipt" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Attach your GCash, Maya, or bank transfer receipt (image or PDF)." }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `upload-zone ${dragOver ? "is-drag" : ""} ${receiptFile ? "has-file" : ""}`,
        onDragOver: (event) => {
          event.preventDefault();
          setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop: (event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files?.[0]);
        },
        onClick: () => inputRef.current?.click(),
        role: "button",
        tabIndex: 0,
        "aria-label": "Upload payment receipt",
        onKeyDown: (e) => e.key === "Enter" && inputRef.current?.click(),
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: "image/*,application/pdf",
              hidden: true,
              onChange: (event) => handleFile(event.target.files?.[0])
            }
          ),
          receiptFile ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ImagePlus, { size: 24 }),
            /* @__PURE__ */ jsx("b", { children: receiptFile.name }),
            /* @__PURE__ */ jsx("span", { children: "Click to replace" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(UploadCloud, { size: 24 }),
            /* @__PURE__ */ jsx("b", { children: "Drag & drop your receipt here" }),
            /* @__PURE__ */ jsx("span", { children: "or click to browse — JPG, PNG, or PDF" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer checkout-footer--split", children: [
      /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: onBack, id: "checkout-back-to-shipping", children: "Back" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark",
          disabled: !method || !receiptFile || placingOrder,
          onClick: placeOrder,
          id: "place-order-button",
          children: placingOrder ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 14 }),
            " Placing Order…"
          ] }) : "Place Order"
        }
      )
    ] })
  ] });
}
function OrderConfirmed({ onDone }) {
  const { lastOrder } = useStore();
  if (!lastOrder) return null;
  const region = shippingRegions.find((item) => item.id === lastOrder.region);
  const method = paymentMethods.find((item) => item.id === lastOrder.paymentMethod);
  const isLalamove = lastOrder.courier === "lalamove";
  const placedDate = new Date(lastOrder.placedAt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return /* @__PURE__ */ jsxs("div", { className: "order-confirmed", children: [
    /* @__PURE__ */ jsx("span", { className: "order-confirmed__icon", children: /* @__PURE__ */ jsx(Check, { size: 24 }) }),
    /* @__PURE__ */ jsx("span", { className: "confirmed-label", children: "Order Placed Successfully" }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Thank you, ",
      lastOrder.buyer.fullName.split(" ")[0] || "for your order",
      "!"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Your order reference is ",
      /* @__PURE__ */ jsx("b", { children: lastOrder.reference }),
      ". We are verifying your payment and will reach out to you shortly."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-card order-card--summary", children: [
      lastOrder.lines.map((line) => /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          line.name,
          " × ",
          line.quantity
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(line.price * line.quantity) })
      ] }, line.productId)),
      /* @__PURE__ */ jsx("div", { className: "summary-line", children: isLalamove ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
        /* @__PURE__ */ jsx("b", { className: "shipping-arranged", children: "Arranged separately" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Shipping Fee (",
          region?.label,
          ")"
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(lastOrder.shippingFee) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "summary-line summary-line--total", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Total Paid via ",
          method?.label
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(lastOrder.total) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-confirmed__meta", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Date & Time" }),
        /* @__PURE__ */ jsx("b", { children: placedDate })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Address" }),
        /* @__PURE__ */ jsx("b", { children: lastOrder.buyer.address })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Receipt on File" }),
        /* @__PURE__ */ jsx("b", { children: lastOrder.receiptName })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: onDone, id: "continue-shopping-btn", children: "Continue Shopping" })
  ] });
}
const Route$b = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        name: "description",
        content: "Shop premium GLP peptides, skinboosters, topicals, liquid blends, research waters, and essential supplies. Fast, discreet delivery."
      },
      { property: "og:title", content: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        property: "og:description",
        content: "A premium one-stop shop for peptide beauty products and research essentials. Browse the full catalog and order online."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        name: "twitter:description",
        content: "Premium peptides, skinboosters, topicals, and research supplies. Order online with secure payment."
      }
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsxs(StoreProvider, { children: [
        /* @__PURE__ */ jsx(Header, {}),
        /* @__PURE__ */ jsx("main", { children }),
        /* @__PURE__ */ jsx(Footer, {}),
        /* @__PURE__ */ jsx(CartDrawer, {}),
        /* @__PURE__ */ jsx(CheckoutModal, {}),
        /* @__PURE__ */ jsx(Toast, {})
      ] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$a = () => import("./dashboard-DqIOiPwq.js");
const Route$a = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  beforeLoad: async ({
    location
  }) => {
    if (location.pathname === "/dashboard/login") return;
    const {
      valid
    } = await verifyAdminFn();
    if (!valid) throw redirect({
      to: "/dashboard/login"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./index-Cbw3YYKw.js");
const Route$9 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./index-Bk9Dl-Q0.js");
const Route$8 = createFileRoute("/dashboard/")({
  loader: () => getDashboardAnalyticsFn(),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./settings-BQcSn7XF.js");
const Route$7 = createFileRoute("/dashboard/settings")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./products-CMr9V0Yh.js");
const Route$6 = createFileRoute("/dashboard/products")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./orders-C6GlNNg6.js");
const Route$5 = createFileRoute("/dashboard/orders")({
  validateSearch: (search) => ({
    search: typeof search.search === "string" ? search.search : "",
    paymentStatus: typeof search.paymentStatus === "string" ? search.paymentStatus : "",
    fulfillmentStatus: typeof search.fulfillmentStatus === "string" ? search.fulfillmentStatus : "",
    courier: typeof search.courier === "string" ? search.courier : "",
    page: Number(search.page) || 1
  }),
  loaderDeps: ({
    search
  }) => search,
  loader: ({
    deps
  }) => getOrdersFn({
    data: {
      search: deps.search || void 0,
      paymentStatus: deps.paymentStatus || void 0,
      fulfillmentStatus: deps.fulfillmentStatus || void 0,
      courier: deps.courier || void 0,
      page: deps.page,
      pageSize: 25
    }
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./login-0Mim_wC5.js");
const Route$4 = createFileRoute("/dashboard/login")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./inventory-8Y8XB00f.js");
const Route$3 = createFileRoute("/dashboard/inventory")({
  loader: () => getInventoryFn(),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./emails-Db4AjiJ2.js");
const Route$2 = createFileRoute("/dashboard/emails")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./customers-B5Q2mnk2.js");
const Route$1 = createFileRoute("/dashboard/customers")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./orders._ref-CdI0PzV8.js");
const Route = createFileRoute("/dashboard/orders/$ref")({
  loader: async ({
    params
  }) => {
    const order = await getOrderFn({
      data: {
        reference: params.ref
      }
    });
    if (!order) throw notFound();
    return order;
  },
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const DashboardRoute = Route$a.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$b
});
const IndexRoute = Route$9.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$b
});
const DashboardIndexRoute = Route$8.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardSettingsRoute = Route$7.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => DashboardRoute
});
const DashboardProductsRoute = Route$6.update({
  id: "/products",
  path: "/products",
  getParentRoute: () => DashboardRoute
});
const DashboardOrdersRoute = Route$5.update({
  id: "/orders",
  path: "/orders",
  getParentRoute: () => DashboardRoute
});
const DashboardLoginRoute = Route$4.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => DashboardRoute
});
const DashboardInventoryRoute = Route$3.update({
  id: "/inventory",
  path: "/inventory",
  getParentRoute: () => DashboardRoute
});
const DashboardEmailsRoute = Route$2.update({
  id: "/emails",
  path: "/emails",
  getParentRoute: () => DashboardRoute
});
const DashboardCustomersRoute = Route$1.update({
  id: "/customers",
  path: "/customers",
  getParentRoute: () => DashboardRoute
});
const DashboardOrdersRefRoute = Route.update({
  id: "/$ref",
  path: "/$ref",
  getParentRoute: () => DashboardOrdersRoute
});
const DashboardOrdersRouteChildren = {
  DashboardOrdersRefRoute
};
const DashboardOrdersRouteWithChildren = DashboardOrdersRoute._addFileChildren(
  DashboardOrdersRouteChildren
);
const DashboardRouteChildren = {
  DashboardCustomersRoute,
  DashboardEmailsRoute,
  DashboardInventoryRoute,
  DashboardLoginRoute,
  DashboardOrdersRoute: DashboardOrdersRouteWithChildren,
  DashboardProductsRoute,
  DashboardSettingsRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute: DashboardRouteWithChildren
};
const routeTree = Route$b._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  ProductVisual as P,
  Route$8 as R,
  adminLogoutFn as a,
  Route$5 as b,
  couriers as c,
  adminLoginFn as d,
  exportOrdersCsvFn as e,
  Route$3 as f,
  updateInventoryFn as g,
  Route as h,
  updateOrderStatusFn as i,
  paymentMethods as p,
  router as r,
  shippingRegions as s,
  useStore as u
};
