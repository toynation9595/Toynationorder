"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import type { PublicProduct } from "@/lib/catalog";
import { getCartProducts } from "@/app/(site)/cart/actions";

/*
 * Cart count + total for the header and the mobile cart bar. Prices come from the server (the cart
 * only stores barcode + qty). One request per set of barcodes, shared by every caller and kept for
 * a short time so login/logout or stock changes show up quickly.
 */
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; promise: Promise<Map<string, PublicProduct>> }>();

function pricesFor(key: string) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;
  const promise = getCartProducts(key.split("|")).then((ps) => new Map(ps.map((p) => [p.barcode, p])));
  promise.catch(() => cache.delete(key));
  cache.set(key, { at: Date.now(), promise });
  return promise;
}

export function useCartSummary(): { count: number; total: number; ready: boolean } {
  const lines = useCart();
  const key = lines.map((l) => l.barcode).sort().join("|");
  const [loaded, setLoaded] = useState<{ key: string; prices: Map<string, PublicProduct> } | null>(null);

  useEffect(() => {
    if (!key) return;
    let alive = true;
    pricesFor(key)
      .then((prices) => alive && setLoaded({ key, prices }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [key]);

  const prices = loaded?.key === key ? loaded.prices : null;
  let total = 0;
  for (const l of lines) {
    const p = prices?.get(l.barcode);
    if (p) total += p.price * Math.min(l.qty, p.available);
  }
  return { count: lines.length, total, ready: !key || prices !== null };
}
