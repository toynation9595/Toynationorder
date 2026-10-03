"use client";

import { useState } from "react";
import { cart, useCart } from "@/lib/cart";

type Props = { barcode: string; max: number; size?: "sm" | "lg" };

/**
 * Shared Add / [− qty +] control bound to the localStorage cart.
 * `max` is the available stock; the cart store itself clamps every write to 0..max.
 * Always renders the helper line so cards keep the same height in every state.
 */
export default function QtyStepper({ barcode, max, size = "sm" }: Props) {
  const limit = Math.max(0, Math.floor(Number(max) || 0));
  const qty = useCart().find((l) => l.barcode === barcode)?.qty ?? 0;
  const [draft, setDraft] = useState<string | null>(null);
  const lg = size === "lg";
  const h = lg ? "h-12 text-base" : "h-9 text-sm";
  const sideW = lg ? "w-14" : "w-9";
  const atMax = qty > 0 && qty >= limit;

  let control: React.ReactNode;
  if (limit === 0) {
    control = (
      <button disabled className={`btn w-full bg-gray-200 text-gray-500 ${h}`}>
        Out of stock
      </button>
    );
  } else if (qty === 0) {
    control = (
      <button onClick={() => cart.addItem(barcode, 1, limit)} className={`btn-primary w-full ${h}`}>
        {lg ? "Add to cart" : "Add"}
      </button>
    );
  } else {
    control = (
      <div className={`flex w-full items-stretch overflow-hidden rounded-xl border-2 border-brand bg-white ${h}`}>
        <button
          onClick={() => cart.setQty(barcode, qty - 1, limit)}
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
            if (!s) {
              setDraft(""); // allow clearing while typing; blur restores the cart qty
              return;
            }
            const n = Math.min(Math.max(1, Number(s)), limit); // above max snaps back to max
            setDraft(String(n));
            cart.setQty(barcode, n, limit);
          }}
          onBlur={() => setDraft(null)}
          className="w-full min-w-0 bg-transparent text-center font-semibold outline-none"
        />
        <button
          onClick={() => cart.setQty(barcode, qty + 1, limit)}
          disabled={qty >= limit}
          className={`${sideW} shrink-0 font-semibold text-brand hover:bg-brand-light disabled:text-gray-300 disabled:hover:bg-transparent`}
          aria-label="Increase"
        >
          +
        </button>
      </div>
    );
  }

  const helper = qty === 0 ? "" : atMax ? `Max ${limit} available` : `${qty} in cart`;
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
