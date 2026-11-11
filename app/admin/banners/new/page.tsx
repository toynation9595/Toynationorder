import BannerForm from "../BannerForm";
import { bannerCategories, cloudProps } from "../load";

export const metadata = { title: "Add banner – Toy Nation Admin" };

export default async function NewBannerPage() {
  const cats = await bannerCategories();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-5 text-2xl font-semibold text-brand-dark">Add banner</h1>
      <BannerForm
        id={null}
        initial={{
          imagePublicId: "",
          label: "",
          title: "",
          linkText: "Shop now",
          linkType: "category",
          linkValue: cats[0]?.slug ?? "",
          color: "orange",
          startsAt: "",
          endsAt: "",
          isActive: true,
        }}
        categories={cats}
        {...cloudProps()}
      />
    </div>
  );
}
