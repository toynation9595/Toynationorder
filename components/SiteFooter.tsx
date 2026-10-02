import Link from "next/link";
import LogoTile from "./LogoTile";

export const ADDRESS =
  "Rajneel Square, Near Indian Oil Pump, Mumbai-Agra Service Road, Ojhar (MIG), Nashik, Maharashtra 422207";

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-brand-dark text-white/80">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex items-start gap-3">
          <LogoTile size={52} />
          <div>
            <div className="font-heading text-lg font-semibold text-white">Toy Nation</div>
            <p className="text-sm">Toys & seasonal wholesale</p>
          </div>
        </div>
        <div className="text-sm">
          <div className="mb-1 font-semibold text-white">Visit us</div>
          <address className="not-italic leading-relaxed">{ADDRESS}</address>
        </div>
        <div className="text-sm">
          <div className="mb-1 font-semibold text-white">Shop</div>
          <ul className="space-y-1">
            <li><Link href="/products" className="hover:text-white">All products</Link></li>
            <li><Link href="/login" className="hover:text-white">Retailer login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Toy Nation, Nashik
      </div>
    </footer>
  );
}
