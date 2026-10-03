"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { CLOUDINARY_FOLDER, destroyImage } from "@/lib/cloudinary";
import { cleanName } from "@/lib/productName";

function done() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function bulkAssignCategory(barcodes: string[], categoryId: number | null) {
  await requireOwner();
  if (!barcodes.length) return;
  if (categoryId !== null) {
    const [c] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
    if (!c) return;
  }
  await db.update(products).set({ categoryId }).where(inArray(products.barcode, barcodes));
  done();
}

export type TextState = { error?: string; ok?: string };

/** Save display name + description. A display name equal to the auto name is stored as NULL. */
export async function saveProductText(_prev: TextState, form: FormData): Promise<TextState> {
  await requireOwner();
  const barcode = String(form.get("barcode") ?? "");
  const displayName = String(form.get("displayName") ?? "").trim().slice(0, 200);
  const description = String(form.get("description") ?? "").trim().slice(0, 4000);
  const [p] = await db.select({ erpName: products.erpName }).from(products).where(eq(products.barcode, barcode));
  if (!p) return { error: "Product not found." };
  await db
    .update(products)
    .set({
      displayName: displayName && displayName !== cleanName(p.erpName) ? displayName : null,
      description: description || null,
    })
    .where(eq(products.barcode, barcode));
  done();
  return { ok: "Saved." };
}

/** Clear the display name so the auto-cleaned ERP name is used. */
export async function resetDisplayName(barcode: string) {
  await requireOwner();
  await db.update(products).set({ displayName: null }).where(eq(products.barcode, barcode));
  done();
}

export async function toggleVisible(barcode: string) {
  await requireOwner();
  await db.update(products).set({ isVisible: sql`not ${products.isVisible}` }).where(eq(products.barcode, barcode));
  done();
}

export async function addImage(barcode: string, publicId: string) {
  await requireOwner();
  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) return;
  const [{ n, max }] = await db
    .select({ n: sql<number>`count(*)::int`, max: sql<number>`coalesce(max(${productImages.sortOrder}), 0)::int` })
    .from(productImages)
    .where(eq(productImages.barcode, barcode));
  await db.insert(productImages).values({
    barcode,
    publicId,
    isPrimary: n === 0,
    sortOrder: max + 1,
  });
  done();
}

export async function setPrimaryImage(id: number) {
  await requireOwner();
  const [img] = await db.select().from(productImages).where(eq(productImages.id, id));
  if (!img) return;
  await db.transaction(async (tx) => {
    await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.barcode, img.barcode));
    await tx.update(productImages).set({ isPrimary: true }).where(eq(productImages.id, id));
  });
  done();
}

export async function deleteImage(id: number): Promise<{ error?: string }> {
  await requireOwner();
  const [img] = await db.select().from(productImages).where(eq(productImages.id, id));
  if (!img) return {};
  try {
    await destroyImage(img.publicId);
  } catch {
    return { error: "Could not delete the image from Cloudinary. Please try again." };
  }
  await db.delete(productImages).where(eq(productImages.id, id));
  if (img.isPrimary) {
    const [next] = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.barcode, img.barcode))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);
    if (next) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(and(eq(productImages.id, next.id), eq(productImages.barcode, img.barcode)));
    }
  }
  done();
  return {};
}
