/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cart, parseQty, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { cldUrl } from "@/lib/images";
import type { PublicProduct } from "@/lib/catalog";
import { ProductImagePlaceholder } from "@/components/ProductCard";
import { getCartProducts } from "./actions";

export default function CartView({ priceLabel }: { priceLabel: string }) {
  const lines = useCart();
  const [prices, setPrices] = useState<Map<string, PublicProduct> | null>(null);
  const codesKey = lines.map((l) => l.barcode).sort().join("|");

  useEffect(() => {
    let alive = true;
    const codes = codesKey ? codesKey.split("|") : [];
    getCartProducts(codes).then((ps) => {
      if (alive) setPrices(new Map(ps.map((p) => [p.barcode, p])));
    });
    return () => {
      alive = false;
    };
  }, [codesKey]);

  if (lines.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Browse products</Link>
      </div>
    );
  }
  if (!prices) return <div className="card p-10 text-center text-gray-500">Loading current prices…</div>;

  const rows = lines.map((l) => {
    const p = prices.get(l.barcode);
    return { line: l, p, ok: !!p && l.qty <= p.available };
  });
  const blocked = rows.some((r) => !r.ok);
  const total = rows.reduce((s, r) => s + (r.ok && r.p ? r.p.price * r.line.qty : 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card divide-y divide-gray-100">
        {rows.map(({ line, p, ok }) => (
          <div key={line.barcode} className="flex gap-3 p-3 sm:p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-50">
              {p?.image ? <img src={cldUrl(p.image, 400)} alt="" className="h-full w-full object-cover" /> : <ProductImagePlaceholder />}
            </div>
            <div className="min-w-0 flex-1">
              {p ? (
                <Link href={`/products/${encodeURIComponent(p.barcode)}`} className="line-clamp-2 text-sm font-medium text-gray-900 hover:text-brand">
                  {p.name}
                </Link>
              ) : (
                <span className="font-mono text-sm text-gray-500">{line.barcode}</span>
              )}
              {p && <div className="font-mono text-[11px] text-gray-400">{p.barcode}</div>}
              {p && <div className="text-xs text-gray-500">{p.unit} · {formatINR(p.price)}</div>}
              {!p && <div className="mt-1 text-xs font-medium text-red-600">No longer available — please remove</div>}
              {p && line.qty > p.available && (
                <div className="mt-1 text-xs font-medium text-red-600">
                  Only {p.available} available —{" "}
                  <button onClick={() => cart.setQty(line.barcode, p.available)} className="underline">set to {p.available}</button>
                </div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <QtyInput value={line.qty} max={p?.available} onChange={(q) => cart.setQty(line.barcode, q)} />
                <button onClick={() => cart.remove(line.barcode)} className="text-xs font-medium text-gray-500 hover:text-red-600">Remove</button>
              </div>
            </div>
            <div className="text-right text-sm font-semibold tabular-nums text-gray-900">
              {ok && p ? formatINR(p.price * line.qty) : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="card h-fit p-5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{lines.length} item{lines.length > 1 ? "s" : ""}</span>
          <span>{priceLabel}</span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="font-medium">Total</span>
          <span className="font-heading text-2xl font-semibold text-brand-dark">{formatINR(total)}</span>
        </div>
        {blocked && <p className="mt-3 text-xs text-red-600">Fix the highlighted items to continue.</p>}
        {blocked ? (
          <button disabled className="btn-primary mt-4 w-full">Proceed to checkout</button>
        ) : (
          <Link href="/checkout" className="btn-primary mt-4 w-full">Proceed to checkout</Link>
        )}
        <Link href="/products" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">Continue shopping</Link>
      </div>
    </div>
  );
}

function QtyInput({ value, max, onChange }: { value: number; max?: number; onChange: (q: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const v = draft ?? String(value);
  return (
    <div className="flex items-center rounded-lg border border-gray-300 text-sm">
      <button onClick={() => value > 1 && onChange(value - 1)} className="px-2.5 py-1 text-gray-600" aria-label="Decrease">−</button>
      <input
        value={v}
        inputMode="numeric"
        onChange={(e) => {
          const s = e.target.value.replace(/\D/g, "");
          setDraft(s);
          const n = parseQty(s);
          if (n) onChange(max !== undefined && max > 0 ? Math.min(n, max) : n);
        }}
        onBlur={() => setDraft(null)}
        className="w-12 bg-transparent text-center font-semibold outline-none"
        aria-label="Quantity"
      />
      <button onClick={() => (max === undefined || value < max) && onChange(value + 1)} disabled={max !== undefined && value >= max}
        className="px-2.5 py-1 text-gray-600 disabled:opacity-30" aria-label="Increase">+</button>
    </div>
  );
}
