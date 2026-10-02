/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { cldUrl } from "@/lib/images";
import type { PublicProduct } from "@/lib/catalog";
import AddToCart from "./AddToCart";

export function ProductImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-light to-white">
      <span className="font-heading text-3xl font-semibold text-brand/30">TN</span>
    </div>
  );
}

export default function ProductCard({ p }: { p: PublicProduct }) {
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(61,44,110,0.14)]">
      <Link href={`/products/${encodeURIComponent(p.barcode)}`} className="relative block aspect-square bg-gray-50">
        {p.image ? (
          <img src={cldUrl(p.image, 400)} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <ProductImagePlaceholder />
        )}
        {!p.inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${encodeURIComponent(p.barcode)}`} className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 hover:text-brand">
          {p.name}
        </Link>
        <span className="mt-0.5 font-mono text-[11px] text-gray-400">{p.barcode}</span>
        <span className="text-xs text-gray-500">{p.unit}</span>
        <div className="mt-auto pt-2 font-heading text-lg font-semibold text-brand-dark">{formatINR(p.price)}</div>
        <div className="mt-2">
          <AddToCart barcode={p.barcode} inStock={p.inStock} compact />
        </div>
      </div>
    </div>
  );
}
