import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, cartItems } from "@/lib/db";
import { getProductsByBarcodes } from "@/lib/catalog";

export type CartLine = { barcode: string; qty: number };

/** A retailer's saved cart, oldest line first. */
export async function getCartLines(userId: number): Promise<CartLine[]> {
  return db
    .select({ barcode: cartItems.barcode, qty: cartItems.qty })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(asc(cartItems.updatedAt), asc(cartItems.barcode));
}

/** Current available stock per barcode (0 for anything not orderable). */
export async function availableFor(barcodes: string[]): Promise<Map<string, number>> {
  const ps = await getProductsByBarcodes([...new Set(barcodes)]);
  return new Map(ps.map((p) => [p.barcode, p.available]));
}

/**
 * Write absolute quantities for a user, each capped at available stock (0 deletes the line).
 * Returns the stored quantity per barcode.
 */
export async function writeCartQtys(userId: number, wanted: CartLine[]): Promise<Map<string, number>> {
  const avail = await availableFor(wanted.map((l) => l.barcode));
  const stored = new Map<string, number>();
  const keep: CartLine[] = [];
  const drop: string[] = [];
  for (const l of wanted) {
    const q = Math.max(0, Math.min(Math.floor(l.qty), avail.get(l.barcode) ?? 0));
    stored.set(l.barcode, q);
    if (q > 0) keep.push({ barcode: l.barcode, qty: q });
    else drop.push(l.barcode);
  }
  if (drop.length) {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), inArray(cartItems.barcode, drop)));
  }
  if (keep.length) {
    await db
      .insert(cartItems)
      .values(keep.map((l) => ({ userId, barcode: l.barcode, qty: l.qty })))
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.barcode],
        set: { qty: sql`excluded.qty`, updatedAt: sql`now()` },
      });
  }
  return stored;
}

export async function clearCart(userId: number) {
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}
