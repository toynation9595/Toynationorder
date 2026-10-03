import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { getPriceType } from "@/lib/auth";
import { priceFor } from "@/lib/pricing";
import { availableSql } from "@/lib/stock";
import { shownName } from "@/lib/productName";

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

/** Same rules as cleanName() in lib/productName.ts, in SQL — used only for sorting by the shown name. */
// POSIX [[:space:]] instead of \s: no backslash escaping across the JS → SQL boundary.
const CLEAN_PREFIX_RE = "^(T[[:space:]]+[A-Za-z]{3}|BAH[[:space:]]+DBT|[A-Za-z])([[:space:]]+|$)";
export const shownNameSql = sql<string>`coalesce(
  nullif(btrim(${products.displayName}), ''),
  nullif(regexp_replace(btrim(${products.erpName}), ${CLEAN_PREFIX_RE}, ''), ''),
  btrim(${products.erpName})
)`;

export type PublicCategory = { id: number; name: string; slug: string; count: number; image: string | null };

/*
 * Primary image of the first visible, in-stock product (by name) in the category that has an image.
 * Correlated subquery so all categories load in ONE query; explicit aliases avoid ambiguity with the
 * outer join on products.
 */
const categoryImage = sql<string | null>`(
  select pi.public_id from products p2
  join product_images pi on pi.barcode = p2.barcode
  where p2.category_id = "categories"."id" and p2.is_visible and p2.in_stock
  order by coalesce(p2.display_name, p2.erp_name), p2.barcode, pi.is_primary desc, pi.sort_order
  limit 1
)`;

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

type PublicRow = {
  product: PublicProduct;
  description: string | null;
  category: { name: string; slug: string } | null;
};

/**
 * The ONE query behind every product list the public site shows (home, catalogue, search,
 * product page, cart, checkout). It always returns `available` as a JS number and the
 * session's single price.
 */
async function queryPublicProducts(opts: {
  where?: SQL;
  orderBy?: SQL[];
  limit?: number;
  offset?: number;
}): Promise<PublicRow[]> {
  const pt = await getPriceType();
  let q = db
    .select({
      barcode: products.barcode,
      code: products.code,
      erpName: products.erpName,
      displayName: products.displayName,
      description: products.description,
      unit: products.unit,
      retailPrice: products.retailPrice,
      available: availableSql,
      image: primaryImage,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(opts.where ? and(listable, opts.where) : listable)
    .orderBy(...(opts.orderBy ?? [asc(shownNameSql), asc(products.barcode)]))
    .$dynamic();
  if (opts.limit !== undefined) q = q.limit(opts.limit);
  if (opts.offset) q = q.offset(opts.offset);
  const rows = await q;
  return rows.map((r) => {
    const available = Number(r.available) || 0;
    return {
      product: {
        barcode: r.barcode,
        code: r.code,
        name: shownName(r.displayName, r.erpName),
        unit: r.unit,
        price: priceFor(r.retailPrice, pt),
        available,
        inStock: available > 0,
        image: r.image,
      },
      description: r.description?.trim() || null,
      category: r.categoryName && r.categorySlug ? { name: r.categoryName, slug: r.categorySlug } : null,
    };
  });
}

/**
 * Search across the shown name, ERP name, code and barcode. The auto-cleaned name is a suffix of
 * the ERP name, so matching erp_name and display_name covers every shown name.
 */
export function productSearch(q: string): SQL {
  const like = `%${q}%`;
  return or(
    ilike(products.displayName, like),
    ilike(products.erpName, like),
    ilike(products.code, like),
    ilike(products.barcode, like)
  )!;
}

export async function getActiveCategories(): Promise<PublicCategory[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      count: count(products.id),
      image: categoryImage,
    })
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
  const pageSize = opts.pageSize ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const conds: SQL[] = [];
  if (opts.q) conds.push(productSearch(opts.q));
  if (opts.categoryId) conds.push(eq(products.categoryId, opts.categoryId));
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], rows, priceType] = await Promise.all([
    db
      .select({ total: count() })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(where ? and(listable, where) : listable),
    queryPublicProducts({ where, limit: pageSize, offset: (page - 1) * pageSize }),
    getPriceType(),
  ]);
  return { products: rows.map((r) => r.product), total, pages: Math.max(1, Math.ceil(total / pageSize)), priceType };
}

/** A few products for the home page, newest arrivals with images first. */
export async function featuredProducts(limit = 8): Promise<PublicProduct[]> {
  const rows = await queryPublicProducts({
    orderBy: [sql`${primaryImage} is null`, sql`${products.lastReceived} desc nulls last`, asc(shownNameSql)],
    limit,
  });
  return rows.map((r) => r.product);
}

export async function getProductsByBarcodes(barcodes: string[]): Promise<PublicProduct[]> {
  if (barcodes.length === 0) return [];
  const rows = await queryPublicProducts({ where: inArray(products.barcode, barcodes) });
  return rows.map((r) => r.product);
}

export async function getProduct(barcode: string) {
  const [[r], priceType] = await Promise.all([
    queryPublicProducts({ where: eq(products.barcode, barcode), limit: 1 }),
    getPriceType(),
  ]);
  if (!r) return null;
  const images = await db
    .select({ publicId: productImages.publicId })
    .from(productImages)
    .where(eq(productImages.barcode, barcode))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
  return {
    product: r.product,
    description: r.description,
    images: images.map((i) => i.publicId),
    category: r.category,
    priceType,
  };
}
