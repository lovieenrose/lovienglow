const paymentLabels = {
  pending: "Pending Validation",
  confirmed: "Payment Confirmed",
  rejected: "Payment Rejected",
  refunded: "Refunded"
};
const fulfillmentLabels = {
  pending: "Pending",
  processing: "Processing",
  packed: "Packed",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled"
};
const paymentStatusOptions = Object.keys(paymentLabels);
const fulfillmentStatusOptions = Object.keys(fulfillmentLabels);
export {
  paymentStatusOptions as a,
  fulfillmentStatusOptions as b,
  fulfillmentLabels as f,
  paymentLabels as p
};
