import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, banners } from "@/lib/db";
import BannerForm from "../BannerForm";
import { bannerCategories, cloudProps } from "../load";

export const metadata = { title: "Edit banner – Toy Nation Admin" };

export default async function EditBannerPage({ params }: PageProps<"/admin/banners/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[b], cats] = await Promise.all([db.select().from(banners).where(eq(banners.id, id)), bannerCategories()]);
  if (!b) notFound();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 text-2xl font-semibold text-brand-dark">Edit banner</h1>
      <BannerForm
        id={b.id}
        initial={{
          imagePublicId: b.imagePublicId,
          label: b.label ?? "",
          title: b.title,
          linkText: b.linkText,
          linkType: b.linkType,
          linkValue: b.linkValue,
          color: b.color,
          startsAt: b.startsAt ?? "",
          endsAt: b.endsAt ?? "",
          isActive: b.isActive,
        }}
        categories={cats}
        {...cloudProps()}
      />
    </div>
  );
}
