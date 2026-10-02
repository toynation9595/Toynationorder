"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, like, or, sql } from "drizzle-orm";
import { db, categories } from "@/lib/db";
import { requireOwner } from "@/lib/auth";

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category"
  );
}

async function uniqueSlug(name: string, excludeId?: number) {
  const base = slugify(name);
  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(or(eq(categories.slug, base), like(categories.slug, `${base}-%`)));
  const taken = new Set(rows.filter((r) => r.id !== excludeId).map((r) => r.slug));
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function done() {
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}

export async function addCategory(form: FormData) {
  await requireOwner();
  const name = String(form.get("name") ?? "").trim();
  if (!name) return;
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${categories.sortOrder}), 0)` })
    .from(categories);
  await db.insert(categories).values({ name, slug: await uniqueSlug(name), sortOrder: Number(max) + 1 });
  done();
}

export async function renameCategory(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  const name = String(form.get("name") ?? "").trim();
  if (!id || !name) return;
  await db.update(categories).set({ name, slug: await uniqueSlug(name, id) }).where(eq(categories.id, id));
  done();
}

export async function toggleCategory(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  await db.update(categories).set({ isActive: sql`not ${categories.isActive}` }).where(eq(categories.id, id));
  done();
}

export async function moveCategory(form: FormData) {
  await requireOwner();
  const id = Number(form.get("id"));
  const dir = form.get("dir") === "up" ? -1 : 1;
  const list = await db.select({ id: categories.id }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.transaction(async (tx) => {
    for (let k = 0; k < list.length; k++) {
      await tx.update(categories).set({ sortOrder: k + 1 }).where(eq(categories.id, list[k].id));
    }
  });
  done();
}
