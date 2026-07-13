import { jsxs, jsx } from "react/jsx-runtime";
import { useRouter } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { M as Route, N as createExpenseFn, O as deleteExpenseFn } from "./router-CEcpJq9W.js";
import "./shipping-DGz5nmQT.js";
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
function formatPeso(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(value);
}
const CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Supplies", "Transport", "Other"];
function ExpensesPage() {
  const expenses = Route.useLoaderData();
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const add = async (e) => {
    e.preventDefault();
    if (amount <= 0) return;
    setSaving(true);
    await createExpenseFn({
      data: {
        category,
        description: description || void 0,
        amount,
        expense_date: expenseDate
      }
    });
    setDescription("");
    setAmount(0);
    setSaving(false);
    await router.invalidate();
  };
  const remove = async (id) => {
    if (!confirm("Delete this expense?")) return;
    await deleteExpenseFn({
      data: {
        id
      }
    });
    await router.invalidate();
  };
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsxs("div", { className: "dash-toolbar", children: [
      /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: "Expenses" }),
      /* @__PURE__ */ jsx("div", { className: "dash-card", style: {
        padding: "10px 20px"
      }, children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { className: "dash-card__label", children: "Total" }),
        /* @__PURE__ */ jsx("b", { className: "dash-card__value", children: formatPeso(total) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { className: "dash-line-item", style: {
      gridTemplateColumns: "1fr 2fr 1fr 1fr auto",
      marginBottom: "var(--space-lg)"
    }, onSubmit: add, children: [
      /* @__PURE__ */ jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c, children: c }, c)) }),
      /* @__PURE__ */ jsx("input", { placeholder: "Description", value: description, onChange: (e) => setDescription(e.target.value), style: {
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        padding: "9px 12px"
      } }),
      /* @__PURE__ */ jsx("input", { type: "number", min: 0, step: "0.01", placeholder: "Amount", value: amount || "", onChange: (e) => setAmount(Number(e.target.value)), style: {
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        padding: "9px 12px"
      } }),
      /* @__PURE__ */ jsx("input", { type: "date", value: expenseDate, onChange: (e) => setExpenseDate(e.target.value), style: {
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-sm)",
        padding: "9px 12px"
      } }),
      /* @__PURE__ */ jsxs("button", { className: "button button--dark", disabled: saving, children: [
        /* @__PURE__ */ jsx(Plus, { size: 14 }),
        " Add"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "dash-table-wrap", children: /* @__PURE__ */ jsxs("table", { className: "dash-table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Date" }),
        /* @__PURE__ */ jsx("th", { children: "Category" }),
        /* @__PURE__ */ jsx("th", { children: "Description" }),
        /* @__PURE__ */ jsx("th", { children: "Amount" }),
        /* @__PURE__ */ jsx("th", {})
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        expenses.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "dash-table__empty", children: "No expenses recorded." }) }),
        expenses.map((e) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: new Date(e.expense_date).toLocaleDateString("en-PH") }),
          /* @__PURE__ */ jsx("td", { children: e.category }),
          /* @__PURE__ */ jsx("td", { children: e.description ?? "—" }),
          /* @__PURE__ */ jsx("td", { children: formatPeso(e.amount) }),
          /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: () => remove(e.id), children: /* @__PURE__ */ jsx(Trash2, { size: 13 }) }) })
        ] }, e.id))
      ] })
    ] }) })
  ] });
}
export {
  ExpensesPage as component
};
