/** Order flow: new → packing → packed → dispatched (+ cancelled). There is no confirmation step. */
export const ORDER_STATUSES = ["new", "packing", "packed", "dispatched", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  packing: "Packing",
  packed: "Packed",
  dispatched: "Dispatched",
  cancelled: "Cancelled",
};

/** What a retailer sees on /my-orders. */
export const RETAILER_STATUS_LABELS: Record<OrderStatus, string> = { ...STATUS_LABELS, packing: "Being packed" };

/** Status changes the owner may make from admin (packing itself happens in /staff). */
export const OWNER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["cancelled"],
  packing: ["cancelled"],
  packed: ["dispatched", "cancelled"],
  dispatched: [],
  cancelled: [],
};
