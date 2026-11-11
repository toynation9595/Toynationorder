/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { COLOR_CLASSES, type BannerColor } from "@/lib/banner-presets";

type Props = {
  imageUrl: string | null;
  label: string | null;
  title: string;
  linkText: string;
  color: BannerColor;
  /** Omitted in the admin preview: the card is then not a link. */
  href?: string;
  /** Replaces the photo area (default "Browse products" card). */
  visual?: React.ReactNode;
};

/** White rounded banner card: 12:7 photo, label in the preset colour, title, link text with arrow. */
export default function BannerCard({ imageUrl, label, title, linkText, color, href, visual }: Props) {
  const body = (
    <>
      <div className="aspect-[12/7] overflow-hidden bg-brand-light">
        {visual ??
          (imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="flex h-full items-center justify-center text-brand/40">
              <ImageIcon className="h-10 w-10" aria-hidden />
            </div>
          ))}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5">
        <div className={`h-5 truncate text-xs font-bold uppercase tracking-wide ${COLOR_CLASSES[color].text}`}>{label}</div>
        <div className="mt-0.5 line-clamp-2 font-heading text-xl font-semibold leading-snug text-gray-900">{title}</div>
        {linkText && (
          <div className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-brand">
            {linkText}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
        )}
      </div>
    </>
  );
  const cls = "group flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_8px_30px_rgba(20,10,50,0.25)]";
  return href ? (
    <Link href={href} className={`${cls} outline-none focus-visible:ring-4 focus-visible:ring-tn-yellow`} draggable={false}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
