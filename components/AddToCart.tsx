"use client";

import { useState } from "react";
import { cart, parseQty } from "@/lib/cart";

type Props = { barcode: string; inStock: boolean; compact?: boolean };

export default function AddToCart({ barcode, inStock, compact = false }: Props) {
  const [qty, setQty] = useState("1");
  const [added, setAdded] = useState(false);
  const n = parseQty(qty);

  function add() {
    if (!inStock || !n) return;
    cart.add(barcode, n);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (compact) {
    return (
      <button onClick={() => { cart.add(barcode, 1); setAdded(true); setTimeout(() => setAdded(false), 1200); }}
        disabled={!inStock}
        className={`btn w-full py-2 ${added ? "bg-tn-teal text-white" : "bg-brand text-white hover:bg-brand-dark"} disabled:bg-gray-200 disabled:text-gray-500`}
      >
        {!inStock ? "Out of stock" : added ? "Added ✓" : "Add"}
      </button>
    );
  }

  return (
    <div className="flex items-stretch gap-3">
      <div className="flex items-center rounded-xl border border-gray-300">
        <button type="button" onClick={() => setQty(String(Math.max(1, (n ?? 1) - 1)))} disabled={!inStock}
          className="px-3 py-2 text-lg text-gray-600 disabled:opacity-40" aria-label="Decrease">−</button>
        <input value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} inputMode="numeric" disabled={!inStock}
          className="w-16 bg-transparent text-center text-base font-semibold outline-none" aria-label="Quantity" />
        <button type="button" onClick={() => setQty(String((n ?? 0) + 1))} disabled={!inStock}
          className="px-3 py-2 text-lg text-gray-600 disabled:opacity-40" aria-label="Increase">+</button>
      </div>
      <button onClick={add} disabled={!inStock || !n}
        className={`btn flex-1 text-base ${added ? "bg-tn-teal text-white" : "bg-brand text-white hover:bg-brand-dark"} disabled:bg-gray-200 disabled:text-gray-500`}>
        {!inStock ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
