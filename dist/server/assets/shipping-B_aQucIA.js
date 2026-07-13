const formatPrice = (price) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2
}).format(price);
const paymentMethods = [
  { id: "gcash", label: "GCash", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/gcash.png", note: "Scan the QR or send to the number above." },
  { id: "maya", label: "Maya", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/maya.png", note: "Scan the QR or send to the number above." },
  { id: "bdo", label: "BDO", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BDO Savings Account." },
  { id: "bpi", label: "BPI", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BPI Savings Account." },
  { id: "gotyme", label: "GoTyme", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "GoTyme Save Up Account." },
  { id: "maribank", label: "Maribank", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "Maribank Savings Account." }
];
const couriers = [
  { id: "jnt", label: "J&T Express", note: "Nationwide delivery" },
  { id: "lalamove", label: "Lalamove", note: "Metro Manila only" }
];
const shippingRegions = [
  { id: "luzon", label: "Luzon", fee: 120 },
  { id: "visayas", label: "Visayas", fee: 180 },
  { id: "mindanao", label: "Mindanao", fee: 200 }
];
export {
  couriers as c,
  formatPrice as f,
  paymentMethods as p,
  shippingRegions as s
};
