import { jsx, jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate, Outlet, Link } from "@tanstack/react-router";
import { BarChart3, ShoppingCart, PackagePlus, Boxes, Receipt, Users, Mail, Settings, LogOut } from "lucide-react";
import { R as Route, o as ownerLogoutFn } from "./router-2rQkfpAr.js";
import { g as getSupabaseBrowserClient } from "./supabaseClient-1flWYLOz.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
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
  const profile = Route.useLoaderData();
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
      /* @__PURE__ */ jsx("div", { className: "dash-sidebar__brand", children: profile?.logo_url ? /* @__PURE__ */ jsx("img", { src: profile.logo_url, alt: profile.business_name }) : "Invory" }),
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
