import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { d as adminLoginFn } from "./router-DtENt4eu.js";
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
function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await adminLoginFn({
        data: {
          email,
          password
        }
      });
      if (!result.success) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      navigate({
        to: "/dashboard"
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "dash-login", children: /* @__PURE__ */ jsxs("form", { className: "dash-login__card", onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsx("div", { className: "dash-login__icon", children: /* @__PURE__ */ jsx(Lock, { size: 20 }) }),
    /* @__PURE__ */ jsx("h1", { children: "LovieNGlow Admin" }),
    /* @__PURE__ */ jsx("p", { children: "Sign in to manage orders." }),
    /* @__PURE__ */ jsxs("label", { children: [
      /* @__PURE__ */ jsx("span", { children: "Email" }),
      /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "username", required: true })
    ] }),
    /* @__PURE__ */ jsxs("label", { children: [
      /* @__PURE__ */ jsx("span", { children: "Password" }),
      /* @__PURE__ */ jsx("input", { type: "password", value: password, onChange: (event) => setPassword(event.target.value), autoComplete: "current-password", required: true })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
    /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 14 }),
      " Signing in…"
    ] }) : "Sign In" })
  ] }) });
}
export {
  LoginPage as component
};
