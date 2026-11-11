"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db, banners, products } from "@/lib/db";
import { requireOwner } from "@/lib/auth";
import { destroyImage } from "@/lib/cloudinary";
import { shownName } from "@/lib/productName";
import {
  BANNER_COLORS,
  BANNER_FOLDER,
  BANNER_TITLE_MAX,
  LINK_TYPES,
  type BannerColor,
  type BannerLinkType,
} from "@/lib/banner-presets";

function done() {
  revalidatePath("/admin/banners");
  revalidatePath("/");
}

export type BannerInput = {
  imagePublicId: string;
  label: string;
  title: string;
  linkText: string;
  linkType: BannerLinkType;
  linkValue: string;
  color: BannerColor;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function clean(input: BannerInput) {
  const title = input.title.trim();
  const linkValue = input.linkValue.trim();
  const startsAt = DATE_RE.test(input.startsAt) ? input.startsAt : null;
  const endsAt = DATE_RE.test(input.endsAt) ? input.endsAt : null;
  if (!input.imagePublicId.startsWith(`${BANNER_FOLDER}/`)) return { error: "Please upload a photo." };
  if (!title) return { error: "Title is required." };
  if (title.length > BANNER_TITLE_MAX) return { error: `Title can be at most ${BANNER_TITLE_MAX} characters.` };
  if (!LINK_TYPES.includes(input.linkType)) return { error: "Choose a link type." };
  if (!linkValue) return { error: "Choose where the banner links to." };
  if (!BANNER_COLORS.includes(input.color)) return { error: "Choose a colour." };
  if (startsAt && endsAt && endsAt < startsAt) return { error: "“Show until” must be on or after “Show from”." };
  return {
    values: {
      imagePublicId: input.imagePublicId,
      label: input.label.trim() || null,
      title,
      linkText: input.linkText.trim(),
      linkType: input.linkType,
      linkValue,
      color: input.color,
      startsAt,
      endsAt,
      isActive: !!input.isActive,
    },
  };
}

/** Create (id null) or update a banner. A replaced photo is removed from Cloudinary. */
export async function saveBanner(id: number | null, input: BannerInput): Promise<{ error?: string }> {
  await requireOwner();
  const r = clean(input);
  if (!r.values) return { error: r.error };
  if (id) {
    const [old] = await db.select({ img: banners.imagePublicId }).from(banners).where(eq(banners.id, id));
    if (!old) return { error: "Banner not found." };
    await db.update(banners).set({ ...r.values, updatedAt: new Date() }).where(eq(banners.id, id));
    if (old.img !== r.values.imagePublicId) await destroyImage(old.img).catch(() => {});
  } else {
    const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${banners.sortOrder}), 0)` }).from(banners);
    await db.insert(banners).values({ ...r.values, sortOrder: Number(max) + 1 });
  }
  done();
  redirect("/admin/banners");
}

/** Removes an uploaded photo the form did not save (replaced or abandoned in the form). */
export async function discardUpload(publicId: string) {
  await requireOwner();
  if (!publicId.startsWith(`${BANNER_FOLDER}/`)) return;
  const [used] = await db.select({ id: banners.id }).from(banners).where(eq(banners.imagePublicId, publicId));
  if (!used) await destroyImage(publicId).catch(() => {});
}

export async function deleteBanner(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  const [b] = await db.select({ img: banners.imagePublicId }).from(banners).where(eq(banners.id, id));
  if (!b) return;
  await db.delete(banners).where(eq(banners.id, id));
  await destroyImage(b.img).catch(() => {});
  done();
}

export async function toggleBanner(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  await db
    .update(banners)
    .set({ isActive: sql`not ${banners.isActive}`, updatedAt: new Date() })
    .where(eq(banners.id, id));
  done();
}

export async function moveBanner(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const list = await db.select({ id: banners.id }).from(banners).orderBy(asc(banners.sortOrder), asc(banners.id));
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.transaction(async (tx) => {
    for (let k = 0; k < list.length; k++) {
      await tx.update(banners).set({ sortOrder: k + 1 }).where(eq(banners.id, list[k].id));
    }
  });
  done();
}

/** Barcode lookup for the "Product" link type. */
export async function lookupProduct(barcode: string): Promise<{ name: string } | null> {
  await requireOwner();
  const code = barcode.trim();
  if (!code) return null;
  const [p] = await db
    .select({ displayName: products.displayName, erpName: products.erpName })
    .from(products)
    .where(eq(products.barcode, code));
  return p ? { name: shownName(p.displayName, p.erpName) } : null;
}
