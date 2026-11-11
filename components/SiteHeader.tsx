import Link from "next/link";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import CartLink from "./CartLink";
import MyOrdersButton from "./MyOrdersButton";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const retailer = user?.role === "retailer" ? user : null;
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      {/* Mobile: search wraps to its own full-width row below the bar. md+: centred between logo and nav. */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 max-[379px]:gap-x-2 max-[379px]:px-3 md:flex-nowrap">
        <Link href="/" aria-label="Toy Nation home" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-tn-mark.png" alt="" width={59} height={36} className="h-9 w-auto object-contain" />
          <span className="hidden font-heading text-xl font-semibold sm:inline">Toy Nation</span>
        </Link>
        <form
          action="/products"
          role="search"
          className="order-last flex w-full items-center gap-2 rounded-full border border-white/20 bg-white/[0.14] px-3.5 focus-within:border-white/50 md:order-none md:mx-auto md:max-w-[360px] md:flex-1"
        >
          <Search className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          <input
            name="q"
            type="search"
            aria-label="Search products"
            placeholder="Search by name, code or barcode"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/60"
          />
        </form>
        <nav className="ml-auto flex items-center gap-1 whitespace-nowrap text-sm font-medium max-[379px]:gap-0">
          <Link href="/products" className="rounded-lg px-3 py-2 hover:bg-white/10 max-[379px]:px-2">Products</Link>
          {(!user || retailer) && <CartLink />}
          {retailer ? (
            <MyOrdersButton />
          ) : (
            <>
              {user?.role === "owner" && (
                <Link href="/admin/orders" className="rounded-lg px-3 py-2 hover:bg-white/10">Admin</Link>
              )}
              {user ? (
                <LogoutButton className="rounded-lg px-3 py-2 hover:bg-white/10" />
              ) : (
                <Link href="/login" className="rounded-lg bg-white/15 px-3 py-2 hover:bg-white/25">Login</Link>
              )}
            </>
          )}
        </nav>
      </div>
      {retailer && (
        <div className="bg-brand-dark text-xs text-white/90">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1">
            <span className="min-w-0 flex-1 truncate">
              Hi {retailer.name.split(" ")[0]} · {retailer.shopName || "Retailer"} — you are seeing <b>wholesale prices</b>
            </span>
            <LogoutButton formClassName="shrink-0" className="text-white/80 underline-offset-2 hover:text-white hover:underline" />
          </div>
        </div>
      )}
    </header>
  );
}
