/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { cldUrl } from "@/lib/images";
import type { PublicProduct } from "@/lib/catalog";
import QtyStepper from "./QtyStepper";

export function ProductImagePlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-light to-white">
      <span className="font-heading text-3xl font-semibold text-brand/30">TN</span>
    </div>
  );
}

export default function ProductCard({ p }: { p: PublicProduct }) {
  const href = `/products/${encodeURIComponent(p.barcode)}`;
  const available = p.available; // one value drives both the label and the stepper limit
  return (
    <div className="card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(61,44,110,0.14)]">
      <Link href={href} className="relative block aspect-square overflow-hidden border-b border-gray-100 bg-white">
        {p.image ? (
          <img src={cldUrl(p.image, 400)} alt={p.name} loading="lazy" className="h-full w-full object-contain p-2" />
        ) : (
          <ProductImagePlaceholder />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={href} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-gray-900 hover:text-brand">
          {p.name}
        </Link>
        <span className="mt-0.5 truncate font-mono text-[11px] text-gray-400">{p.barcode}</span>
        <span className="text-xs text-gray-500">{p.unit}</span>
        <span className="text-xs font-medium text-tn-teal">Stock: {available}</span>
        <div className="mt-auto pt-2">
          <div className="mb-2 font-heading text-lg font-semibold text-brand-dark">{formatINR(p.price)}</div>
          <QtyStepper barcode={p.barcode} max={available} />
        </div>
      </div>
    </div>
  );
}
