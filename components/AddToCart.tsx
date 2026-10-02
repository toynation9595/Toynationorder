"use client";

import { useState } from "react";
import { cart, parseQty, useCart } from "@/lib/cart";

type Props = { barcode: string; available: number; compact?: boolean };

export default function AddToCart({ barcode, available, compact = false }: Props) {
  const inCart = useCart().find((l) => l.barcode === barcode)?.qty ?? 0;
  const room = Math.max(0, available - inCart);
  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);
  const n = parseQty(qty);
  const over = n !== null && n > room;

  function add(q: number) {
    if (q < 1 || q > room) return;
    cart.add(barcode, q);
    setQty("1");
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (available <= 0) {
    return (
      <button disabled className="btn w-full bg-gray-200 py-2 text-gray-500">
        Out of stock
      </button>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => add(1)}
        disabled={room < 1}
        className={`btn w-full py-2 ${added ? "bg-tn-teal text-white" : "bg-brand text-white hover:bg-brand-dark"} disabled:bg-gray-200 disabled:text-gray-500`}
      >
        {added ? "Added ✓" : room < 1 ? "All in cart" : "Add"}
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-xl border border-gray-300">
          <button type="button" onClick={() => setQty(String(Math.max(1, (n ?? 1) - 1)))}
            className="px-3 py-2 text-lg text-gray-600" aria-label="Decrease">−</button>
          <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
            className="w-16 bg-transparent text-center text-base font-semibold outline-none" aria-label="Quantity" />
          <button type="button" onClick={() => setQty(String(Math.min(Math.max(room, 1), (n ?? 0) + 1)))}
            className="px-3 py-2 text-lg text-gray-600" aria-label="Increase">+</button>
        </div>
        <button onClick={() => n && add(n)} disabled={!n || over || room < 1}
          className={`btn flex-1 text-base ${added ? "bg-tn-teal text-white" : "bg-brand text-white hover:bg-brand-dark"} disabled:bg-gray-200 disabled:text-gray-500`}>
          {added ? "Added to cart ✓" : room < 1 ? "All available stock in cart" : "Add to cart"}
        </button>
      </div>
      {(over || inCart > 0) && (
        <p className={`mt-2 text-sm ${over ? "text-red-600" : "text-gray-500"}`}>
          Only {available} available{inCart > 0 && ` · ${inCart} already in your cart`}
        </p>
      )}
    </div>
  );
}
