import "server-only";
import { asc } from "drizzle-orm";
import { db, categories } from "@/lib/db";

/** Categories for the "Links to → Category" dropdown (all, active first by sort order). */
export function bannerCategories() {
  return db.select({ slug: categories.slug, name: categories.name }).from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
}

export const cloudProps = () => ({
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "",
  apiKey: process.env.CLOUDINARY_API_KEY ?? "",
});
