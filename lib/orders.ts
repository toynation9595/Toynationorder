import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, orders, orderItems } from "@/lib/db";
import { formatINR, orderLabel } from "@/lib/format";

export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;

export async function getOrderByNo(orderNo: number) {
  if (!Number.isInteger(orderNo)) return null;
  const [o] = await db.select().from(orders).where(eq(orders.orderNo, orderNo)).limit(1);
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id));
  return { order: o, items };
}

export async function getOrderById(id: number) {
  if (!Number.isInteger(id)) return null;
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id)).orderBy(asc(orderItems.id));
  return { order: o, items };
}

export function orderSummaryText(o: OrderRow, items: OrderItemRow[]): string {
  const lines = [
    `*New order ${orderLabel(o.orderNo)}*`,
    `Customer: ${o.customerName}`,
    `Shop: ${o.shopName}`,
    `City: ${o.city}`,
    `Mobile: +91 ${o.mobile}`,
    `Price: ${o.priceType === "wholesale" ? "Wholesale" : "Retail"}`,
    "",
    ...items.map(
      (i, k) => `${k + 1}. ${i.productName} (#${i.productCode}) — ${i.qty} × ${formatINR(i.rate)} = ${formatINR(i.amount)}`
    ),
    "",
    `*Total: ${formatINR(o.total)}*`,
  ];
  return lines.join("\n");
}

export function waLink(mobile10: string, text?: string): string {
  return `https://wa.me/91${mobile10}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
