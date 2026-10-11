"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getMyCart, mergeGuestCart, setMyCartQty } from "@/app/(site)/cart/actions";

/**
 * Cart = product barcode + qty only; prices always come from the server.
 * One store per CartProvider (mounted per signed-in identity):
 *  - "guest": localStorage key `tn_cart_guest`, used only when there is no session.
 *  - "user":  a retailer's cart_items on the server (optimistic local copy, synced via server actions,
 *             capped at available stock on every write).
 *  - "none":  owner / employee — no cart.
 */
export type CartLine = { barcode: string; qty: number };
export type CartMode = "guest" | "user" | "none";

export const GUEST_KEY = "tn_cart_guest";
const OLD_KEYS = ["tn_cart"]; // the old shared cart — removed on load
const EMPTY: CartLine[] = [];

const clamp = (qty: number, max: number) =>
  Math.max(0, Math.min(Math.floor(Number(qty) || 0), Math.floor(Number(max) || 0)));

function upsert(lines: CartLine[], barcode: string, qty: number): CartLine[] {
  if (qty <= 0) return lines.filter((l) => l.barcode !== barcode);
  return lines.some((l) => l.barcode === barcode)
    ? lines.map((l) => (l.barcode === barcode ? { barcode, qty } : l))
    : [...lines, { barcode, qty }];
}

function parse(raw: string | null): CartLine[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    if (!Array.isArray(v)) return EMPTY;
    return v
      .filter((l) => l && typeof l.barcode === "string" && l.barcode && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => ({ barcode: l.barcode, qty: l.qty }));
  } catch {
    return EMPTY;
  }
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Remove every client-side cart (logout: the next person on this device starts empty). */
export function clearClientCarts() {
  const s = storage();
  for (const k of [GUEST_KEY, ...OLD_KEYS]) s?.removeItem(k);
}

export type CartStore = {
  mode: CartMode;
  /** Identity the store belongs to ("guest", "u12", "none") — used to key price caches. */
  who: string;
  subscribe: (cb: () => void) => () => void;
  getSnapshot: () => CartLine[];
  getServerSnapshot: () => CartLine[];
  getLines: () => CartLine[];
  addItem: (barcode: string, qty: number, max: number) => void;
  setQty: (barcode: string, qty: number, max: number) => void;
  remove: (barcode: string) => void;
  clear: () => void;
  /** Runs once on mount (client only). */
  init: () => void;
};

const NONE_STORE: CartStore = {
  mode: "none",
  who: "none",
  subscribe: () => () => {},
  getSnapshot: () => EMPTY,
  getServerSnapshot: () => EMPTY,
  getLines: () => EMPTY,
  addItem: () => {},
  setQty: () => {},
  remove: () => {},
  clear: () => {},
  init: () => OLD_KEYS.forEach((k) => storage()?.removeItem(k)),
};

export function createCartStore(mode: CartMode, initial: CartLine[], who: string): CartStore {
  if (mode === "none") return NONE_STORE;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (mode === "guest") {
    let cache: { raw: string | null | undefined; lines: CartLine[] } = { raw: undefined, lines: EMPTY };
    const read = () => {
      const s = storage();
      if (!s) return EMPTY;
      const raw = s.getItem(GUEST_KEY);
      if (raw !== cache.raw) cache = { raw, lines: parse(raw) };
      return cache.lines;
    };
    const write = (lines: CartLine[]) => {
      const s = storage();
      if (lines.length) s?.setItem(GUEST_KEY, JSON.stringify(lines));
      else s?.removeItem(GUEST_KEY);
      emit();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_KEY || e.key === null) emit();
    };
    const store: CartStore = {
      mode,
      who,
      subscribe(cb) {
        listeners.add(cb);
        if (listeners.size === 1) window.addEventListener("storage", onStorage);
        return () => {
          listeners.delete(cb);
          if (listeners.size === 0) window.removeEventListener("storage", onStorage);
        };
      },
      getSnapshot: read,
      getServerSnapshot: () => EMPTY,
      getLines: read,
      setQty: (barcode, qty, max) => write(upsert(read(), barcode, clamp(qty, max))),
      addItem: (barcode, qty, max) =>
        store.setQty(barcode, (read().find((l) => l.barcode === barcode)?.qty ?? 0) + qty, max),
      remove: (barcode) => write(upsert(read(), barcode, 0)),
      clear: () => write([]),
      init: () => OLD_KEYS.forEach((k) => storage()?.removeItem(k)),
    };
    return store;
  }

  // mode === "user"
  let lines = initial;
  const seq = new Map<string, number>(); // latest request per barcode; older responses are ignored
  const set = (next: CartLine[]) => {
    lines = next;
    emit();
  };
  const refresh = () =>
    getMyCart()
      .then(set)
      .catch(() => {});
  const store: CartStore = {
    mode,
    who,
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    getSnapshot: () => lines,
    getServerSnapshot: () => initial,
    getLines: () => lines,
    setQty(barcode, qty, max) {
      const q = clamp(qty, max);
      set(upsert(lines, barcode, q));
      const n = (seq.get(barcode) ?? 0) + 1;
      seq.set(barcode, n);
      setMyCartQty(barcode, q)
        .then((stored) => {
          if (seq.get(barcode) === n && stored !== q) set(upsert(lines, barcode, stored)); // server capped it
        })
        .catch(refresh);
    },
    addItem: (barcode, qty, max) =>
      store.setQty(barcode, (lines.find((l) => l.barcode === barcode)?.qty ?? 0) + qty, max),
    remove: (barcode) => store.setQty(barcode, 0, 0),
    clear: () => set([]), // local only: the server deletes cart_items when the order is placed
    init() {
      const s = storage();
      OLD_KEYS.forEach((k) => s?.removeItem(k));
      // Just logged in: merge the guest cart into this retailer's cart, then clear it.
      const guest = parse(s?.getItem(GUEST_KEY) ?? null);
      s?.removeItem(GUEST_KEY); // removed before the request so a re-run can't merge twice
      if (guest.length) mergeGuestCart(guest).then(set).catch(refresh);
    },
  };
  return store;
}

export const CartContext = createContext<CartStore | null>(null);

/** The one cart API used by the header badge, sticky bar, steppers, cart and checkout. */
export function useCart() {
  const store = useContext(CartContext) ?? NONE_STORE;
  const lines = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    enabled: store.mode !== "none",
    who: store.who,
    lines,
    getLines: store.getLines,
    addItem: store.addItem,
    setQty: store.setQty,
    remove: store.remove,
    clear: store.clear,
  };
}
