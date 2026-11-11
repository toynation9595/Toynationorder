import "server-only";
import { and, asc, eq, isNull, lte, gte, or } from "drizzle-orm";
import { db, banners } from "@/lib/db";
import { bannerHref, bannerImageUrl, todayIST, type BannerColor } from "@/lib/banner-presets";

export type SlideData = {
  id: number;
  href: string;
  imageUrl: string;
  label: string | null;
  title: string;
  linkText: string;
  color: BannerColor;
};

/** Banners shown on the home page: active and today (Asia/Kolkata) within starts_at..ends_at. */
export async function getLiveBanners(): Promise<SlideData[]> {
  const today = todayIST();
  const rows = await db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.isActive, true),
        or(isNull(banners.startsAt), lte(banners.startsAt, today)),
        or(isNull(banners.endsAt), gte(banners.endsAt, today))
      )
    )
    .orderBy(asc(banners.sortOrder), asc(banners.id));
  return rows.map((b) => ({
    id: b.id,
    href: bannerHref(b.linkType, b.linkValue),
    imageUrl: bannerImageUrl(b.imagePublicId),
    label: b.label,
    title: b.title,
    linkText: b.linkText,
    color: b.color,
  }));
}
