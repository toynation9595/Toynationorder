"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db, products, productImages, categories } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { CLOUDINARY_FOLDER, destroyImage } from "@/lib/cloudinary";

function done() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
}

export async function bulkAssignCategory(codes: string[], categoryId: number | null) {
  await requireOwner();
  if (!codes.length) return;
  if (categoryId !== null) {
    const [c] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
    if (!c) return;
  }
  await db.update(products).set({ categoryId }).where(inArray(products.code, codes));
  done();
}

export async function toggleVisible(code: string) {
  await requireOwner();
  await db.update(products).set({ isVisible: sql`not ${products.isVisible}` }).where(eq(products.code, code));
  done();
}

export async function addImage(code: string, publicId: string) {
  await requireOwner();
  if (!publicId.startsWith(`${CLOUDINARY_FOLDER}/`)) return;
  const [{ n, max }] = await db
    .select({ n: sql<number>`count(*)::int`, max: sql<number>`coalesce(max(${productImages.sortOrder}), 0)::int` })
    .from(productImages)
    .where(eq(productImages.productCode, code));
  await db.insert(productImages).values({
    productCode: code,
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
    await tx.update(productImages).set({ isPrimary: false }).where(eq(productImages.productCode, img.productCode));
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
      .where(eq(productImages.productCode, img.productCode))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);
    if (next) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(and(eq(productImages.id, next.id), eq(productImages.productCode, img.productCode)));
    }
  }
  done();
  return {};
}
