"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, orders, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

export async function updateOrder(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  const status = String(form.get("status") ?? "");
  const notes = String(form.get("notes") ?? "").trim().slice(0, 2000);
  if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) return;
  await db
    .update(orders)
    .set({ status: status as OrderStatus, notes: notes || null, updatedAt: new Date() })
    .where(eq(orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/my-orders", "layout");
}
