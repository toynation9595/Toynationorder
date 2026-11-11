/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { asc } from "drizzle-orm";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { db, banners } from "@/lib/db";
import { bannerImageUrl, bannerStatus, todayIST, type BannerStatus } from "@/lib/banner-presets";
import { deleteBanner, moveBanner, toggleBanner } from "./actions";
import ConfirmButton from "./ConfirmButton";

export const metadata = { title: "Banners – Toy Nation Admin" };
export const dynamic = "force-dynamic";

const BADGE: Record<BannerStatus, string> = {
  Live: "bg-green-100 text-green-700",
  Scheduled: "bg-amber-100 text-amber-700",
  Off: "bg-gray-100 text-gray-500",
  Expired: "bg-red-50 text-red-600",
};

function fmt(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function BannersPage() {
  const rows = await db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.id));
  const today = todayIST();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-dark">Banners</h1>
        <Link href="/admin/banners/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden /> Add banner
        </Link>
      </div>
      <p className="mb-4 text-sm text-gray-500">Live banners rotate in the home page hero, in this order. Dates use India time.</p>

      <div className="card divide-y divide-gray-100">
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No banners yet. The home page shows a default “Browse products” card.</p>
        )}
        {rows.map((b, i) => {
          const status = bannerStatus(b, today);
          const from = fmt(b.startsAt);
          const until = fmt(b.endsAt);
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex flex-col">
                <form action={moveBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button disabled={i === 0} aria-label="Move up" className="p-1 text-gray-500 hover:text-brand disabled:opacity-25">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </form>
                <form action={moveBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button disabled={i === rows.length - 1} aria-label="Move down" className="p-1 text-gray-500 hover:text-brand disabled:opacity-25">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </form>
              </div>
              <img src={bannerImageUrl(b.imagePublicId)} alt="" className="aspect-[12/7] w-28 shrink-0 rounded-lg bg-gray-100 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-semibold text-gray-900">{b.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE[status]}`}>{status}</span>
                </div>
                <div className="mt-0.5 text-xs text-gray-500">
                  {from || until ? `${from ?? "Any time"} → ${until ?? "No end"}` : "Always"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    role="switch"
                    aria-checked={b.isActive}
                    aria-label={b.isActive ? "Turn off" : "Turn on"}
                    className={`relative h-6 w-11 rounded-full transition ${b.isActive ? "bg-tn-teal" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${b.isActive ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </form>
                <Link href={`/admin/banners/${b.id}`} className="btn-outline px-3 py-1.5" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Link>
                <form action={deleteBanner}>
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmButton message="Delete this banner? Its photo is also removed from Cloudinary.">
                    <Trash2 className="h-4 w-4" />
                  </ConfirmButton>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
