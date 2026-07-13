const orderStatusLabels = {
  pending_payment: "Pending Payment",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled"
};
const orderStatusBadgeClass = {
  pending_payment: "dash-badge--order-pending_payment",
  processing: "dash-badge--order-processing",
  shipped: "dash-badge--order-shipped",
  delivered: "dash-badge--order-delivered",
  cancelled: "dash-badge--order-cancelled"
};
const orderStatusSteps = ["pending_payment", "processing", "shipped", "delivered"];
export {
  orderStatusBadgeClass as a,
  orderStatusSteps as b,
  orderStatusLabels as o
};
