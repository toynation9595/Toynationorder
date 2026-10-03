import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db, products } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { groupErpRows, type ErpRow, type ImportSummary } from "@/lib/erp-import";
import { markImported } from "@/lib/stock";

export const maxDuration = 60;

function cleanRows(input: unknown): ErpRow[] | null {
  if (!Array.isArray(input)) return null;
  const out: ErpRow[] = [];
  for (const r of input) {
    if (!r || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const date = typeof o.recDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.recDate) ? o.recDate : null;
    out.push({
      code: String(o.code ?? ""),
      name: String(o.name ?? ""),
      unit: String(o.unit ?? ""),
      stock: Number(o.stock) || 0,
      price: Number(o.price) || 0,
      recDate: date,
      barcode: String(o.barcode ?? ""),
    });
  }
  return out;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rows = cleanRows(body?.rows);
  if (!rows) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const { products: grouped, skipped } = groupErpRows(rows);
  if (grouped.length === 0) {
    return NextResponse.json({ error: "No valid product rows found in the file. Nothing was changed." }, { status: 400 });
  }

  const barcodes = grouped.map((p) => p.barcode);

  const summary = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ barcode: products.barcode, code: products.code, categoryId: products.categoryId })
      .from(products);
    const existingSet = new Set(existing.map((e) => e.barcode));
    // New barcodes inherit the category of an existing product with the same code.
    const categoryByCode = new Map<string, number>();
    for (const e of existing) if (e.categoryId !== null && !categoryByCode.has(e.code)) categoryByCode.set(e.code, e.categoryId);
    const created = barcodes.filter((b) => !existingSet.has(b)).length;

    const CHUNK = 500;
    for (let i = 0; i < grouped.length; i += CHUNK) {
      const chunk = grouped.slice(i, i + CHUNK).map((p) => ({
        barcode: p.barcode,
        code: p.code,
        erpName: p.name,
        unit: p.unit,
        wholesalePrice: String(p.wholesalePrice),
        stockQty: String(p.stockQty),
        inStock: p.stockQty > 0,
        lastReceived: p.lastReceived,
        // Only applies on insert; the conflict update below never touches category_id.
        categoryId: categoryByCode.get(p.code) ?? null,
        updatedAt: new Date(),
      }));
      await tx
        .insert(products)
        .values(chunk)
        .onConflictDoUpdate({
          target: products.barcode,
          set: {
            code: sql`excluded.code`,
            erpName: sql`excluded.erp_name`,
            unit: sql`excluded.unit`,
            wholesalePrice: sql`excluded.wholesale_price`,
            stockQty: sql`excluded.stock_qty`,
            inStock: sql`excluded.in_stock`,
            lastReceived: sql`excluded.last_received`,
            updatedAt: sql`now()`,
          },
        });
    }

    const marked = await tx
      .update(products)
      .set({ inStock: false, updatedAt: new Date() })
      .where(and(notInArray(products.barcode, barcodes), eq(products.inStock, true)))
      .returning({ id: products.id });

    await markImported(tx);

    return {
      products: grouped.length,
      created,
      updated: grouped.length - created,
      markedOutOfStock: marked.length,
      skipped,
    } satisfies ImportSummary;
  });

  revalidatePath("/", "layout");
  return NextResponse.json(summary);
}
