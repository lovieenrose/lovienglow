import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, redirect, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import { T as TSS_SERVER_FUNCTION, g as getServerFnById, c as createServerFn } from "../server.js";
import { z } from "zod";
const Route$c = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex,nofollow" },
      { title: "Invory — Inventory & Sales Tracker" },
      {
        name: "description",
        content: "An inventory and sales tracker designed to help businesses manage products, monitor sales, and stay organized."
      }
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx("main", { children }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
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
const ownerEstablishSessionFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  fallbackName: z.string().optional(),
  businessType: z.string().optional(),
  currency: z.string().optional()
})).handler(createSsrRpc("10299f3437834ee87c1daeef96c5d08af0944b44547f0de8f4c77c8b3a8f0baf"));
const ownerLogoutFn = createServerFn({
  method: "POST"
}).handler(createSsrRpc("f2d75827ef8dc10e260ddeee91b87ed320b5ab9ad2f30e8b9c9ec28c1f0e6574"));
const verifyOwnerFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fda4d4fb930fb4014572a607255c3886b9d660aff9438452bcee23f3d3d4a9a3"));
const getBusinessProfileFn = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4c45f294f79534727fd56df24f2f613ea47fb3ead4173d7c955571cf67477a64"));
const updateBusinessProfileFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  businessName: z.string().min(1),
  businessType: z.string().optional(),
  fullName: z.string().min(1),
  currency: z.string().min(1),
  logoUrl: z.string().nullable().optional()
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
createServerFn({
  method: "GET"
}).inputValidator(z.object({
  productId: z.string()
})).handler(createSsrRpc("49e922a1d504f7505c4a444cd1ca17e1d39d42b49708b17c7fbad3e623d59118"));
const createProductBatchFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  productId: z.string(),
  batch_name: z.string().min(1),
  quantity: z.number().int().min(0),
  cost_price: z.number().min(0),
  expiration_date: z.string().optional()
})).handler(createSsrRpc("a487e56599fc55262b198a0e03501d5da8d8c88283ceef711a674a876e072336"));
const updateProductBatchFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  batch_name: z.string().min(1).optional(),
  quantity: z.number().int().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  expiration_date: z.string().nullable().optional()
})).handler(createSsrRpc("9c96ff2da26c1a41805bb1a73daab5cf8b1ba32155f6d36765a9c9a34a6f975d"));
const deleteProductBatchFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("488e33c305b7954f0e3e7c71c2141f134f7ba7bed01144b6ed9f5a833ad1f563"));
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
const reorderProductSetsFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  ids: z.array(z.string())
})).handler(createSsrRpc("96ba4f6baed3c26cb75ebb1350b5afdc6a9fab3abc47f5f45f862056be121ed1"));
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
  courier: z.string().optional(),
  shippingPaidBy: z.enum(["customer", "business"]).optional(),
  orderCreatedAt: z.string().optional(),
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
const updateSaleInvoiceItemsFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  invoiceItems: z.array(z.object({
    label: z.string().min(1),
    quantity: z.number().min(0),
    unit_price: z.number().min(0)
  })).nullable()
})).handler(createSsrRpc("daaf158c50ca7bacdfdb1608c6b87c1e1fca8c327c6bf60d85bdfb66248282ef"));
const updateSaleInvoiceTitleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  invoiceTitle: z.string().nullable()
})).handler(createSsrRpc("540a3e19d9d2e1233603812996883d7612853fe32e6ec7e2264336cdf6484aa9"));
const updateSaleInvoiceDiscountFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string(),
  invoiceDiscount: z.number().min(0).nullable()
})).handler(createSsrRpc("e3f9f06ba3e3fd381c9fdb2c7d8bad6ff5784ae85d56bf51b840ff4972f2dfc4"));
const reverseSaleFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("9bf2d518b70dd1b98f525a9282f5eb6f4416e84f3adb442de047180ac9708a6f"));
const deleteSalesOrderFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  id: z.string()
})).handler(createSsrRpc("c75909c225ab7f3500bc1576bc94dfb586518e53ff5bb785f29542132b11e3a6"));
const uploadPaymentProofFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  saleId: z.string(),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(createSsrRpc("d02e2a7047d6a317f1357071b9310a5891fda545e1d48f4085862b5b11c3607f"));
const uploadBusinessLogoFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(createSsrRpc("73f040786083419a97a42c86fea1372825590787c68bacba97300c3a5d256514"));
const uploadProductImageFn = createServerFn({
  method: "POST"
}).inputValidator(z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  base64: z.string().min(1)
})).handler(createSsrRpc("688509404f1eb3f5343ea74d1be4bd9b0c145a64f2d9acb4a6c3ec4e4a9648d0"));
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
const $$splitComponentImporter$9 = () => import("./dashboard-w3b817Fm.js");
const Route$b = createFileRoute("/dashboard")({
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
  loader: async ({
    location
  }) => {
    if (location.pathname === "/dashboard/login") return null;
    return getBusinessProfileFn();
  },
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const Route$a = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  }
});
const $$splitComponentImporter$8 = () => import("./index-B4U3mken.js");
const Route$9 = createFileRoute("/dashboard/")({
  loader: () => getDashboardMetricsFn({
    data: {
      range: "30d"
    }
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./settings-CCdyjKKQ.js");
const Route$8 = createFileRoute("/dashboard/settings")({
  loader: () => getBusinessProfileFn(),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const Route$7 = createFileRoute("/dashboard/products")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/inventory" });
  }
});
const $$splitComponentImporter$6 = () => import("./pos-CdJqfZw0.js");
const Route$6 = createFileRoute("/dashboard/pos")({
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
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
const $$splitComponentImporter$5 = () => import("./login-DTgPOSLz.js");
const Route$5 = createFileRoute("/dashboard/login")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./inventory-DI7nOhc3.js");
const Route$4 = createFileRoute("/dashboard/inventory")({
  loader: async () => {
    const [products, categories, suppliers, productSets] = await Promise.all([listProductsFn(), listCategoriesFn(), listSuppliersFn(), listProductSetsFn()]);
    return {
      products,
      categories,
      suppliers,
      productSets
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./incoming-stock-B_L-Psgc.js");
const Route$3 = createFileRoute("/dashboard/incoming-stock")({
  loader: async () => {
    const [purchaseOrders, suppliers, products] = await Promise.all([listPurchaseOrdersFn(), listSuppliersFn(), listProductsFn()]);
    return {
      purchaseOrders,
      suppliers,
      products
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./expenses-DZ1lg_dk.js");
const Route$2 = createFileRoute("/dashboard/expenses")({
  loader: () => listExpensesFn({
    data: {}
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./emails-Db4AjiJ2.js");
const Route$1 = createFileRoute("/dashboard/emails")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./customers-B5Q2mnk2.js");
const Route = createFileRoute("/dashboard/customers")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const DashboardRoute = Route$b.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => Route$c
});
const IndexRoute = Route$a.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const DashboardIndexRoute = Route$9.update({
  id: "/",
  path: "/",
  getParentRoute: () => DashboardRoute
});
const DashboardSettingsRoute = Route$8.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => DashboardRoute
});
const DashboardProductsRoute = Route$7.update({
  id: "/products",
  path: "/products",
  getParentRoute: () => DashboardRoute
});
const DashboardPosRoute = Route$6.update({
  id: "/pos",
  path: "/pos",
  getParentRoute: () => DashboardRoute
});
const DashboardLoginRoute = Route$5.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => DashboardRoute
});
const DashboardInventoryRoute = Route$4.update({
  id: "/inventory",
  path: "/inventory",
  getParentRoute: () => DashboardRoute
});
const DashboardIncomingStockRoute = Route$3.update({
  id: "/incoming-stock",
  path: "/incoming-stock",
  getParentRoute: () => DashboardRoute
});
const DashboardExpensesRoute = Route$2.update({
  id: "/expenses",
  path: "/expenses",
  getParentRoute: () => DashboardRoute
});
const DashboardEmailsRoute = Route$1.update({
  id: "/emails",
  path: "/emails",
  getParentRoute: () => DashboardRoute
});
const DashboardCustomersRoute = Route.update({
  id: "/customers",
  path: "/customers",
  getParentRoute: () => DashboardRoute
});
const DashboardRouteChildren = {
  DashboardCustomersRoute,
  DashboardEmailsRoute,
  DashboardExpensesRoute,
  DashboardIncomingStockRoute,
  DashboardInventoryRoute,
  DashboardLoginRoute,
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
  DashboardRoute: DashboardRouteWithChildren
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
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
  createProductFn as A,
  adjustProductStockFn as B,
  createCategoryFn as C,
  createSupplierFn as D,
  deleteCategoryFn as E,
  deleteSupplierFn as F,
  updateProductSetFn as G,
  createProductSetFn as H,
  deleteProductBatchFn as I,
  updateProductBatchFn as J,
  createProductBatchFn as K,
  uploadProductImageFn as L,
  Route$3 as M,
  deletePurchaseOrderFn as N,
  createPurchaseOrderFn as O,
  updatePurchaseOrderStatusFn as P,
  receivePurchaseOrderFn as Q,
  Route$b as R,
  Route$2 as S,
  deleteExpenseFn as T,
  router as U,
  Route$9 as a,
  Route$8 as b,
  uploadBusinessLogoFn as c,
  uploadPaymentProofFn as d,
  updateSaleInvoiceItemsFn as e,
  formatPeso as f,
  getDashboardMetricsFn as g,
  updateSaleInvoiceTitleFn as h,
  updateSaleInvoiceDiscountFn as i,
  deleteProductSetFn as j,
  updatePromoFn as k,
  createPromoFn as l,
  markSalePaidFn as m,
  deletePromoFn as n,
  ownerLogoutFn as o,
  Route$6 as p,
  completeSaleFn as q,
  reorderProductSetsFn as r,
  createExpenseFn as s,
  reverseSaleFn as t,
  updateBusinessProfileFn as u,
  deleteSalesOrderFn as v,
  ownerEstablishSessionFn as w,
  Route$4 as x,
  deleteProductFn as y,
  updateProductFn as z
};
