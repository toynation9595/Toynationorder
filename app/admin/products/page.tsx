import Link from "next/link";
import { and, asc, count, eq, exists, inArray, isNull, not, type SQL } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { productSearch, shownNameSql } from "@/lib/catalog";
import { cleanName, shownName } from "@/lib/productName";
import { availableSql, reservedSql } from "@/lib/stock";
import ProductsTable, { type AdminProduct } from "./ProductsTable";

export const metadata = { title: "Products – Toy Nation Admin" };

const PAGE_SIZE = 50;
const FILTERS = [
  { key: "", label: "All" },
  { key: "uncat", label: "Uncategorised" },
  { key: "noimg", label: "No image" },
  { key: "out", label: "Out of stock" },
];

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const f = typeof sp.f === "string" ? sp.f : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const hasImage = exists(
    db.select({ x: productImages.id }).from(productImages).where(eq(productImages.barcode, products.barcode))
  );
  const conds: SQL[] = [];
  if (q) conds.push(productSearch(q));
  if (f === "uncat") conds.push(isNull(products.categoryId));
  if (f === "noimg") conds.push(not(hasImage));
  if (f === "out") conds.push(eq(products.inStock, false));
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], rows, cats] = await Promise.all([
    db.select({ total: count() }).from(products).where(where),
    db
      .select({
        barcode: products.barcode,
        code: products.code,
        erpName: products.erpName,
        displayName: products.displayName,
        description: products.description,
        unit: products.unit,
        wholesalePrice: products.wholesalePrice,
        stockQty: products.stockQty,
        reserved: reservedSql,
        available: availableSql,
        inStock: products.inStock,
        isVisible: products.isVisible,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(where)
      .orderBy(asc(shownNameSql), asc(products.barcode))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder)),
  ]);

  const barcodes = rows.map((r) => r.barcode);
  const imgs = barcodes.length
    ? await db
        .select({ id: productImages.id, barcode: productImages.barcode, publicId: productImages.publicId, isPrimary: productImages.isPrimary })
        .from(productImages)
        .where(inArray(productImages.barcode, barcodes))
        .orderBy(asc(productImages.sortOrder))
    : [];

  const list: AdminProduct[] = rows.map((r) => ({
    ...r,
    name: shownName(r.displayName, r.erpName),
    autoName: cleanName(r.erpName),
    images: imgs.filter((i) => i.barcode === r.barcode).map(({ id, publicId, isPrimary }) => ({ id, publicId, isPrimary })),
  }));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (o: Record<string, string | number>) => {
    const p = new URLSearchParams();
    const merged = { q, f, page, ...o };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/admin/products${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-dark">Products</h1>
        <form className="flex w-full gap-2 sm:w-auto">
          {f && <input type="hidden" name="f" value={f} />}
          <input name="q" defaultValue={q} placeholder="Search name, code or barcode" className="input sm:w-72" />
          <button className="btn-primary">Search</button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={qs({ f: x.key, page: 1 })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              f === x.key ? "bg-brand text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-brand-light"
            }`}
          >
            {x.label}
          </Link>
        ))}
        <span className="ml-auto self-center text-sm text-gray-500">{total} products</span>
      </div>

      <ProductsTable
        products={list}
        categories={cats}
        cloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}
        apiKey={process.env.CLOUDINARY_API_KEY ?? ""}
      />

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={qs({ page: page - 1 })} className="btn-outline">← Prev</Link>}
          <span className="text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link href={qs({ page: page + 1 })} className="btn-outline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
