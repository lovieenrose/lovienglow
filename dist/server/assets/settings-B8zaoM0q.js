import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { b as Route, c as updateBusinessProfileFn } from "./router-CZa_PGzA.js";
import "./shipping-B_aQucIA.js";
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
function SettingsPage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "PHP");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateBusinessProfileFn({
      data: {
        businessName,
        fullName,
        currency
      }
    });
    await router.invalidate();
    setSaving(false);
    setSaved(true);
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Settings" }),
    /* @__PURE__ */ jsxs("div", { className: "dash-panel", style: {
      maxWidth: 480
    }, children: [
      /* @__PURE__ */ jsx("h2", { children: "Business Profile" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: submit, style: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)"
      }, children: [
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Business Name" }),
          /* @__PURE__ */ jsx("input", { value: businessName, onChange: (e) => setBusinessName(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Full Name" }),
          /* @__PURE__ */ jsx("input", { value: fullName, onChange: (e) => setFullName(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Currency" }),
          /* @__PURE__ */ jsx("input", { value: currency, onChange: (e) => setCurrency(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "button button--dark", type: "submit", disabled: saving, style: {
          alignSelf: "flex-start"
        }, children: [
          /* @__PURE__ */ jsx(Save, { size: 13 }),
          " ",
          saving ? "Saving…" : "Save Changes"
        ] }),
        saved && /* @__PURE__ */ jsx("p", { className: "dash-login__notice", children: "Saved." })
      ] })
    ] })
  ] });
}
export {
  SettingsPage as component
};
