"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export type UpdateOrderState = { error?: string; ok?: string; released?: boolean };

/**
 * Plain status/notes update. Stock is already reserved when the order is placed (see lib/stock.ts),
 * so confirming needs no stock check; cancelling releases it because reservation is computed.
 */
export async function updateOrder(_prev: UpdateOrderState, form: FormData): Promise<UpdateOrderState> {
  await requireOwner();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "") as OrderStatus;
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000);
  if (!id || !ORDER_STATUSES.includes(status)) return { error: "Invalid status." };

  const [o] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, id));
  if (!o) return { error: "Order not found." };

  const now = new Date();
  await db
    .update(orders)
    .set({
      status,
      notes: notes || null,
      updatedAt: now,
      ...(status !== o.status && status === "confirmed" ? { confirmedAt: now } : {}),
      ...(status !== o.status && status === "dispatched" ? { dispatchedAt: now } : {}),
    })
    .where(eq(orders.id, id));

  revalidatePath("/", "layout"); // every page: stock, admin lists, my-orders

  const released = status === "cancelled" && ["new", "confirmed", "packed"].includes(o.status);
  return { ok: released ? "Saved. Stock released." : "Saved.", released };
}
