import Link from "next/link";
import LogoTile from "@/components/LogoTile";
import ProductCard from "@/components/ProductCard";
import { ADDRESS } from "@/components/SiteFooter";
import { featuredProducts, getActiveCategories } from "@/lib/catalog";

const TILE_COLORS = [
  "bg-tn-orange/10 text-tn-orange ring-tn-orange/20",
  "bg-tn-pink/10 text-tn-pink ring-tn-pink/20",
  "bg-tn-teal/10 text-tn-teal ring-tn-teal/20",
  "bg-tn-yellow/15 text-[#a8850a] ring-tn-yellow/30",
  "bg-brand-light text-brand ring-brand/20",
];

const DOTS = [
  "left-[6%] top-[18%] h-3 w-3 bg-tn-yellow",
  "left-[14%] bottom-[16%] h-2 w-2 bg-tn-teal",
  "right-[8%] top-[22%] h-2.5 w-2.5 bg-tn-pink",
  "right-[18%] bottom-[12%] h-3.5 w-3.5 bg-tn-orange",
  "left-[45%] top-[10%] h-2 w-2 bg-white/60",
  "right-[40%] bottom-[8%] h-2 w-2 bg-tn-yellow",
];

export default async function HomePage() {
  const [cats, featured] = await Promise.all([getActiveCategories(), featuredProducts(8)]);

  return (
    <>
      <section className="relative overflow-hidden bg-brand text-white">
        {DOTS.map((d) => (
          <span key={d} className={`absolute rounded-full ${d}`} aria-hidden />
        ))}
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-14 text-center md:flex-row md:py-20 md:text-left">
          <LogoTile size={180} className="rounded-3xl shadow-2xl ring-4 ring-white/20" />
          <div className="max-w-xl">
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Toys & seasonal goods, wholesale.</h1>
            <p className="mt-3 text-lg text-white/85">
              Browse the Toy Nation catalogue, build your order on your phone and send it to us on WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link href="/products" className="btn bg-tn-yellow px-6 py-3 text-base font-semibold text-gray-900 hover:bg-[#ffd633]">
                Browse products
              </Link>
              <Link href="/login" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                Retailer login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {cats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12">
          <h2 className="mb-5 text-2xl font-semibold text-brand-dark">Shop by category</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cats.map((c, i) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className={`rounded-2xl p-4 ring-1 transition hover:-translate-y-0.5 ${TILE_COLORS[i % TILE_COLORS.length]}`}
              >
                <div className="font-heading text-lg font-semibold leading-tight">{c.name}</div>
                <div className="mt-1 text-xs opacity-80">{c.count} items</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-brand-dark">New arrivals</h2>
            <Link href="/products" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.code} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="card grid gap-6 p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="text-2xl font-semibold text-brand-dark">About Toy Nation</h2>
            <p className="mt-3 leading-relaxed text-gray-600">
              Toy Nation is a toys and seasonal goods wholesaler in Ojhar, Nashik. We supply shops across the region
              with toys, festival items and seasonal stock — from everyday favourites to Rakhi, Ganpati and Diwali
              ranges.
            </p>
            <p className="mt-3 leading-relaxed text-gray-600">
              Retailers with an account see wholesale prices and can track their orders. Anyone can browse and place
              an order at retail price.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-light/60 p-5">
            <div className="text-sm font-semibold text-brand">Visit our store</div>
            <address className="mt-2 not-italic leading-relaxed text-gray-700">{ADDRESS}</address>
          </div>
        </div>
      </section>
    </>
  );
}
