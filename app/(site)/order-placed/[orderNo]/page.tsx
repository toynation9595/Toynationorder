import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPlacedOrders } from "@/lib/placed-orders";
import { getOrderByNo, orderSummaryText, waLink } from "@/lib/orders";
import { orderLabel } from "@/lib/format";
import OrderItemsTable from "@/components/OrderItemsTable";

export const metadata = { title: "Order placed – Toy Nation" };

export default async function OrderPlacedPage({ params }: PageProps<"/order-placed/[orderNo]">) {
  const { orderNo: raw } = await params;
  const orderNo = Number(raw.replace(/^TN-/i, ""));
  const data = await getOrderByNo(orderNo);
  if (!data) notFound();
  const { order, items } = data;

  // Only the browser that placed it, the owning retailer, or the owner may view it.
  const [user, placed] = await Promise.all([getCurrentUser(), getPlacedOrders()]);
  const allowed =
    placed.includes(order.orderNo) || user?.role === "owner" || (user?.role === "retailer" && order.userId === user.id);
  if (!allowed) notFound();

  const wa = waLink(process.env.NEXT_PUBLIC_OWNER_WHATSAPP ?? "", orderSummaryText(order, items));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="card overflow-hidden">
        <div className="bg-brand px-6 py-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-tn-teal text-3xl">✓</div>
          <h1 className="text-3xl font-semibold">Order placed!</h1>
          <p className="mt-1 text-white/85">
            Your order number is <span className="font-heading text-xl font-semibold text-tn-yellow">{orderLabel(order.orderNo)}</span>
          </p>
        </div>
        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-[#25D366]/10 p-4 text-center">
            <p className="mb-3 text-sm text-gray-700">Send the order to Toy Nation on WhatsApp so we can confirm it quickly.</p>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] px-6 py-3 text-base text-white hover:bg-[#1ebe5b]">
              Send on WhatsApp
            </a>
          </div>

          <div className="grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
            <div><span className="text-gray-500">Customer:</span> {order.customerName}</div>
            {order.shopName && <div><span className="text-gray-500">Shop:</span> {order.shopName}</div>}
            <div><span className="text-gray-500">Mobile:</span> +91 {order.mobile}</div>
            <div><span className="text-gray-500">City:</span> {order.city}</div>
          </div>

          <OrderItemsTable items={items} total={order.total} />

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/products" className="btn-outline">Continue shopping</Link>
            {user?.role === "retailer" && <Link href="/my-orders" className="btn-outline">My orders</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
