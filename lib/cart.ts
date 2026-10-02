"use client";

import { useSyncExternalStore } from "react";

/** Cart lives in localStorage as product code + qty only. Prices always come from the server. */
export type CartLine = { code: string; qty: number };

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
        .filter((l) => l && typeof l.code === "string" && Number.isInteger(l.qty) && l.qty > 0)
        .map((l) => ({ code: l.code, qty: l.qty }));
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
  add(code: string, qty: number) {
    const lines = [...read()];
    const i = lines.findIndex((l) => l.code === code);
    if (i >= 0) lines[i] = { code, qty: lines[i].qty + qty };
    else lines.push({ code, qty });
    write(lines);
  },
  setQty(code: string, qty: number) {
    write(read().map((l) => (l.code === code ? { code, qty } : l)));
  },
  remove(code: string) {
    write(read().filter((l) => l.code !== code));
  },
  clear() {
    write([]);
  },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function parseQty(v: string): number | null {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 100000 ? n : null;
}
