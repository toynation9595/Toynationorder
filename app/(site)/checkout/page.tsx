import { getCurrentUser } from "@/lib/auth";
import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Checkout – Toy Nation" };

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const retailer = user?.role === "retailer" ? user : null;
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-3xl font-semibold text-brand-dark">Checkout</h1>
      <CheckoutForm
        prefill={retailer && { name: retailer.name, shopName: retailer.shopName, mobile: retailer.mobile, city: retailer.city }}
        priceLabel={retailer ? "wholesale" : "retail"}
      />
    </div>
  );
}
