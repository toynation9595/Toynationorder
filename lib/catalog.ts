import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { getPriceType } from "@/lib/auth";
import { priceFor, type PriceType } from "@/lib/pricing";

/** Product as sent to the browser: ONE price field only, decided by the server. */
export type PublicProduct = {
  code: string;
  name: string;
  unit: string;
  price: number;
  inStock: boolean;
  image: string | null;
};

export type PublicCategory = { id: number; name: string; slug: string; count: number };

/** Visible product in an active category (or uncategorised). */
const listable = and(
  eq(products.isVisible, true),
  or(isNull(products.categoryId), eq(categories.isActive, true))
)!;

const primaryImage = sql<string | null>`(
  select ${productImages.publicId} from ${productImages}
  where ${productImages.productCode} = ${products.code}
  order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc limit 1
)`;

function toPublic(
  r: { code: string; name: string; unit: string; retailPrice: string; inStock: boolean; image: string | null },
  pt: PriceType
): PublicProduct {
  return { code: r.code, name: r.name, unit: r.unit, price: priceFor(r.retailPrice, pt), inStock: r.inStock, image: r.image };
}

const baseCols = {
  code: products.code,
  name: products.name,
  unit: products.unit,
  retailPrice: products.retailPrice,
  inStock: products.inStock,
  image: primaryImage,
};

export async function getActiveCategories(): Promise<PublicCategory[]> {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug, count: count(products.id) })
    .from(categories)
    .leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isVisible, true)))
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function listProducts(opts: { q?: string; categoryId?: number; page?: number; pageSize?: number }) {
  const pt = await getPriceType();
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const conds: SQL[] = [listable];
  if (opts.q) conds.push(or(ilike(products.name, `%${opts.q}%`), ilike(products.code, `%${opts.q}%`))!);
  if (opts.categoryId) conds.push(eq(products.categoryId, opts.categoryId));
  const where = and(...conds);

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(where),
    db
      .select(baseCols)
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(desc(products.inStock), asc(products.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);
  return { products: rows.map((r) => toPublic(r, pt)), total, pages: Math.max(1, Math.ceil(total / pageSize)), priceType: pt };
}

/** A few in-stock products for the home page, newest arrivals with images first. */
export async function featuredProducts(limit = 8): Promise<PublicProduct[]> {
  const pt = await getPriceType();
  const rows = await db
    .select(baseCols)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(listable, eq(products.inStock, true)))
    .orderBy(sql`${primaryImage} is null`, sql`${products.lastReceived} desc nulls last`, asc(products.name))
    .limit(limit);
  return rows.map((r) => toPublic(r, pt));
}

export async function getProductsByCodes(codes: string[]): Promise<PublicProduct[]> {
  if (codes.length === 0) return [];
  const pt = await getPriceType();
  const rows = await db
    .select(baseCols)
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(listable, inArray(products.code, codes)));
  return rows.map((r) => toPublic(r, pt));
}

export async function getProduct(code: string) {
  const pt = await getPriceType();
  const [r] = await db
    .select({ ...baseCols, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(listable, eq(products.code, code)))
    .limit(1);
  if (!r) return null;
  const images = await db
    .select({ publicId: productImages.publicId })
    .from(productImages)
    .where(eq(productImages.productCode, code))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
  return {
    product: toPublic(r, pt),
    images: images.map((i) => i.publicId),
    category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug! } : null,
    priceType: pt,
  };
}
