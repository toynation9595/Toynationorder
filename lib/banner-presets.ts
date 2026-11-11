/** Banner constants and helpers shared by the admin form, the admin list and the public slider. */

export const BANNER_FOLDER = "toy-nation/banners";
export const BANNER_TITLE_MAX = 40;

export const BANNER_COLORS = ["orange", "pink", "teal", "purple", "amber"] as const;
export type BannerColor = (typeof BANNER_COLORS)[number];

/** Label text colour + swatch per preset. */
export const COLOR_CLASSES: Record<BannerColor, { text: string; swatch: string }> = {
  orange: { text: "text-tn-orange", swatch: "bg-tn-orange" },
  pink: { text: "text-tn-pink", swatch: "bg-tn-pink" },
  teal: { text: "text-tn-teal", swatch: "bg-tn-teal" },
  purple: { text: "text-brand", swatch: "bg-brand" },
  amber: { text: "text-amber-600", swatch: "bg-amber-500" },
};

export const LINK_TYPES = ["category", "product", "search"] as const;
export type BannerLinkType = (typeof LINK_TYPES)[number];

export function bannerHref(type: BannerLinkType, value: string): string {
  if (type === "category") return `/products?category=${encodeURIComponent(value)}`;
  if (type === "product") return `/products/${encodeURIComponent(value)}`;
  return `/products?q=${encodeURIComponent(value)}`;
}

/** 12:7 banner photo, smart crop. */
export function bannerImageUrl(publicId: string): string {
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_fill,g_auto,ar_12:7,f_auto,q_auto,w_800/${publicId}`;
}

/** Today as YYYY-MM-DD in Asia/Kolkata. */
export function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export type BannerStatus = "Live" | "Scheduled" | "Off" | "Expired";

export function bannerStatus(b: { isActive: boolean; startsAt: string | null; endsAt: string | null }, today = todayIST()): BannerStatus {
  if (!b.isActive) return "Off";
  if (b.endsAt && b.endsAt < today) return "Expired";
  if (b.startsAt && b.startsAt > today) return "Scheduled";
  return "Live";
}

/** "1,200+" for 1,234 products; exact number below 100. */
export function productCountLabel(n: number): string {
  if (n < 100) return String(n);
  return `${(Math.floor(n / 100) * 100).toLocaleString("en-IN")}+`;
}
