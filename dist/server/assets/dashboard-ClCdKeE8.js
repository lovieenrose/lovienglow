import { jsx, jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate, Outlet, Link } from "@tanstack/react-router";
import { BarChart3, ShoppingCart, PackagePlus, Boxes, Receipt, ShoppingBag, Users, Mail, Settings, LogOut } from "lucide-react";
import { o as ownerLogoutFn } from "./router-CZa_PGzA.js";
import { g as getSupabaseBrowserClient } from "./supabaseClient-1flWYLOz.js";
import "./shipping-B_aQucIA.js";
import "react";
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
import "@supabase/supabase-js";
const navItems = [{
  to: "/dashboard",
  label: "Dashboard",
  icon: BarChart3,
  exact: true
}, {
  to: "/dashboard/pos",
  label: "Sales (POS)",
  icon: ShoppingCart
}, {
  to: "/dashboard/incoming-stock",
  label: "Incoming Stock",
  icon: PackagePlus
}, {
  to: "/dashboard/inventory",
  label: "Inventory",
  icon: Boxes
}, {
  to: "/dashboard/expenses",
  label: "Expenses",
  icon: Receipt
}, {
  to: "/dashboard/orders",
  label: "Store Orders",
  icon: ShoppingBag
}, {
  to: "/dashboard/customers",
  label: "Customers",
  icon: Users
}, {
  to: "/dashboard/emails",
  label: "Emails",
  icon: Mail
}, {
  to: "/dashboard/settings",
  label: "Settings",
  icon: Settings
}];
function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === "/dashboard/login") {
    return /* @__PURE__ */ jsx(Outlet, {});
  }
  const handleLogout = async () => {
    await getSupabaseBrowserClient().auth.signOut();
    await ownerLogoutFn();
    navigate({
      to: "/dashboard/login"
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-shell", children: [
    /* @__PURE__ */ jsxs("aside", { className: "dash-sidebar", children: [
      /* @__PURE__ */ jsx("div", { className: "dash-sidebar__brand", children: "LovieNGlow" }),
      /* @__PURE__ */ jsx("nav", { className: "dash-sidebar__nav", children: navItems.map((item) => {
        const Icon = item.icon;
        const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
        return /* @__PURE__ */ jsxs(Link, { to: item.to, className: `dash-nav-link ${active ? "is-active" : ""}`, children: [
          /* @__PURE__ */ jsx(Icon, { size: 16 }),
          /* @__PURE__ */ jsx("span", { children: item.label })
        ] }, item.to);
      }) }),
      /* @__PURE__ */ jsxs("button", { className: "dash-sidebar__logout", onClick: handleLogout, children: [
        /* @__PURE__ */ jsx(LogOut, { size: 16 }),
        /* @__PURE__ */ jsx("span", { children: "Log Out" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("main", { className: "dash-main", children: /* @__PURE__ */ jsx(Outlet, {}) })
  ] });
}
export {
  DashboardLayout as component
};
