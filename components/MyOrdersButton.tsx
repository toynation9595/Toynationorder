"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Lucide "Package" icon, inlined. */
function PackageIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}

/** Retailer-only header pill. Highlighted on /my-orders*; label shortens to "Orders" below 380px. */
export default function MyOrdersButton() {
  const active = usePathname().startsWith("/my-orders");
  return (
    <Link
      href="/my-orders"
      aria-current={active ? "page" : undefined}
      className={`ml-1 flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 font-semibold shadow-sm transition ${
        active
          ? "bg-tn-yellow text-brand-dark ring-2 ring-white"
          : "bg-white text-brand hover:bg-brand-light"
      }`}
    >
      <PackageIcon className="h-4 w-4" />
      <span className="min-[380px]:hidden">Orders</span>
      <span className="max-[379px]:hidden">My orders</span>
    </Link>
  );
}
