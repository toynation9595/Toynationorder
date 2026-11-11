import Link from "next/link";
import { BadgePercent, Boxes, Clock, PackageCheck, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import CategoryTile from "@/components/CategoryTile";
import BannerSlider from "@/components/BannerSlider";
import ContactButtons, { ADDRESS, BUSINESS_HOURS } from "@/components/ContactButtons";
import { countPublicProducts, featuredProducts, getActiveCategories } from "@/lib/catalog";
import { getLiveBanners } from "@/lib/banners";
import { getCurrentUser } from "@/lib/auth";
import { productCountLabel } from "@/lib/banner-presets";

// Stock, price and banners change with every order/import/edit: always render fresh.
export const dynamic = "force-dynamic";

const DOTS = [
  { cls: "left-[4%] top-[14%] h-3 w-3 bg-tn-yellow", delay: "0s" },
  { cls: "left-[38%] bottom-[10%] h-2 w-2 bg-tn-teal", delay: "0.6s" },
  { cls: "right-[6%] top-[8%] h-2.5 w-2.5 bg-tn-pink", delay: "1.2s" },
  { cls: "left-[46%] top-[12%] h-3.5 w-3.5 bg-tn-orange", delay: "0.3s" },
  { cls: "left-[10%] bottom-[14%] h-2 w-2 bg-white/60", delay: "0.9s" },
  { cls: "right-[3%] bottom-[16%] h-2.5 w-2.5 bg-tn-yellow", delay: "1.5s" },
];

export default async function HomePage() {
  const [cats, featured, total, slides, user] = await Promise.all([
    getActiveCategories(),
    featuredProducts(8),
    countPublicProducts(),
    getLiveBanners(),
    getCurrentUser(),
  ]);
  const countLabel = productCountLabel(total);

  const points = [
    { Icon: Truck, title: "Home delivery", text: "Delivered to your shop" },
    { Icon: BadgePercent, title: "Wholesale rates", text: "Half price for retailers" },
    { Icon: PackageCheck, title: "Live stock", text: "What you see is available" },
    { Icon: Boxes, title: `${countLabel} products`, text: "Packed fast in Nashik" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-brand text-white">
        {DOTS.map((d) => (
          <span key={d.cls} className={`tn-float absolute rounded-full ${d.cls}`} style={{ animationDelay: d.delay }} aria-hidden />
        ))}
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-8 md:py-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:py-16">
          <div className="text-center lg:text-left">
            <h1 className="tn-rise text-4xl font-semibold leading-tight md:text-5xl">Toys & seasonal goods, wholesale</h1>
            <p className="tn-rise mt-3 text-lg text-white/85" style={{ animationDelay: "0.12s" }}>
              Browse {countLabel} products, order online and get it delivered to your shop.
            </p>
            <div className="tn-rise mt-6 flex flex-wrap justify-center gap-3 lg:justify-start" style={{ animationDelay: "0.24s" }}>
              <Link href="/products" className="btn bg-tn-yellow px-6 py-3 text-base font-semibold text-gray-900 hover:bg-[#ffd633]">
                Browse products
              </Link>
              {!user && (
                <Link href="/login" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                  Retailer login
                </Link>
              )}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-lg">
            <BannerSlider slides={slides} countLabel={countLabel} />
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 md:grid-cols-4 md:py-7">
          {points.map(({ Icon, title, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="font-heading font-semibold text-brand-dark">{title}</div>
                <div className="text-sm text-gray-600">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {cats.length > 0 && (
        <section className="bg-brand-light/50">
          <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
            <h2 className="mb-5 text-2xl font-semibold text-brand-dark">Shop by category</h2>
            <div className="grid auto-rows-fr grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
              {cats.map((c) => (
                <CategoryTile key={c.id} c={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-2xl font-semibold text-brand-dark">New arrivals</h2>
              <Link href="/products" className="text-sm font-semibold text-brand hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.barcode} p={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Last section: -mb-16 cancels the footer's top margin so the tint meets the footer. */}
      <section className="-mb-16 bg-brand-light/50">
        <div className="mx-auto max-w-7xl px-4 py-10 md:py-12">
          <div className="card grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <div>
              <h2 className="text-2xl font-semibold text-brand-dark">Visit our store</h2>
              <p className="mt-3 leading-relaxed text-gray-600">
                Toy Nation is a toys and seasonal goods wholesaler in Ojhar, Nashik — everyday favourites plus Rakhi,
                Ganpati and Diwali ranges for shops across the region.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-light/60 p-5">
              <address className="not-italic leading-relaxed text-gray-700">{ADDRESS}</address>
              {BUSINESS_HOURS && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-700">
                  <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden /> {BUSINESS_HOURS}
                </p>
              )}
              <ContactButtons className="mt-4" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
