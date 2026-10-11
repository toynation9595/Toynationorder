"use server";

import { getProductsByBarcodes, recommendedProducts } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { getCartLines, writeCartQtys, type CartLine } from "@/lib/user-cart";

/** Current server prices for the barcodes in the cart. */
export async function getCartProducts(barcodes: string[]) {
  if (!Array.isArray(barcodes)) return [];
  return getProductsByBarcodes(barcodes.filter((b) => typeof b === "string").slice(0, 500));
}

/** "You may also like" row on the cart page. */
export async function getRecommendations(cartBarcodes: string[]) {
  if (!Array.isArray(cartBarcodes)) return [];
  return recommendedProducts(cartBarcodes.filter((b) => typeof b === "string").slice(0, 200), 6);
}

/* Retailer cart: the user always comes from the session, never from the client. */

async function retailerId(): Promise<number | null> {
  const u = await getCurrentUser();
  return u?.role === "retailer" ? u.id : null;
}

function cleanLines(input: unknown): CartLine[] {
  if (!Array.isArray(input)) return [];
  const out: CartLine[] = [];
  for (const l of input.slice(0, 500)) {
    const barcode = typeof l?.barcode === "string" ? l.barcode : "";
    const qty = Number(l?.qty);
    if (barcode && Number.isInteger(qty) && qty >= 0) out.push({ barcode, qty });
  }
  return out;
}

export async function getMyCart(): Promise<CartLine[]> {
  const uid = await retailerId();
  return uid ? getCartLines(uid) : [];
}

/** Set one line's quantity (capped at available stock; 0 removes it). Returns the stored qty. */
export async function setMyCartQty(barcode: string, qty: number): Promise<number> {
  const uid = await retailerId();
  if (!uid) return 0;
  const [line] = cleanLines([{ barcode, qty }]);
  if (!line) return 0;
  const stored = await writeCartQtys(uid, [line]);
  return stored.get(line.barcode) ?? 0;
}

/** After login: add the guest cart's quantities to the saved cart (capped), return the merged cart. */
export async function mergeGuestCart(guest: CartLine[]): Promise<CartLine[]> {
  const uid = await retailerId();
  if (!uid) return [];
  const add = cleanLines(guest);
  if (add.length) {
    const current = new Map((await getCartLines(uid)).map((l) => [l.barcode, l.qty]));
    const wanted = new Map<string, number>();
    for (const l of add) wanted.set(l.barcode, (wanted.get(l.barcode) ?? current.get(l.barcode) ?? 0) + l.qty);
    await writeCartQtys(uid, [...wanted].map(([barcode, qty]) => ({ barcode, qty })));
  }
  return getCartLines(uid);
}
