import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { w as ownerEstablishSessionFn } from "./router-B6tvQDP-.js";
import { g as getSupabaseBrowserClient } from "./supabaseClient-1flWYLOz.js";
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
import "@supabase/supabase-js";
function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("sign_in");
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (mode === "sign_up") {
        const {
          data: data2,
          error: signUpError
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              business_name: businessName,
              full_name: fullName
            }
          }
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        if (!data2.session) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("sign_in");
          setLoading(false);
          return;
        }
        await ownerEstablishSessionFn({
          data: {
            accessToken: data2.session.access_token,
            refreshToken: data2.session.refresh_token,
            fallbackName: businessName || fullName
          }
        });
        navigate({
          to: "/dashboard"
        });
        return;
      }
      const {
        data,
        error: signInError
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInError || !data.session) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      await ownerEstablishSessionFn({
        data: {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }
      });
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
    /* @__PURE__ */ jsx("p", { children: mode === "sign_in" ? "Sign in to manage your business." : "Create your business account." }),
    mode === "sign_up" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Business Name" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: businessName, onChange: (event) => setBusinessName(event.target.value), required: true })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Your Full Name" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: fullName, onChange: (event) => setFullName(event.target.value), required: true })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("label", { children: [
      /* @__PURE__ */ jsx("span", { children: "Email" }),
      /* @__PURE__ */ jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), autoComplete: "username", required: true })
    ] }),
    /* @__PURE__ */ jsxs("label", { children: [
      /* @__PURE__ */ jsx("span", { children: "Password" }),
      /* @__PURE__ */ jsx("input", { type: "password", value: password, onChange: (event) => setPassword(event.target.value), autoComplete: mode === "sign_in" ? "current-password" : "new-password", minLength: 6, required: true })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error }),
    notice && /* @__PURE__ */ jsx("p", { className: "dash-login__notice", children: notice }),
    /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", type: "submit", disabled: loading, children: loading ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 14 }),
      " ",
      mode === "sign_in" ? "Signing in…" : "Creating account…"
    ] }) : mode === "sign_in" ? "Sign In" : "Create Account" }),
    /* @__PURE__ */ jsx("button", { type: "button", className: "dash-login__switch", onClick: () => {
      setMode(mode === "sign_in" ? "sign_up" : "sign_in");
      setError("");
      setNotice("");
    }, children: mode === "sign_in" ? "Don't have a business account? Sign up" : "Already have an account? Sign in" })
  ] }) });
}
export {
  LoginPage as component
};
