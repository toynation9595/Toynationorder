"use client";

import Link from "next/link";
import { useCartSummary } from "@/lib/cart-summary";
import { formatINR } from "@/lib/format";

export default function CartLink() {
  const { count, total, ready } = useCartSummary();
  return (
    <Link href="/cart" className="relative rounded-lg px-3 py-2 hover:bg-white/10 max-[379px]:px-2" aria-label="Cart">
      {/* Desktop: "Cart · n · ₹total"; smaller screens: "Cart" + count badge. */}
      <span className={count > 0 ? "lg:hidden" : ""}>Cart</span>
      {count > 0 && (
        <>
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tn-yellow px-1 text-[11px] font-bold text-gray-900 lg:hidden">
            {count}
          </span>
          <span className="hidden whitespace-nowrap lg:inline">
            Cart · {count} · {ready ? formatINR(total) : "…"}
          </span>
        </>
      )}
    </Link>
  );
}
