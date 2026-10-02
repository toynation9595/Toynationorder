import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import LogoTile from "./LogoTile";
import CartLink from "./CartLink";

export default async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoTile size={42} />
          <span className="hidden font-heading text-xl font-semibold sm:inline">Toy Nation</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm font-medium">
          <Link href="/products" className="rounded-lg px-3 py-2 hover:bg-white/10">Products</Link>
          <CartLink />
          {user?.role === "retailer" && (
            <Link href="/my-orders" className="hidden rounded-lg px-3 py-2 hover:bg-white/10 sm:block">My orders</Link>
          )}
          {user?.role === "owner" && (
            <Link href="/admin/orders" className="rounded-lg px-3 py-2 hover:bg-white/10">Admin</Link>
          )}
          {user ? (
            <form action={logoutAction}>
              <button className="rounded-lg px-3 py-2 hover:bg-white/10">Logout</button>
            </form>
          ) : (
            <Link href="/login" className="rounded-lg bg-white/15 px-3 py-2 hover:bg-white/25">Login</Link>
          )}
        </nav>
      </div>
      {user?.role === "retailer" && (
        <div className="bg-brand-dark text-center text-xs text-white/90">
          <div className="mx-auto max-w-7xl px-4 py-1">
            Hi {user.name.split(" ")[0]} · {user.shopName || "Retailer"} — you are seeing <b>wholesale prices</b>
            <Link href="/my-orders" className="ml-2 underline sm:hidden">My orders</Link>
          </div>
        </div>
      )}
    </header>
  );
}
