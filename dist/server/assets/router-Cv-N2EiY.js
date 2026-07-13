import { Link, createRootRoute, useRouterState, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, notFound, createRouter } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Search, X, ShoppingCart, Check, Minus, Plus, ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import { f as formatPrice, s as shippingRegions, p as paymentMethods, c as couriers } from "./shipping-B_aQucIA.js";
import { useState, useEffect, createContext, useContext, useRef } from "react";
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
const listPublicCatalogFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("868bea76e998ff85818e6c2676ad5f8b6f80f0c35ff82c11f0b548d4147e1379"));
const validatePromoCodeFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  code: z.string().min(1),
  cartProductIds: z.array(z.string()),
  subtotal: z.number().min(0),
  customerEmail: z.string().optional()
})).handler(createSsrRpc("8f7963b3ff28b6081255d0c99ac5efcb92b6c67d8e4c0ac7617db24c530f7d79"));
const orderItemSchema = z.object({
  productId: z.string().optional(),
  productSetId: z.string().optional(),
  productName: z.string(),
  unitPrice: z.number(),
  quantity: z.number(),
  lineTotal: z.number()
});
const submitOrderSchema = z.object({
  fullName: z.string().min(1),
  contactNumber: z.string().min(1),
  email: z.string().email(),
  socialHandle: z.string(),
  address: z.string().min(1),
  courier: z.string(),
  region: z.string(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number(),
  shippingFee: z.number(),
  discount: z.number().min(0).optional(),
  promoId: z.string().optional(),
  promoCode: z.string().optional(),
  total: z.number(),
  receiptBase64: z.string().min(1),
  receiptFilename: z.string().min(1),
  receiptContentType: z.string().min(1)
});
const submitOrderFn = createServerFn({
  method: "POST"
}).inputValidator(submitOrderSchema).handler(createSsrRpc("064d14f6f3a2070bd188f3b9743e542e76e323c704d94d1ca754c9bf98e20a16"));
const ownerEstablishSessionFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  fallbackName: z.string().optional()
})).handler(createSsrRpc("10299f3437834ee87c1daeef96c5d08af0944b44547f0de8f4c77c8b3a8f0baf"));
const ownerLogoutFn = createServerFn({
  method: "POST"
}).handler(createSsrRpc("f2d75827ef8dc10e260ddeee91b87ed320b5ab9ad2f30e8b9c9ec28c1f0e6574"));
const verifyOwnerFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fda4d4fb930fb4014572a607255c3886b9d660aff9438452bcee23f3d3d4a9a3"));
const listFiltersSchema = z.object({
  search: z.string().optional(),
  orderStatus: z.string().optional(),
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
  orderStatus: z.enum(["pending_payment", "processing", "shipped", "delivered", "cancelled"]).optional(),
  trackingNumber: z.string().optional(),
  internalNotes: z.string().optional(),
  note: z.string().optional()
});
const updateOrderStatusFn = createServerFn({
  method: "POST"
}).inputValidator(updateOrderSchema).handler(createSsrRpc("ae98de1e3dee0c96f3905503bd835f884b47d468b119b80da7c5f80c8568ecd3"));
const trackOrderFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  trackingCode: z.string().min(1)
})).handler(createSsrRpc("685d51042677bc3394ac487b906af34c3da851230e65a7f963561b55e49b597c"));
const resendOrderEmailFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  reference: z.string(),
  emailType: z.enum(["order_received", "payment_confirmed", "packed", "shipped", "delivered", "admin_notification"])
})).handler(createSsrRpc("309134bb0792e7aa2244e5f84c7191ec668970499dabb9ea885db80692ab6d0c"));
const getBusinessProfileFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4c45f294f79534727fd56df24f2f613ea47fb3ead4173d7c955571cf67477a64"));
const updateBusinessProfileFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  businessName: z.string().min(1),
  fullName: z.string().min(1),
  currency: z.string().min(1)
})).handler(createSsrRpc("ba5bbc9d9ecfb69e2a189942ffbf6a417182e668c6a7a248b871f1a2f3693235"));
const listCategoriesFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0b57467e7080635e7692c2a26813c662de6c260bc67b027c09fee61b0dcf928c"));
const createCategoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1),
  description: z.string().optional()
})).handler(createSsrRpc("f7a3576aca7397baddac55b2609de36302ee2ef43be987fe3f4114bedbb5254f"));
createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional()
})).handler(createSsrRpc("a9483b918339db544d64d476c9b57354eae5e1281d0a47aa3f5fe408bd14aafa"));
const deleteCategoryFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("59bf8389c7996ef2ce09daf9e8bd8b308a5dc01515bfca1064d2fcc48b9c217d"));
const listSuppliersFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("afbcea06f7fe6e1cbb68cb86b039619e1dfacd0f06a9899fae660b3aed31266f"));
const supplierInputSchema = z.object({
  name: z.string().min(1),
  contact_person: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional()
});
const createSupplierFn = createServerFn({
  method: "POST"
}).inputValidator(supplierInputSchema).handler(createSsrRpc("3759bcc60f6eb19501fe19a936a6946eed1092681cdfe47d191a84c4c6d74418"));
createServerFn({
  method: "POST"
}).inputValidator(supplierInputSchema.partial().extend({
  id: z.string()
})).handler(createSsrRpc("ba9d00ebe34d5ea8f9587e033c09c0a7b0904333233bf4f9f6a6bf599779ef2d"));
const deleteSupplierFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("0ce75896ab426783b0c2965b5472a1a2cfd707bdf8e8a1311acf1cbaafeb7d98"));
const listProductsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("71ad6ebba30c47d602641037166202c36c1578a3a3b897d84c7b26458c214f74"));
const productInputSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().nullable().optional(),
  supplier_id: z.string().nullable().optional(),
  cost_price: z.number().min(0),
  selling_price: z.number().min(0),
  stock_quantity: z.number().int().min(0).optional(),
  reorder_level: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  image_url: z.string().optional(),
  description: z.string().optional()
});
const createProductFn = createServerFn({
  method: "POST"
}).inputValidator(productInputSchema).handler(createSsrRpc("15318a775efe948d28a65741f5d012ff59992509f00920b90afc354c60b5318c"));
const updateProductFn = createServerFn({
  method: "POST"
}).inputValidator(productInputSchema.partial().extend({
  id: z.string()
})).handler(createSsrRpc("1ab44a1876c21839bcc1bcc6404fac908605a6b4d1e8d091db44455cbee78a59"));
const deleteProductFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("1004642406249ada20b96efbc0f6b8aa18a1143f6c2a6614f63264ad0179948f"));
const adjustProductStockFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  direction: z.enum(["add", "remove"]),
  quantity: z.number().int().min(1),
  reason: z.string().min(1),
  notes: z.string().optional()
})).handler(createSsrRpc("75a20c891d8b67c1cd296b18ba74cbb9374dca5bf3fa333b46f468c1c74395fa"));
const listProductSetsFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("932981c6a6ab81d970bede89651403da36925d202de032dc4cd97bbdb51f7c6c"));
const createProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1)
  }))
})).handler(createSsrRpc("dccae0677d4fdccec3c8ca2ac51f89b4714523dc0e70c723b554da157344aa7b"));
const deleteProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("d8746b145759685486ef3f5ede21de5c87bc2038bab9994717cb68941a1e02c6"));
const updateProductSetFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.number().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1)
  }))
})).handler(createSsrRpc("bcde8b372609671cbc96aabd006f0fd0eed275c4af65fee9476ad24806a77660"));
const swapProductSetOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  a: z.object({
    id: z.string(),
    sort_order: z.number()
  }),
  b: z.object({
    id: z.string(),
    sort_order: z.number()
  })
})).handler(createSsrRpc("38c305f1f015c66ce8ead0ffc8d9ea299d4e3b49e45a902801446fce5479b866"));
const listPurchaseOrdersFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("63f7e6a3991ec24b103a66803c2fdd6602c06e05d4ca54084f49d92fc8d3435d"));
createServerFn({
  method: "GET"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("8b780f1a226f92aca76b74ddd6c8dc7bdf1a4d8ff2c6401168e2c2bb2a4b0191"));
const createPurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  supplier_id: z.string().nullable().optional(),
  expected_date: z.string().nullable().optional(),
  handling_fee: z.number().min(0).optional(),
  shipping_fee: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity_ordered: z.number().int().min(1),
    unit_cost: z.number().min(0)
  })).min(1)
})).handler(createSsrRpc("c605252bd9c9a2f246dd9972e9fc310f2184f2f7fcb59f4141d4e49c91f66779"));
const updatePurchaseOrderStatusFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  status: z.enum(["pending", "in_transit", "cancelled"])
})).handler(createSsrRpc("a4219df99c35f2b68c3b55b1aabdc1e8e911e409e0ced9d246ce141493434dd6"));
const deletePurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("957d570af43f650bb9e761460ce52181c7d5a3dbe4f6b1f82193b5deeaabdc92"));
const receivePurchaseOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  purchaseOrderId: z.string(),
  items: z.array(z.object({
    purchaseOrderItemId: z.string(),
    quantityReceivedNow: z.number().int().min(0)
  }))
})).handler(createSsrRpc("3603d2dce37e35e26427a30260090e83c2d773119142505c33a438fcc7d4ecab"));
const listSalesOrdersFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().optional()
})).handler(createSsrRpc("8084b5812cf6a19d42de1ebc4c5559c11a71e930644a1c75a6821e6688272c31"));
createServerFn({
  method: "GET"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("96095e92af3c7feb24fd109a7bf9cd536c4f1078aaf929d9e28d65cf88d063f9"));
const completeSaleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  customerName: z.string().optional(),
  customerContact: z.string().optional(),
  discount: z.number().min(0).optional(),
  shippingFee: z.number().min(0).optional(),
  paymentMethod: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0).optional()
  })).min(1)
})).handler(createSsrRpc("63b78c4be65f3edcdc5e0091ebb5b708c1b0c04e8b6b1b22921dfac66ece9a6b"));
const markSalePaidFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  receiptUrl: z.string().optional()
})).handler(createSsrRpc("6ef28ea491d74506002afcf7bd4b22c50c3f3be928866d9f672cc745a0d821f4"));
const reverseSaleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("9bf2d518b70dd1b98f525a9282f5eb6f4416e84f3adb442de047180ac9708a6f"));
const uploadPaymentProofFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  saleId: z.string(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(createSsrRpc("d02e2a7047d6a317f1357071b9310a5891fda545e1d48f4085862b5b11c3607f"));
const uploadInvoiceBannerFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(createSsrRpc("75ccd7b16070f080e64d6ee47b465f2d76564d228314d3e80970cc577d9eec1d"));
const listPromosFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b1f2bd2c3ca066e16f3772c1b7fec5fb3a5399a77d26c274a78825b8c2f6e869"));
const promoInputSchema = z.object({
  code: z.string().min(1),
  reward_type: z.enum(["fixed_discount", "percent_discount", "free_item"]),
  reward_value: z.number().min(0),
  active: z.boolean(),
  trigger_product_ids: z.array(z.string()),
  reward_product_ids: z.array(z.string())
});
const createPromoFn = createServerFn({
  method: "POST"
}).inputValidator(promoInputSchema).handler(createSsrRpc("6eef893dad183c40be94174bf6dc346f75f32b3594b9c6bd95cb653a28d30b74"));
const updatePromoFn = createServerFn({
  method: "POST"
}).inputValidator(promoInputSchema.extend({
  id: z.string()
})).handler(createSsrRpc("06ed50819778d1bfe8fedad3a1d9d4c0226d1965ef6e919ecc81828265d612e0"));
const deletePromoFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("52c688a98a4a55fdf1a1d85cd6797a92b5368a85f23ad23669142e78f2f056ba"));
const listExpensesFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  from: z.string().optional(),
  to: z.string().optional()
})).handler(createSsrRpc("0f6bde79ff8ce27375fd8b98acb9234db2a48e9adb837efef66366330b50dfe0"));
const expenseInputSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().min(0),
  expense_date: z.string(),
  purchase_order_id: z.string().nullable().optional()
});
const createExpenseFn = createServerFn({
  method: "POST"
}).inputValidator(expenseInputSchema).handler(createSsrRpc("ace3f1205d69604ec3ddb9e60e12161db967ebf62ccc35fa59a574591f4e89ed"));
createServerFn({
  method: "POST"
}).inputValidator(expenseInputSchema.partial().extend({
  id: z.string()
})).handler(createSsrRpc("832522675692a4f87501388defd7bc73af2cd2e4a450b40252d4203e82e7c270"));
const deleteExpenseFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("6174528448d11217af3a189afe82fb8f13dd7536945aeba7f711685c8f1d6494"));
const getDashboardMetricsFn = createServerFn({
  method: "GET"
}).inputValidator(z.object({
  range: z.enum(["7d", "30d", "90d", "12m"])
})).handler(createSsrRpc("82b36a8978a10250bf194a4507351ec317b8f0dbd881621219c0900723340bba"));
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
function buildOrderLines(cart, catalog) {
  const lines = [];
  for (const [id, quantity] of Object.entries(cart)) {
    const product = catalog.find((item) => item.id === id);
    if (!product) continue;
    lines.push({
      productId: product.isSet ? void 0 : product.id,
      productSetId: product.isSet ? product.id : void 0,
      name: product.name,
      price: product.price,
      quantity
    });
  }
  return lines;
}
const StoreContext = createContext(null);
function StoreProvider({ children }) {
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
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
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoApplying, setPromoApplying] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState(null);
  useEffect(() => {
    listPublicCatalogFn().then((data) => setCatalog(data)).finally(() => setCatalogLoading(false));
  }, []);
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
  const cartSubtotal = () => buildOrderLines(cart, catalog).reduce((sum, line) => sum + line.price * line.quantity, 0);
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoApplying(true);
    setPromoError("");
    try {
      const cartProductIds = Object.keys(cart);
      const result = await validatePromoCodeFn({
        data: { code: promoCode.trim(), cartProductIds, subtotal: cartSubtotal(), customerEmail: buyer.email || void 0 }
      });
      if (!result.valid) {
        setPromoDiscount(0);
        setAppliedPromoId(null);
        setPromoError(result.message ?? "Invalid promo code.");
        return;
      }
      setPromoDiscount(result.discount);
      setAppliedPromoId(result.promoId ?? null);
    } finally {
      setPromoApplying(false);
    }
  };
  const placeOrder = async () => {
    if (!receiptFile) return null;
    setPlacingOrder(true);
    try {
      const lines = buildOrderLines(cart, catalog);
      const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      const shippingFee = courier === "lalamove" ? 0 : region === "visayas" ? 180 : region === "mindanao" ? 200 : 120;
      const total = Math.max(0, subtotal - promoDiscount) + shippingFee;
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
            productSetId: line.productSetId,
            productName: line.name,
            unitPrice: line.price,
            quantity: line.quantity,
            lineTotal: line.price * line.quantity
          })),
          subtotal,
          shippingFee,
          discount: promoDiscount,
          promoId: appliedPromoId ?? void 0,
          promoCode: appliedPromoId ? promoCode.trim() : void 0,
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
        discount: saved.discount,
        total: saved.total,
        buyer,
        courier,
        region,
        paymentMethod: paymentMethodId,
        receiptName: receiptFile.name
      };
      setLastOrder(order);
      setCart({});
      setPromoCode("");
      setPromoDiscount(0);
      setAppliedPromoId(null);
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
        catalog,
        catalogLoading,
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
        promoCode,
        setPromoCode,
        promoDiscount,
        promoError,
        promoApplying,
        appliedPromoId,
        applyPromoCode,
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
  const { cart, catalog, cartOpen, setCartOpen, updateQuantity, removeFromCart, openCheckout } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({ product: catalog.find((item) => item.id === id), quantity })).filter((line) => Boolean(line.product));
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
      /* @__PURE__ */ jsx(Link, { to: "/track", children: "Track Your Order" }),
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
  const { cart, catalog, updateQuantity, removeFromCart } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({ product: catalog.find((item) => item.id === id), quantity })).filter((line) => Boolean(line.product));
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
const requiredFields = ["fullName", "contactNumber", "email", "address"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function StepDetails({ onBack, onContinue }) {
  const { buyer, setBuyerField, courier, setCourier, region, setRegion } = useStore();
  const [touched, setTouched] = useState(false);
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const isLalamove = courier === "lalamove";
  const valid = requiredFields.every((field) => buyer[field].trim().length > 0) && EMAIL_PATTERN.test(buyer.email.trim());
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
      /* @__PURE__ */ jsxs("label", { className: touched && !EMAIL_PATTERN.test(buyer.email.trim()) ? "has-error" : "", children: [
        /* @__PURE__ */ jsx("span", { children: "Email Address *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: buyer.email,
            onChange: (event) => setBuyerField("email", event.target.value),
            placeholder: "you@email.com",
            autoComplete: "email"
          }
        ),
        touched && !buyer.email && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Email address is required." }),
        touched && buyer.email && !EMAIL_PATTERN.test(buyer.email.trim()) && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Enter a valid email address." })
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
    placeOrder,
    promoCode,
    setPromoCode,
    promoDiscount,
    promoError,
    promoApplying,
    appliedPromoId,
    applyPromoCode
  } = useStore();
  const { lines, subtotal } = useCartLines();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const isLalamove = courier === "lalamove";
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const shippingFee = isLalamove ? 0 : selectedRegion.fee;
  const total = Math.max(0, subtotal - promoDiscount) + shippingFee;
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
      promoDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Discount (",
          promoCode.trim().toUpperCase(),
          ")"
        ] }),
        /* @__PURE__ */ jsxs("b", { children: [
          "-",
          formatPrice(promoDiscount)
        ] })
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
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Promo Code" }),
    /* @__PURE__ */ jsxs("div", { className: "promo-row", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          value: promoCode,
          onChange: (event) => setPromoCode(event.target.value),
          placeholder: "e.g. FIRSTDAY",
          disabled: Boolean(appliedPromoId)
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "button button--outline",
          onClick: applyPromoCode,
          disabled: promoApplying || !promoCode.trim() || Boolean(appliedPromoId),
          children: promoApplying ? "Checking…" : appliedPromoId ? "Applied" : "Apply"
        }
      )
    ] }),
    promoError && !appliedPromoId && /* @__PURE__ */ jsx("p", { className: "field-error", children: promoError }),
    appliedPromoId && /* @__PURE__ */ jsxs("p", { className: "promo-success", children: [
      "Promo applied — you saved ",
      formatPrice(promoDiscount),
      "!"
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
      lastOrder.lines.map((line, i) => /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          line.name,
          " × ",
          line.quantity
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(line.price * line.quantity) })
      ] }, `${line.productId}-${i}`)),
      lastOrder.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsx("span", { children: "Discount" }),
        /* @__PURE__ */ jsxs("b", { children: [
          "-",
          formatPrice(lastOrder.discount)
        ] })
      ] }),
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
const Route$f = createRootRoute({
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isDashboard = pathname.startsWith("/dashboard");
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(StoreProvider, { children: isDashboard ? /* @__PURE__ */ jsx("main", { children }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Header, {}),
        /* @__PURE__ */ jsx("main", { children }),
        /* @__PURE__ */ jsx(Footer, {}),
        /* @__PURE__ */ jsx(CartDrawer, {}),
        /* @__PURE__ */ jsx(CheckoutModal, {}),
        /* @__PURE__ */ jsx(Toast, {})
      ] }) }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$d = () => import("./track-CL9ocF1d.js");
