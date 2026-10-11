"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

/** Mobile-only (<768px) sticky cart bar on public pages, hidden on /cart and /checkout. */
export default function MobileCartBar() {
  const path = usePathname();
  const { lines, enabled } = useCart();
  const count = lines.length;
  if (!enabled || count === 0 || path.startsWith("/cart") || path.startsWith("/checkout")) return null;

  return (
    <>
      {/* Spacer so the end of the page isn't hidden behind the bar. */}
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 bg-brand text-white shadow-[0_-4px_16px_rgba(61,44,110,0.25)] md:hidden">
        <div className="flex items-center gap-3 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1 text-sm font-semibold">
            {count} {count === 1 ? "item" : "items"}
          </div>
          <Link href="/cart" className="btn shrink-0 bg-white px-4 py-2 text-brand hover:bg-brand-light">
            View cart →
          </Link>
        </div>
      </div>
    </>
  );
}
