"use client";

import { useState } from "react";
import { cart, useCart } from "@/lib/cart";

type Props = { barcode: string; available: number; size?: "sm" | "lg" };

/**
 * Shared Add / [− qty +] control bound to the localStorage cart.
 * Qty is kept within 1..available; − at 1 removes the item.
 * Always renders the helper line so cards keep the same height in every state.
 */
export default function QtyStepper({ barcode, available, size = "sm" }: Props) {
  const qty = useCart().find((l) => l.barcode === barcode)?.qty ?? 0;
  const [draft, setDraft] = useState<string | null>(null);
  const lg = size === "lg";
  const h = lg ? "h-12 text-base" : "h-9 text-sm";
  const sideW = lg ? "w-14" : "w-9";
  const atMax = qty > 0 && qty >= available;
  const clamp = (n: number) => Math.min(Math.max(1, n), available);
  const set = (n: number) => cart.setQty(barcode, clamp(n));

  let control: React.ReactNode;
  if (available <= 0) {
    control = (
      <button disabled className={`btn w-full bg-gray-200 text-gray-500 ${h}`}>
        Out of stock
      </button>
    );
  } else if (qty === 0) {
    control = (
      <button onClick={() => cart.add(barcode, 1)} className={`btn-primary w-full ${h}`}>
        {lg ? "Add to cart" : "Add"}
      </button>
    );
  } else {
    control = (
      <div className={`flex w-full items-stretch overflow-hidden rounded-xl border-2 border-brand bg-white ${h}`}>
        <button
          onClick={() => (qty <= 1 ? cart.remove(barcode) : set(qty - 1))}
          className={`${sideW} shrink-0 font-semibold text-brand hover:bg-brand-light`}
          aria-label={qty <= 1 ? "Remove from cart" : "Decrease"}
        >
          −
        </button>
        <input
          value={draft ?? String(qty)}
          inputMode="numeric"
          aria-label="Quantity"
          onChange={(e) => {
            const s = e.target.value.replace(/\D/g, "");
            // Empty is allowed while typing; anything else is shown and stored capped to 1..available.
            setDraft(s && String(clamp(Number(s))));
            if (s) set(Number(s));
          }}
          onBlur={() => setDraft(null)}
          className="w-full min-w-0 bg-transparent text-center font-semibold outline-none"
        />
        <button
          onClick={() => set(qty + 1)}
          disabled={atMax}
          className={`${sideW} shrink-0 font-semibold text-brand hover:bg-brand-light disabled:text-gray-300 disabled:hover:bg-transparent`}
          aria-label="Increase"
        >
          +
        </button>
      </div>
    );
  }

  const helper = qty === 0 ? "" : atMax ? `Max ${available} available` : `${qty} in cart`;
  return (
    <div>
      {control}
      <p
        className={`mt-1 text-center leading-4 ${lg ? "min-h-5 text-sm" : "min-h-4 text-[11px]"} ${
          atMax ? "text-tn-orange" : "text-gray-500"
        }`}
      >
        {helper}
      </p>
    </div>
  );
}
