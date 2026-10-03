"use server";

import { db, orders, orderItems } from "@/lib/db";
import { getCurrentUser, getPriceType } from "@/lib/auth";
import { getProductsByBarcodes } from "@/lib/catalog";
import { MOBILE_RE } from "@/lib/format";
import { rememberPlacedOrder } from "@/lib/placed-orders";
import { lockAvailability } from "@/lib/stock";

export type CheckoutInput = {
  lines: { barcode: string; qty: number }[];
  name: string;
  shopName: string;
  mobile: string;
  city: string;
};

export type CheckoutResult = { orderNo?: number; error?: string };

const r3 = (n: number) => Math.round(n * 1000) / 1000;

class StockError extends Error {}

function shortMessage(name: string, qty: number, available: number) {
  return available > 0 ? `${name}: only ${available} available (you ordered ${qty})` : `${name} is out of stock`;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const name = String(input?.name ?? "").trim().slice(0, 100);
  const shopName = String(input?.shopName ?? "").trim().slice(0, 120) || null; // optional
  const mobile = String(input?.mobile ?? "").trim();
  const city = String(input?.city ?? "").trim().slice(0, 80);
  if (!name) return { error: "Please enter your name." };
  if (!MOBILE_RE.test(mobile)) return { error: "Please enter a valid 10-digit mobile number." };
  if (!city) return { error: "Please enter your city." };

  // Merge duplicate barcodes; quantities must be positive integers.
  const qtyByBarcode = new Map<string, number>();
  for (const l of Array.isArray(input?.lines) ? input.lines : []) {
    const barcode = String(l?.barcode ?? "");
    const qty = Number(l?.qty);
    if (!barcode || !Number.isInteger(qty) || qty <= 0 || qty > 100000) return { error: "Invalid quantity in cart." };
    qtyByBarcode.set(barcode, (qtyByBarcode.get(barcode) ?? 0) + qty);
  }
  if (qtyByBarcode.size === 0) return { error: "Your cart is empty." };
  if (qtyByBarcode.size > 500) return { error: "Too many items in one order." };

  // Prices are recalculated on the server from the session; client prices are never used.
  const user = await getCurrentUser();
  const priceType = await getPriceType();
  const found = new Map((await getProductsByBarcodes([...qtyByBarcode.keys()])).map((p) => [p.barcode, p]));

  const items: { productCode: string; barcode: string; productName: string; unit: string; qty: number; rate: number; amount: number }[] = [];
  const problems: string[] = [];
  for (const [barcode, qty] of qtyByBarcode) {
    const p = found.get(barcode);
    if (!p) problems.push(`item ${barcode} is no longer available`);
    else if (qty > p.available) problems.push(shortMessage(p.name, qty, p.available));
    else items.push({ productCode: p.code, barcode: p.barcode, productName: p.name, unit: p.unit, qty, rate: p.price, amount: r3(p.price * qty) });
  }
  if (problems.length) return { error: `Please update your cart: ${problems.join("; ")}.` };

  const total = r3(items.reduce((s, i) => s + i.amount, 0));

  let orderNo: number;
  try {
    orderNo = await db.transaction(async (tx) => {
      // Authoritative re-check with the product rows locked.
      const avail = await lockAvailability(tx, items.map((i) => i.barcode));
      const short = items.filter((i) => i.qty > (avail.get(i.barcode)?.available ?? 0));
      if (short.length) {
        throw new StockError(
          short.map((i) => shortMessage(i.productName, i.qty, avail.get(i.barcode)?.available ?? 0)).join("; ")
        );
      }
      const [o] = await tx
        .insert(orders)
        .values({
          userId: user?.role === "retailer" ? user.id : null,
          customerName: name,
          shopName,
          mobile,
          city,
          priceType,
          total: String(total),
        })
        .returning({ id: orders.id, orderNo: orders.orderNo });
      await tx.insert(orderItems).values(
        items.map((i) => ({ ...i, orderId: o.id, rate: String(i.rate), amount: String(i.amount) }))
      );
      return o.orderNo;
    });
  } catch (e) {
    if (e instanceof StockError) return { error: `Please update your cart: ${e.message}.` };
    throw e;
  }

  await rememberPlacedOrder(orderNo);
  return { orderNo };
}
