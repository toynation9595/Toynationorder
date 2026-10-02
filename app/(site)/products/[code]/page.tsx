import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { formatINR } from "@/lib/format";
import Gallery from "./Gallery";
import AddToCart from "@/components/AddToCart";

export default async function ProductPage({ params }: PageProps<"/products/[code]">) {
  const { code } = await params;
  const data = await getProduct(decodeURIComponent(code));
  if (!data) notFound();
  const { product: p, images, category, priceType } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/products" className="hover:text-brand">Products</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/products?category=${category.slug}`} className="hover:text-brand">{category.name}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Gallery images={images} name={p.name} />

        <div>
          <h1 className="text-2xl font-semibold leading-tight text-gray-900 md:text-3xl">{p.name}</h1>
          <p className="mt-1 text-sm text-gray-500">Code #{p.code} · {p.unit}</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-semibold text-brand-dark">{formatINR(p.price)}</span>
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-semibold text-brand">
              {priceType === "wholesale" ? "Wholesale" : "Retail"} price / {p.unit || "unit"}
            </span>
          </div>

          <div className="mt-3">
            {p.inStock ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-tn-teal">
                <span className="h-2 w-2 rounded-full bg-tn-teal" /> In stock
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-gray-900/80 px-2.5 py-0.5 text-xs font-semibold text-white">
                Out of stock
              </span>
            )}
          </div>

          <div className="mt-6">
            <AddToCart code={p.code} inStock={p.inStock} />
          </div>

          {priceType === "retail" && (
            <p className="mt-6 rounded-xl bg-tn-yellow/15 p-3 text-sm text-gray-700">
              Retailer? <Link href="/login" className="font-semibold text-brand hover:underline">Log in</Link> to see
              wholesale prices.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
