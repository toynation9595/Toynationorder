import "server-only";
import { asc, inArray, sql } from "drizzle-orm";
import { db, products, settings } from "@/lib/db";
import { shownName } from "@/lib/productName";

/**
 * Stock reservation rules.
 * Stock is reserved when an order is PLACED.
 * reserved(barcode) = SUM(order_items.qty) over orders that are 'new', 'confirmed' or 'packed',
 *   or 'dispatched' with dispatched_at > last_import_at (the ERP stock does not reflect them yet).
 * available = max(0, floor(stock_qty − reserved)).
 * Nothing is stored: cancelling an order releases its stock automatically.
 */
export const LAST_IMPORT_KEY = "last_import_at";

/*
 * Written with explicit aliases: Drizzle drops table prefixes from columns in selected sql`` fields
 * of single-table queries, which would make "id"/"barcode" ambiguous inside this correlated subquery.
 */
const reservedRaw = `coalesce((
  select sum(oi.qty) from order_items oi
  join orders o on o.id = oi.order_id
  where oi.barcode = "products"."barcode"
    and (o.status in ('new', 'confirmed', 'packed')
      or (o.status = 'dispatched' and o.dispatched_at > coalesce(
        (select s.value::timestamptz from settings s where s.key = '${LAST_IMPORT_KEY}'),
        '-infinity'::timestamptz)))
), 0)::int`;

/** Correlated subquery: reserved qty for the current `products` row. */
export const reservedSql = sql<number>`${sql.raw(reservedRaw)}`;

/** Available qty for the current `products` row. */
export const availableSql = sql<number>`${sql.raw(`greatest(0, floor("products"."stock_qty" - ${reservedRaw}))::int`)}`;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Inside a transaction: lock the product rows (SELECT … FOR UPDATE, in barcode order to avoid
 * deadlocks) and return the current availability for each barcode.
 */
export async function lockAvailability(
  tx: Tx,
  barcodes: string[]
): Promise<Map<string, { name: string; available: number }>> {
  const list = [...new Set(barcodes)].sort();
  if (list.length === 0) return new Map();
  await tx
    .select({ id: products.id })
    .from(products)
    .where(inArray(products.barcode, list))
    .orderBy(asc(products.barcode))
    .for("update");
  const rows = await tx
    .select({
      barcode: products.barcode,
      erpName: products.erpName,
      displayName: products.displayName,
      available: availableSql,
    })
    .from(products)
    .where(inArray(products.barcode, list));
  return new Map(
    rows.map((r) => [r.barcode, { name: shownName(r.displayName, r.erpName), available: Number(r.available) }])
  );
}

/** Record a successful ERP import (dispatched orders before this are now in the ERP stock). */
export async function markImported(tx: Tx) {
  const now = new Date().toISOString();
  await tx
    .insert(settings)
    .values({ key: LAST_IMPORT_KEY, value: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: now, updatedAt: new Date() } });
}
