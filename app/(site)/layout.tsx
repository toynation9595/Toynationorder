import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MobileCartBar from "@/components/MobileCartBar";
import CartProvider from "@/components/CartProvider";
import { getCurrentUser } from "@/lib/auth";
import { getCartLines } from "@/lib/user-cart";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Guests: localStorage cart. Retailers: their own cart_items. Owner/employee: no cart.
  const mode = !user ? "guest" : user.role === "retailer" ? "user" : "none";
  const who = !user ? "guest" : `u${user.id}`;
  const initialLines = user?.role === "retailer" ? await getCartLines(user.id) : [];

  return (
    <CartProvider key={who} mode={mode} who={who} initialLines={initialLines}>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileCartBar />
    </CartProvider>
  );
}