const Route$e = createFileRoute("/track")({
  validateSearch: (search) => ({
    code: typeof search.code === "string" ? search.code : void 0
  }),
  head: () => ({
    meta: [{
      title: "Track Your Order — LovieNGlow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./dashboard-M4k79Lve.js");
const Route$d = createFileRoute("/dashboard")({
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
    } = await verifyOwnerFn();
    if (!valid) throw redirect({
      to: "/dashboard/login"
    });
  },
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./index-BErwA94V.js");
const Route$c = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./index-D7inAPou.js");
const Route$b = createFileRoute("/dashboard/")({
  loader: () => getDashboardMetricsFn({
    data: {
      range: "30d"
    }
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./settings-DXhz-ZIX.js");
const Route$a = createFileRoute("/dashboard/settings")({
  loader: () => getBusinessProfileFn(),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const Route$9 = createFileRoute("/dashboard/products")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/inventory" });
  }
});
const $$splitComponentImporter$8 = () => import("./pos-9-LTZqR8.js");
const Route$8 = createFileRoute("/dashboard/pos")({
  loader: async () => {
    const [products, categories, productSets, promos, salesOrders, businessProfile] = await Promise.all([listProductsFn(), listCategoriesFn(), listProductSetsFn(), listPromosFn(), listSalesOrdersFn({
      data: {}
    }), getBusinessProfileFn()]);
    return {
      products,
      categories,
      productSets,
      promos,
      salesOrders,
      businessProfile
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
const $$splitComponentImporter$7 = () => import("./orders-C0-tx0MU.js");
const Route$7 = createFileRoute("/dashboard/orders")({
  validateSearch: (search) => ({
    search: typeof search.search === "string" ? search.search : "",
    orderStatus: typeof search.orderStatus === "string" ? search.orderStatus : "",
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
      orderStatus: deps.orderStatus || void 0,
      courier: deps.courier || void 0,
      page: deps.page,
      pageSize: 25
    }
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./login-XdyFK4ny.js");
const Route$6 = createFileRoute("/dashboard/login")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./inventory-DI47t6Io.js");
const Route$5 = createFileRoute("/dashboard/inventory")({
  loader: async () => {
    const [products, categories, suppliers, productSets] = await Promise.all([listProductsFn(), listCategoriesFn(), listSuppliersFn(), listProductSetsFn()]);
    return {
      products,
      categories,
      suppliers,
      productSets
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./incoming-stock-DEd2czDn.js");
const Route$4 = createFileRoute("/dashboard/incoming-stock")({
  loader: async () => {
    const [purchaseOrders, suppliers, products] = await Promise.all([listPurchaseOrdersFn(), listSuppliersFn(), listProductsFn()]);
    return {
      purchaseOrders,
      suppliers,
      products
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./expenses-C422qf4b.js");
const Route$3 = createFileRoute("/dashboard/expenses")({
  loader: () => listExpensesFn({
    data: {}
  }),
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
const $$splitComponentImporter = () => import("./orders._ref-DcqSIfLS.js");
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
const TrackRoute = Route$e.update({
  id: "/track",
  path: "/track",
  getParentRoute: () => Route$f
});
const DashboardRoute = Route$d.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$f
});
const IndexRoute = Route$c.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$f
});
const DashboardIndexRoute = Route$b.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardSettingsRoute = Route$a.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => DashboardRoute
});
const DashboardProductsRoute = Route$9.update({
  id: "/products",
  path: "/products",
  getParentRoute: () => DashboardRoute
});
const DashboardPosRoute = Route$8.update({
  id: "/pos",
  path: "/pos",
  getParentRoute: () => DashboardRoute
});
const DashboardOrdersRoute = Route$7.update({
  id: "/orders",
  path: "/orders",
  getParentRoute: () => DashboardRoute
});
const DashboardLoginRoute = Route$6.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => DashboardRoute
});
const DashboardInventoryRoute = Route$5.update({
  id: "/inventory",
  path: "/inventory",
  getParentRoute: () => DashboardRoute
});
const DashboardIncomingStockRoute = Route$4.update({
  id: "/incoming-stock",
  path: "/incoming-stock",
  getParentRoute: () => DashboardRoute
});
const DashboardExpensesRoute = Route$3.update({
  id: "/expenses",
  path: "/expenses",
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
  DashboardExpensesRoute,
  DashboardIncomingStockRoute,
  DashboardInventoryRoute,
  DashboardLoginRoute,
  DashboardOrdersRoute: DashboardOrdersRouteWithChildren,
  DashboardPosRoute,
  DashboardProductsRoute,
  DashboardSettingsRoute,
  DashboardIndexRoute
};
const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  DashboardRoute: DashboardRouteWithChildren,
  TrackRoute
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
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
  updateProductFn as A,
  createProductFn as B,
  adjustProductStockFn as C,
  createCategoryFn as D,
  createSupplierFn as E,
  deleteCategoryFn as F,
  deleteSupplierFn as G,
  Route$4 as H,
  deletePurchaseOrderFn as I,
  createPurchaseOrderFn as J,
  updatePurchaseOrderStatusFn as K,
  receivePurchaseOrderFn as L,
  Route$3 as M,
  createExpenseFn as N,
  deleteExpenseFn as O,
  ProductVisual as P,
  Route as Q,
  Route$e as R,
  updateOrderStatusFn as S,
  resendOrderEmailFn as T,
  router as U,
  Route$b as a,
  Route$a as b,
  updateBusinessProfileFn as c,
  uploadInvoiceBannerFn as d,
  uploadPaymentProofFn as e,
  formatPeso as f,
  getDashboardMetricsFn as g,
  deleteProductSetFn as h,
  updateProductSetFn as i,
  createProductSetFn as j,
  updatePromoFn as k,
  createPromoFn as l,
  markSalePaidFn as m,
  deletePromoFn as n,
  ownerLogoutFn as o,
  Route$8 as p,
  completeSaleFn as q,
  reverseSaleFn as r,
  swapProductSetOrderFn as s,
  trackOrderFn as t,
  useStore as u,
  Route$7 as v,
  exportOrdersCsvFn as w,
  ownerEstablishSessionFn as x,
  Route$5 as y,
  deleteProductFn as z
};
