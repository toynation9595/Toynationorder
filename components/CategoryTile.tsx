/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { cldUrl } from "@/lib/images";
import type { PublicCategory } from "@/lib/catalog";

/** Gradients rotate by tile index; amber uses dark text for contrast. */
const THEMES = [
  { from: "#5B3FA0", to: "#7B5CC4", text: "#FFFFFF" }, // purple
  { from: "#F07A2E", to: "#F59E4C", text: "#FFFFFF" }, // orange
  { from: "#E8488A", to: "#F06BA3", text: "#FFFFFF" }, // pink
  { from: "#1E9EA8", to: "#2BB5BE", text: "#FFFFFF" }, // teal
  { from: "#E0A800", to: "#F5C518", text: "#3D2C6E" }, // amber
  { from: "#3D2C6E", to: "#5B3FA0", text: "#FFFFFF" }, // deep blue
];

export default function CategoryTile({ c, index }: { c: PublicCategory; index: number }) {
  const t = THEMES[index % THEMES.length];
  const dark = t.text !== "#FFFFFF";
  return (
    <Link
      href={`/products?category=${c.slug}`}
      className="group relative flex h-full min-h-[120px] items-center gap-3 overflow-hidden lg:flex-col-reverse lg:items-stretch lg:justify-between lg:gap-2 rounded-2xl p-3 shadow-sm sm:p-4 outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-xl focus-visible:-translate-y-0.5 focus-visible:shadow-xl focus-visible:ring-4 focus-visible:ring-brand/30"
      style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})`, color: t.text }}
    >
      {/* confetti */}
      <span aria-hidden className="absolute left-2 top-2 h-2 w-2 rounded-full bg-white/40" />
      <span aria-hidden className="absolute left-6 top-3 h-1.5 w-1.5 rounded-full bg-white/30" />
      <span aria-hidden className="absolute bottom-2 left-3 h-3 w-3 rounded-full border-2 border-white/30" />
      <span aria-hidden className="absolute -right-3 -top-3 h-10 w-10 rounded-full border-2 border-white/20" />

      <div className="relative min-w-0 flex-1 lg:flex-none">
        <div className="line-clamp-2 font-heading text-base font-semibold capitalize leading-tight sm:text-lg">
          {c.name.toLowerCase()}
        </div>
        <span
          className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            dark ? "bg-[#3D2C6E]/15" : "bg-white/20"
          }`}
        >
          {c.count} {c.count === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="relative flex h-14 w-14 shrink-0 items-center lg:self-end justify-center overflow-hidden rounded-full bg-white shadow-md transition duration-200 group-hover:scale-105 group-focus-visible:scale-105 sm:h-16 sm:w-16">
        {c.image ? (
          <img src={cldUrl(c.image, 120)} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="text-2xl" aria-hidden>🧸</span>
        )}
      </div>
    </Link>
  );
}
