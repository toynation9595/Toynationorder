"use server";

import { db, orders, orderItems } from "@/lib/db";
import { getCurrentUser, getPriceType } from "@/lib/auth";
import { getProductsByCodes } from "@/lib/catalog";
import { MOBILE_RE } from "@/lib/format";
import { rememberPlacedOrder } from "@/lib/placed-orders";

export type CheckoutInput = {
  lines: { code: string; qty: number }[];
  name: string;
  shopName: string;
  mobile: string;
  city: string;
};

export type CheckoutResult = { orderNo?: number; error?: string };

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const name = String(input?.name ?? "").trim().slice(0, 100);
  const shopName = String(input?.shopName ?? "").trim().slice(0, 120);
  const mobile = String(input?.mobile ?? "").trim();
  const city = String(input?.city ?? "").trim().slice(0, 80);
  if (!name) return { error: "Please enter your name." };
  if (!shopName) return { error: "Please enter your shop name." };
  if (!MOBILE_RE.test(mobile)) return { error: "Please enter a valid 10-digit mobile number." };
  if (!city) return { error: "Please enter your city." };

  // Merge duplicate codes; quantities must be positive integers.
  const qtyByCode = new Map<string, number>();
  for (const l of Array.isArray(input?.lines) ? input.lines : []) {
    const code = String(l?.code ?? "");
    const qty = Number(l?.qty);
    if (!code || !Number.isInteger(qty) || qty <= 0 || qty > 100000) return { error: "Invalid quantity in cart." };
    qtyByCode.set(code, (qtyByCode.get(code) ?? 0) + qty);
  }
  if (qtyByCode.size === 0) return { error: "Your cart is empty." };
  if (qtyByCode.size > 500) return { error: "Too many items in one order." };

  // Prices are recalculated on the server from the session; client prices are never used.
  const user = await getCurrentUser();
  const priceType = await getPriceType();
  const found = new Map((await getProductsByCodes([...qtyByCode.keys()])).map((p) => [p.code, p]));

  const items: { productCode: string; productName: string; unit: string; qty: number; rate: number; amount: number }[] = [];
  const problems: string[] = [];
  for (const [code, qty] of qtyByCode) {
    const p = found.get(code);
    if (!p) problems.push(`#${code} is no longer available`);
    else if (!p.inStock) problems.push(`${p.name} is out of stock`);
    else items.push({ productCode: p.code, productName: p.name, unit: p.unit, qty, rate: p.price, amount: r3(p.price * qty) });
  }
  if (problems.length) return { error: `Please update your cart: ${problems.join("; ")}.` };

  const total = r3(items.reduce((s, i) => s + i.amount, 0));

  const orderNo = await db.transaction(async (tx) => {
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

  await rememberPlacedOrder(orderNo);
  return { orderNo };
}
