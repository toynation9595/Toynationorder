"use client";

import { useSyncExternalStore } from "react";

/** Cart lives in localStorage as product barcode + qty only. Prices always come from the server. */
export type CartLine = { barcode: string; qty: number };

const KEY = "tn_cart";
const EVENT = "tn-cart";
const EMPTY: CartLine[] = [];
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) {
      lines = parsed
        // Entries without a barcode (old code-keyed carts) are ignored.
        .filter((l) => l && typeof l.barcode === "string" && l.barcode && Number.isInteger(l.qty) && l.qty > 0)
        .map((l) => ({ barcode: l.barcode, qty: l.qty }));
    }
  } catch {}
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const cart = {
  lines(): CartLine[] {
    return read();
  },
  /** Add qty to the line, clamped to 0..max (max = available stock). */
  addItem(barcode: string, qty: number, max: number) {
    const current = read().find((l) => l.barcode === barcode)?.qty ?? 0;
    cart.setQty(barcode, current + qty, max);
  },
  /** Set the line qty, clamped to 0..max; 0 removes the line. */
  setQty(barcode: string, qty: number, max: number) {
    const q = Math.max(0, Math.min(Math.floor(Number(qty) || 0), Math.floor(Number(max) || 0)));
    const lines = read();
    if (q === 0) {
      write(lines.filter((l) => l.barcode !== barcode));
      return;
    }
    const exists = lines.some((l) => l.barcode === barcode);
    write(exists ? lines.map((l) => (l.barcode === barcode ? { barcode, qty: q } : l)) : [...lines, { barcode, qty: q }]);
  },
  remove(barcode: string) {
    write(read().filter((l) => l.barcode !== barcode));
  },
  clear() {
    write([]);
  },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
