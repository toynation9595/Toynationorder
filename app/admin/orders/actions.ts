"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders, orderItems, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { lockAvailability, RESERVING_STATUSES } from "@/lib/stock";

export type UpdateOrderState = { error?: string; ok?: string; released?: boolean };

const reserves = (s: string) => (RESERVING_STATUSES as readonly string[]).includes(s);

export async function updateOrder(_prev: UpdateOrderState, form: FormData): Promise<UpdateOrderState> {
  await requireOwner();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "") as OrderStatus;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000);
  if (!id || !ORDER_STATUSES.includes(status)) return { error: "Invalid status." };

  // Runs on the Neon Pool (websocket) driver so the row locks hold for the whole transaction.
  const result = await db.transaction(async (tx) => {
    const [o] = await tx
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id))
      .for("update");
    if (!o) return { error: "Order not found." };

    // Moving an order into a stock-holding status (e.g. new → confirmed): lock products and re-check.
    if (status !== o.status && reserves(status) && !reserves(o.status)) {
      const items = await tx
        .select({ barcode: orderItems.barcode, name: orderItems.productName, qty: orderItems.qty })
        .from(orderItems)
        .where(eq(orderItems.orderId, id));
      const need = new Map<string, { name: string; qty: number }>();
      const short: string[] = [];
      for (const i of items) {
        if (!i.barcode) {
          short.push(`${i.name}: no barcode (old order), cannot reserve stock`);
          continue;
        }
        const n = need.get(i.barcode);
        need.set(i.barcode, { name: i.name, qty: (n?.qty ?? 0) + i.qty });
      }
      const avail = await lockAvailability(tx, [...need.keys()]);
      for (const [barcode, n] of need) {
        const a = avail.get(barcode)?.available ?? 0;
        if (n.qty > a) short.push(`${n.name}: ordered ${n.qty}, only ${a} available`);
      }
      if (short.length) return { error: `Cannot ${status === "confirmed" ? "confirm" : `mark as ${status}`} — short items: ${short.join("; ")}.` };
    }

    const now = new Date();
    await tx
      .update(orders)
      .set({
        status,
        notes: notes || null,
        updatedAt: now,
        ...(status !== o.status && status === "confirmed" ? { confirmedAt: now } : {}),
        ...(status !== o.status && status === "dispatched" ? { dispatchedAt: now } : {}),
      })
      .where(eq(orders.id, id));
    // Reserved qty is computed, so cancelling a confirmed/packed order frees its stock immediately.
    const released = status === "cancelled" && (o.status === "confirmed" || o.status === "packed");
    return { ok: released ? "Saved. Stock released." : "Saved.", released };
  });

  if (result.ok) revalidatePath("/", "layout"); // every page: stock, admin lists, my-orders
  return result;
}
