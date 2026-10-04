"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db, orders, orderItems, users } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

export type PackResult = { error?: string };

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class PackError extends Error {}

/** Lock the order row and make sure `userId` is the one packing it. */
async function lockForPacker(tx: Tx, orderId: number, userId: number) {
  const [o] = await tx
    .select({ status: orders.status, packedBy: orders.packedBy })
    .from(orders)
    .where(eq(orders.id, orderId))
    .for("update");
  if (!o) throw new PackError("Order not found.");
  if (o.status !== "packing") throw new PackError("This order is not being packed.");
  if (o.packedBy !== userId) {
    const [u] = o.packedBy ? await tx.select({ name: users.name }).from(users).where(eq(users.id, o.packedBy)) : [];
    throw new PackError(`Being packed by ${u?.name ?? "someone else"}.`);
  }
}

async function run(fn: () => Promise<void>): Promise<PackResult> {
  try {
    await fn();
    return {};
  } catch (e) {
    if (e instanceof PackError) return { error: e.message };
    throw e;
  }
}

/** Start packing: only 'new' orders; first person wins (row lock). */
export async function startPacking(orderId: number): Promise<PackResult> {
  const me = await requireStaff();
  const res = await run(() =>
    db.transaction(async (tx) => {
      const [o] = await tx
        .select({ status: orders.status, packedBy: orders.packedBy })
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");
      if (!o) throw new PackError("Order not found.");
      if (o.status === "packing") {
        if (o.packedBy === me.id) return; // already mine
        const [u] = o.packedBy ? await tx.select({ name: users.name }).from(users).where(eq(users.id, o.packedBy)) : [];
        throw new PackError(`Being packed by ${u?.name ?? "someone else"}.`);
      }
      if (o.status !== "new") throw new PackError(`This order is already ${o.status}.`);
      const now = new Date();
      await tx
        .update(orders)
        .set({ status: "packing", packedBy: me.id, packingStartedAt: now, updatedAt: now })
        .where(eq(orders.id, orderId));
    })
  );
  if (!res.error) revalidatePath("/", "layout");
  return res;
}

async function itemOrder(itemId: number) {
  const [i] = await db
    .select({ orderId: orderItems.orderId, qty: orderItems.qty })
    .from(orderItems)
    .where(eq(orderItems.id, itemId));
  return i;
}

/** Tick / untick a checklist row (saved immediately). Unticking also clears a short qty. */
export async function setItemDone(itemId: number, done: boolean): Promise<PackResult> {
  const me = await requireStaff();
  const item = await itemOrder(itemId);
  if (!item) return { error: "Item not found." };
  return run(() =>
    db.transaction(async (tx) => {
      await lockForPacker(tx, item.orderId, me.id);
      await tx.update(orderItems).set({ packed: done, packedQty: null }).where(eq(orderItems.id, itemId));
    })
  );
}

/** Mark a row short: packed_qty = n (0..qty) and the row counts as done. */
export async function setItemShort(itemId: number, packedQty: number): Promise<PackResult> {
  const me = await requireStaff();
  const item = await itemOrder(itemId);
  if (!item) return { error: "Item not found." };
  const n = Number(packedQty);
  if (!Number.isInteger(n) || n < 0 || n > item.qty) return { error: `Enter a number from 0 to ${item.qty}.` };
  return run(() =>
    db.transaction(async (tx) => {
      await lockForPacker(tx, item.orderId, me.id);
      // Short by nothing = a normal tick.
      await tx
        .update(orderItems)
        .set({ packed: true, packedQty: n === item.qty ? null : n })
        .where(eq(orderItems.id, itemId));
    })
  );
}

/** Finish: every row ticked or short → packed_qty = qty for ticked rows, status 'packed'. */
export async function finishPacking(orderId: number): Promise<PackResult> {
  const me = await requireStaff();
  const res = await run(() =>
    db.transaction(async (tx) => {
      await lockForPacker(tx, orderId, me.id);
      const [{ open }] = await tx
        .select({ open: sql<number>`count(*) filter (where not ${orderItems.packed})::int` })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      if (open > 0) throw new PackError(`${open} item${open === 1 ? "" : "s"} still to tick or mark short.`);
      await tx
        .update(orderItems)
        .set({ packedQty: sql`${orderItems.qty}` })
        .where(and(eq(orderItems.orderId, orderId), isNull(orderItems.packedQty)));
      const now = new Date();
      await tx.update(orders).set({ status: "packed", packedAt: now, updatedAt: now }).where(eq(orders.id, orderId));
    })
  );
  if (!res.error) revalidatePath("/", "layout"); // short items release stock
  return res;
}
