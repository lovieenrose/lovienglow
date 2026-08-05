import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { useState } from "react";
import { b as Route, u as updateBusinessProfileFn, c as uploadBusinessLogoFn } from "./router-2rQkfpAr.js";
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
function SettingsPage() {
  const profile = Route.useLoaderData();
  const router = useRouter();
  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [businessType, setBusinessType] = useState(profile?.business_type ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [currency, setCurrency] = useState(profile?.currency ?? "PHP");
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await updateBusinessProfileFn({
      data: {
        businessName,
        businessType,
        fullName,
        currency
      }
    });
    await router.invalidate();
    setSaving(false);
    setSaved(true);
  };
  const uploadLogo = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = reader.result;
        const base64 = result.slice(result.indexOf(",") + 1);
        const updated = await uploadBusinessLogoFn({
          data: {
            filename: file.name,
            contentType: file.type,
            base64
          }
        });
        resolve(updated.logo_url ?? "");
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const handleLogoChange = async (url) => {
    setLogoUrl(url);
    if (!url) {
      await updateBusinessProfileFn({
        data: {
          businessName,
          businessType,
          fullName,
          currency,
          logoUrl: null
        }
      });
    }
    await router.invalidate();
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
          /* @__PURE__ */ jsx("span", { children: "Company Logo" }),
          /* @__PURE__ */ jsx(ImageUploaderSingle, { value: logoUrl, onChange: handleLogoChange, upload: uploadLogo, alt: "Company logo" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "dash-field__hint", children: "Shown in the sidebar and on printed invoices. JPEG, PNG, or WebP, up to 5MB." }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Business Name" }),
          /* @__PURE__ */ jsx("input", { value: businessName, onChange: (e) => setBusinessName(e.target.value), required: true })
        ] }),
        /* @__PURE__ */ jsxs("label", { children: [
          /* @__PURE__ */ jsx("span", { children: "Business Type" }),
          /* @__PURE__ */ jsx("input", { placeholder: "e.g. Retail, Wholesale, Skincare Clinic", value: businessType, onChange: (e) => setBusinessType(e.target.value) })
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
