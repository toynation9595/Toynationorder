/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { cldUrl } from "@/lib/images";
import type { PublicCategory } from "@/lib/catalog";

/** Light tile: product photo is the main visual; brand accent only on hover/focus. */
export default function CategoryTile({ c }: { c: PublicCategory }) {
  return (
    <Link
      href={`/products?category=${c.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-brand/10 bg-brand/[0.06] p-2 outline-none transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(91,63,160,0.15)] focus-visible:-translate-y-0.5 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/20"
    >
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-white">
        {c.image ? (
          <img
            src={cldUrl(c.image, 400)}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-2 transition duration-200 group-hover:scale-105 group-focus-visible:scale-105"
          />
        ) : (
          <span className="text-4xl" aria-hidden>🧸</span>
        )}
      </div>
      <div className="px-1.5 pb-1 pt-2">
        <div className="line-clamp-2 font-heading text-base font-semibold capitalize leading-tight text-brand-dark group-hover:text-brand">
          {c.name.toLowerCase()}
        </div>
        <div className="mt-0.5 text-xs text-gray-500">
          {c.count} {c.count === 1 ? "item" : "items"}
        </div>
      </div>
    </Link>
  );
}
