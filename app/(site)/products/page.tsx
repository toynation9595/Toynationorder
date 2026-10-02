import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getActiveCategories, listProducts } from "@/lib/catalog";

export const metadata = { title: "Products – Toy Nation" };

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const slug = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const cats = await getActiveCategories();
  const cat = cats.find((c) => c.slug === slug);
  const { products, total, pages, priceType } = await listProducts({ q, categoryId: cat?.id, page });

  const href = (o: { category?: string; page?: number }) => {
    const p = new URLSearchParams();
    const c = o.category ?? slug;
    if (q) p.set("q", q);
    if (c) p.set("category", c);
    if (o.page && o.page > 1) p.set("page", String(o.page));
    const s = p.toString();
    return `/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-dark">{cat?.name ?? "All products"}</h1>
          <p className="text-sm text-gray-500">
            {total} item{total === 1 ? "" : "s"}
            {q && <> matching “{q}”</>}
            {" · "}
            {priceType === "wholesale" ? "Wholesale prices" : "Retail prices"}
          </p>
        </div>
        <form className="flex gap-2 sm:w-96">
          {slug && <input type="hidden" name="category" value={slug} />}
          <input name="q" defaultValue={q} type="search" placeholder="Search name, code or barcode" className="input" />
          <button className="btn-primary">Search</button>
        </form>
      </div>

      {cats.length > 0 && (
        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link
            href={href({ category: "", page: 1 })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
              !cat ? "bg-brand text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-brand-light"
            }`}
          >
            All
          </Link>
          {cats.map((c) => (
            <Link
              key={c.id}
              href={href({ category: c.slug, page: 1 })}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium ${
                cat?.id === c.id ? "bg-brand text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-brand-light"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          No products found.{" "}
          {(q || cat) && <Link href="/products" className="font-semibold text-brand hover:underline">Clear filters</Link>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.barcode} p={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })} className="btn-outline">← Prev</Link>}
          <span className="text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="btn-outline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
