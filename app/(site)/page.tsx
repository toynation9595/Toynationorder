import Link from "next/link";
import LogoTile from "@/components/LogoTile";
import ProductCard from "@/components/ProductCard";
import CategoryTile from "@/components/CategoryTile";
import ContactButtons, { ADDRESS, BUSINESS_HOURS } from "@/components/ContactButtons";
import { featuredProducts, getActiveCategories } from "@/lib/catalog";

// Stock and price change with every order/import: always render fresh.
export const dynamic = "force-dynamic";

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
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 pb-14 pt-10 text-center md:flex-row md:py-20 md:text-left">
          {/* Mobile: the logo is already in the header, so the headline comes first. */}
          <div className="hidden shrink-0 md:block">
            <LogoTile size={180} className="rounded-3xl shadow-2xl ring-4 ring-white/20" />
          </div>
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

      <section className="relative mx-auto -mt-7 max-w-7xl px-4">
        {/* md+: indent by logo (180px) + gap (32px) so the bar lines up with the headline */}
        <form action="/products" role="search" className="card flex gap-2 p-2 md:ml-[212px] md:max-w-[560px]">
          <input
            name="q"
            type="search"
            required
            aria-label="Search products"
            placeholder="Search by name, code or barcode"
            className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-2.5 text-base outline-none placeholder:text-gray-400 sm:px-3"
          />
          <button className="btn-primary shrink-0 px-3.5 sm:px-5" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden className="h-5 w-5 sm:hidden">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>
        </form>
      </section>

      {cats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10">
          <h2 className="mb-5 text-2xl font-semibold text-brand-dark">Shop by category</h2>
          <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {cats.map((c) => (
              <CategoryTile key={c.id} c={c} />
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
              <ProductCard key={p.barcode} p={p} />
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
            {/* lg: address + hours left, buttons right */}
            <div className="mt-2 grid gap-4 lg:grid-cols-2 lg:items-start">
              <div>
                <address className="not-italic leading-relaxed text-gray-700">{ADDRESS}</address>
                {BUSINESS_HOURS && <p className="mt-2 text-sm text-gray-700">🕘 {BUSINESS_HOURS}</p>}
              </div>
              <ContactButtons className="lg:flex-col lg:items-stretch" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
