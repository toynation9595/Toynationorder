"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { cart, useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { PublicProduct } from "@/lib/catalog";
import MobileInput from "@/components/MobileInput";
import { getCartProducts } from "../cart/actions";
import { placeOrder } from "./actions";

type Prefill = { name: string; shopName: string; mobile: string; city: string } | null;

export default function CheckoutForm({ prefill, priceLabel }: { prefill: Prefill; priceLabel: string }) {
  const lines = useCart();
  const router = useRouter();
  const [prices, setPrices] = useState<Map<string, PublicProduct> | null>(null);
  const [error, setError] = useState("");
  const [placing, start] = useTransition();
  const [placed, setPlaced] = useState(false);
  const codesKey = lines.map((l) => l.barcode).sort().join("|");

  useEffect(() => {
    let alive = true;
    getCartProducts(codesKey ? codesKey.split("|") : []).then((ps) => {
      if (alive) setPrices(new Map(ps.map((p) => [p.barcode, p])));
    });
    return () => {
      alive = false;
    };
  }, [codesKey]);

  if (lines.length === 0 && !placed) {
    return (
      <div className="card p-10 text-center">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/products" className="btn-primary mt-4">Browse products</Link>
      </div>
    );
  }

  const total = lines.reduce((s, l) => s + (prices?.get(l.barcode)?.price ?? 0) * l.qty, 0);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    start(async () => {
      const res = await placeOrder({
        lines,
        name: String(f.get("name") ?? ""),
        shopName: String(f.get("shopName") ?? ""),
        mobile: String(f.get("mobile") ?? ""),
        city: String(f.get("city") ?? ""),
      });
      if (res.error || !res.orderNo) {
        setError(res.error ?? "Could not place the order.");
        return;
      }
      setPlaced(true);
      cart.clear();
      router.push(`/order-placed/${res.orderNo}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card space-y-4 p-5">
        <h2 className="text-lg font-semibold text-brand-dark">Your details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Name</label>
            <input id="name" name="name" required defaultValue={prefill?.name} className="input" autoComplete="name" />
          </div>
          <div>
            <label htmlFor="shopName" className="label">Shop name</label>
            <input id="shopName" name="shopName" required defaultValue={prefill?.shopName} className="input" autoComplete="organization" />
          </div>
          <div>
            <label htmlFor="mobile" className="label">Mobile</label>
            <MobileInput name="mobile" defaultValue={prefill?.mobile} />
          </div>
          <div>
            <label htmlFor="city" className="label">City</label>
            <input id="city" name="city" required defaultValue={prefill?.city} className="input" autoComplete="address-level2" />
          </div>
        </div>
        {!prefill && (
          <p className="text-xs text-gray-500">
            Retailer? <Link href="/login?next=/checkout" className="font-semibold text-brand hover:underline">Log in</Link> for wholesale prices.
          </p>
        )}
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-3 text-lg font-semibold text-brand-dark">Order summary</h2>
        {!prices ? (
          <p className="text-sm text-gray-500">Loading prices…</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
            {lines.map((l) => {
              const p = prices.get(l.barcode);
              return (
                <li key={l.barcode} className="flex justify-between gap-3">
                  <span className="min-w-0 text-gray-700">
                    <span className="line-clamp-1">{p?.name ?? l.barcode}</span>
                    <span className="text-xs text-gray-500">{l.qty} × {p ? formatINR(p.price) : "—"}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{p ? formatINR(p.price * l.qty) : "—"}</span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex items-baseline justify-between border-t border-gray-100 pt-3">
          <span className="font-medium">Total <span className="text-xs font-normal text-gray-500">({priceLabel})</span></span>
          <span className="font-heading text-2xl font-semibold text-brand-dark">{formatINR(total)}</span>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button disabled={placing || !prices} className="btn-primary mt-4 w-full py-3 text-base">
          {placing ? "Placing order…" : "Place order"}
        </button>
        <Link href="/cart" className="mt-3 block text-center text-sm font-medium text-brand hover:underline">Edit cart</Link>
      </div>
    </form>
  );
}
