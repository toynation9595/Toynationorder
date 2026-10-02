import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { getPriceType } from "@/lib/auth";
import { priceFor, type PriceType } from "@/lib/pricing";
import { availableSql } from "@/lib/stock";

/** Product as sent to the browser: ONE price field only, decided by the server. Keyed by barcode. */
export type PublicProduct = {
  barcode: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  /** Units that can still be ordered (ERP stock minus reserved). */
  available: number;
  inStock: boolean;
  image: string | null;
};

export type PublicCategory = { id: number; name: string; slug: string; count: number };

/** Visible product with available stock, in an active category (or uncategorised). */
const listable = and(
  eq(products.isVisible, true),
  sql`${availableSql} > 0`,
  or(isNull(products.categoryId), eq(categories.isActive, true))
)!;

const primaryImage = sql<string | null>`(
  select ${productImages.publicId} from ${productImages}
  where ${productImages.barcode} = ${products.barcode}
  order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc limit 1
)`;

const baseCols = {
  barcode: products.barcode,
  code: products.code,
  name: products.name,
  unit: products.unit,
  retailPrice: products.retailPrice,
  available: availableSql,
  image: primaryImage,
};

function toPublic(
  r: { barcode: string; code: string; name: string; unit: string; retailPrice: string; available: number; image: string | null },
  pt: PriceType
): PublicProduct {
  return {
    barcode: r.barcode,
    code: r.code,
    name: r.name,
    unit: r.unit,
    price: priceFor(r.retailPrice, pt),
    available: Number(r.available),
    inStock: Number(r.available) > 0,
    image: r.image,
  };
}

/** Search across name, ERP code and barcode. */
export function productSearch(q: string): SQL {
  return or(ilike(products.name, `%${q}%`), ilike(products.code, `%${q}%`), ilike(products.barcode, `%${q}%`))!;
}

export async function getActiveCategories(): Promise<PublicCategory[]> {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, count: count(products.id) })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.isVisible, true), sql`${availableSql} > 0`)
    )
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function listProducts(opts: { q?: string; categoryId?: number; page?: number; pageSize?: number }) {
  const pt = await getPriceType();
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const conds: SQL[] = [listable];
  if (opts.q) conds.push(productSearch(opts.q));
  if (opts.categoryId) conds.push(eq(products.categoryId, opts.categoryId));
  const where = and(...conds);

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(where),
    db
      .select(baseCols)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(asc(products.name), asc(products.barcode))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);
  return { products: rows.map((r) => toPublic(r, pt)), total, pages: Math.max(1, Math.ceil(total / pageSize)), priceType: pt };
}

/** A few products for the home page, newest arrivals with images first. */
export async function featuredProducts(limit = 8): Promise<PublicProduct[]> {
  const pt = await getPriceType();
  const rows = await db
    .select(baseCols)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(listable)
    .orderBy(sql`${primaryImage} is null`, sql`${products.lastReceived} desc nulls last`, asc(products.name))
    .limit(limit);
  return rows.map((r) => toPublic(r, pt));
}

export async function getProductsByBarcodes(barcodes: string[]): Promise<PublicProduct[]> {
  if (barcodes.length === 0) return [];
  const pt = await getPriceType();
  const rows = await db
    .select(baseCols)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(listable, inArray(products.barcode, barcodes)));
  return rows.map((r) => toPublic(r, pt));
}

export async function getProduct(barcode: string) {
  const pt = await getPriceType();
  const [r] = await db
    .select({ ...baseCols, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(listable, eq(products.barcode, barcode)))
    .limit(1);
  if (!r) return null;
  const images = await db
    .select({ publicId: productImages.publicId })
    .from(productImages)
    .where(eq(productImages.barcode, barcode))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
  return {
    product: toPublic(r, pt),
    images: images.map((i) => i.publicId),
    category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug! } : null,
    priceType: pt,
  };
}
