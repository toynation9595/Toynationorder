"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { OWNER_TRANSITIONS, ORDER_STATUSES, type OrderStatus } from "@/lib/order-statuses";

export type UpdateOrderState = { error?: string; ok?: string; released?: boolean };

/**
 * Owner status/notes update. Packing happens in /staff; the owner may only cancel orders that are
 * new, packing or packed, and move packed → dispatched (after ERP billing). Stock is computed, so
 * cancelling releases it immediately.
 */
export async function updateOrder(_prev: UpdateOrderState, form: FormData): Promise<UpdateOrderState> {
  await requireOwner();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "") as OrderStatus;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000);
  if (!id || !ORDER_STATUSES.includes(status)) return { error: "Invalid status." };

  const [o] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (!o) return { error: "Order not found." };
  if (status !== o.status && !OWNER_TRANSITIONS[o.status].includes(status)) {
    return { error: `Cannot change a ${o.status} order to ${status}.` };
  }

  const now = new Date();
  await db
    .update(orders)
    .set({
      status,
      notes: notes || null,
      updatedAt: now,
      ...(status !== o.status && status === "dispatched" ? { dispatchedAt: now } : {}),
    })
    .where(eq(orders.id, id));

  revalidatePath("/", "layout"); // every page: stock, admin lists, staff, my-orders

  const released = status === "cancelled" && ["new", "packing", "packed"].includes(o.status);
  return { ok: released ? "Saved. Stock released." : "Saved.", released };
}
