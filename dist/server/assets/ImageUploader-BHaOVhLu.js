import { jsxs, jsx } from "react/jsx-runtime";
import { X, ImagePlus, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { L as uploadProductImageFn } from "./router-2rQkfpAr.js";
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function defaultUpload(file) {
  const base64 = await fileToBase64(file);
  const { url } = await uploadProductImageFn({ data: { filename: file.name, contentType: file.type, base64 } });
  return url;
}
async function uploadFile(file, uploadFn) {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed.");
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image must be ${MAX_SIZE_MB}MB or smaller.`);
  }
  return uploadFn(file);
}
function DropZone({ uploading, onFiles, children }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `image-uploader__dropzone ${dragOver ? "image-uploader__dropzone--over" : ""}`,
      onClick: () => inputRef.current?.click(),
      onDragOver: (e) => {
        e.preventDefault();
        setDragOver(true);
      },
      onDragLeave: () => setDragOver(false),
      onDrop: (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      },
      children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref: inputRef,
            type: "file",
            accept: ACCEPTED_TYPES.join(","),
            hidden: true,
            onChange: (e) => {
              if (e.target.files?.length) onFiles(e.target.files);
              e.target.value = "";
            }
          }
        ),
        uploading ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "image-uploader__spinner" }) : children
      ]
    }
  );
}
function ImageUploaderSingle({
  value,
  onChange,
  upload = defaultUpload,
  alt = "Product"
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const handleFiles = async (files) => {
    setError("");
    setUploading(true);
    try {
      const url = await uploadFile(files[0], upload);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };
  if (value) {
    return /* @__PURE__ */ jsxs("div", { className: "image-uploader__single-preview", children: [
      /* @__PURE__ */ jsx("img", { src: value, alt }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "image-uploader__remove", onClick: () => onChange(""), "aria-label": "Remove image", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "image-uploader", children: [
    /* @__PURE__ */ jsxs(DropZone, { uploading, onFiles: handleFiles, children: [
      /* @__PURE__ */ jsx(ImagePlus, { size: 18 }),
      /* @__PURE__ */ jsx("span", { children: "Drop image or click to upload" }),
      /* @__PURE__ */ jsxs("small", { children: [
        "JPEG, PNG, or WebP — up to ",
        MAX_SIZE_MB,
        "MB"
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "dash-login__error", children: error })
  ] });
}
export {
  ImageUploaderSingle as I
};
