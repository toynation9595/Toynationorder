export const ORDER_STATUSES = ["new", "confirmed", "packed", "dispatched", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
