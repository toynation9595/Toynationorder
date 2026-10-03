/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { cldUrl } from "@/lib/images";
import type { PublicProduct } from "@/lib/catalog";
import { ProductImagePlaceholder } from "@/components/ProductCard";
import QtyStepper from "@/components/QtyStepper";
import { getCartProducts } from "./actions";

export default function CartView({ priceLabel }: { priceLabel: string }) {
  const lines = useCart();
  const [prices, setPrices] = useState<Map<string, PublicProduct> | null>(null);
  const [reduced, setReduced] = useState<string[]>([]);
  const codesKey = lines.map((l) => l.barcode).sort().join("|");

  useEffect(() => {
    let alive = true;
    const codes = codesKey ? codesKey.split("|") : [];
    getCartProducts(codes).then((ps) => {
      if (!alive) return;
      const map = new Map(ps.map((p) => [p.barcode, p]));
      // Clamp stored quantities to the current available stock (0 removes the line).
      const notes: string[] = [];
      for (const l of cart.lines()) {
        const p = map.get(l.barcode);
        const available = p?.available ?? 0;
        if (l.qty > available) {
          cart.setQty(l.barcode, available, available);
          notes.push(
            available > 0
              ? `${p!.name}: reduced from ${l.qty} to ${available} (only ${available} available)`
              : `${p?.name ?? l.barcode}: removed (out of stock)`
          );
        }
      }
      if (notes.length) setReduced((prev) => [...prev, ...notes]);
      setPrices(map);
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
    <div className="space-y-4">
      {reduced.length > 0 && (
        <div className="rounded-2xl bg-tn-yellow/15 p-4 text-sm text-gray-800">
          <p className="font-semibold">Some quantities were reduced to match available stock:</p>
          <ul className="mt-1 list-disc pl-5">
            {reduced.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card divide-y divide-gray-100">
          {rows.map(({ line, p, ok }) => (
            <div key={line.barcode} className="flex gap-3 p-3 sm:p-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
                {p?.image ? (
                  <img src={cldUrl(p.image, 400)} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <ProductImagePlaceholder />
                )}
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
                {p && <div className="text-xs text-gray-500">{p.unit} · {formatINR(p.price)} · Stock: {p.available}</div>}
                {p ? (
                  <div className="mt-2 w-40">
                    <QtyStepper barcode={line.barcode} max={p.available} />
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-3 text-xs">
                    <span className="font-medium text-red-600">No longer available</span>
                    <button onClick={() => cart.remove(line.barcode)} className="font-semibold text-gray-600 underline hover:text-red-600">
                      Remove
                    </button>
                  </div>
                )}
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
          {blocked && <p className="mt-3 text-xs text-red-600">Remove unavailable items to continue.</p>}
          {blocked ? (
            <button disabled className="btn-primary mt-4 w-full">Proceed to checkout</button>
          ) : (
            <Link href="/checkout" className="btn-primary mt-4 w-full">Proceed to checkout</Link>
          )}
          <Link href="/products" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
