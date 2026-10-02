"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartLink() {
  const n = useCart().length;
  return (
    <Link href="/cart" className="relative rounded-lg px-3 py-2 hover:bg-white/10" aria-label="Cart">
      Cart
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-tn-yellow px-1 text-[11px] font-bold text-gray-900">
          {n}
        </span>
      )}
    </Link>
  );
}
