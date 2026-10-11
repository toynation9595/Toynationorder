import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LogoTile from "./LogoTile";
import CartLink from "./CartLink";
import MyOrdersButton from "./MyOrdersButton";
import LogoutButton from "./LogoutButton";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  const retailer = user?.role === "retailer" ? user : null;
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 max-[379px]:gap-2 max-[379px]:px-3">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoTile size={42} />
          <span className="hidden font-heading text-xl font-semibold sm:inline">Toy Nation</span>
        </Link>
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
