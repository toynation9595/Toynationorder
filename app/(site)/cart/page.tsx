import { getPriceType } from "@/lib/auth";
import CartView from "./CartView";

export const metadata = { title: "Cart – Toy Nation" };

export default async function CartPage() {
  const pt = await getPriceType();
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-3xl font-semibold text-brand-dark">Your cart</h1>
      <CartView priceLabel={pt === "wholesale" ? "Wholesale prices" : "Retail prices"} />
    </div>
  );
}
