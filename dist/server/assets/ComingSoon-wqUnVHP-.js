import { jsxs, jsx } from "react/jsx-runtime";
import { Sparkles } from "lucide-react";
function ComingSoon({ title, description }) {
  return /* @__PURE__ */ jsxs("div", { className: "dash-page", children: [
    /* @__PURE__ */ jsx("h1", { className: "dash-page__title", children: title }),
    /* @__PURE__ */ jsxs("div", { className: "dash-coming-soon", children: [
      /* @__PURE__ */ jsx(Sparkles, { size: 28 }),
      /* @__PURE__ */ jsx("h2", { children: "Coming Soon" }),
      /* @__PURE__ */ jsx("p", { children: description })
    ] })
  ] });
}
export {
  ComingSoon as C
};
