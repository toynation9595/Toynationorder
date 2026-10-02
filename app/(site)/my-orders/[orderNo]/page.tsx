import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRetailer } from "@/lib/auth";
import { getOrderByNo } from "@/lib/orders";
import { formatDateTime, orderLabel } from "@/lib/format";
import OrderItemsTable from "@/components/OrderItemsTable";
import StatusBadge from "@/components/StatusBadge";

export default async function MyOrderPage({ params }: PageProps<"/my-orders/[orderNo]">) {
  const user = await requireRetailer();
  const { orderNo } = await params;
  const data = await getOrderByNo(Number(orderNo.replace(/^TN-/i, "")));
  // Retailers can only see their own orders.
  if (!data || data.order.userId !== user.id) notFound();
  const { order: o, items } = data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/my-orders" className="text-sm text-gray-500 hover:text-brand">← My orders</Link>
      <div className="mt-2 mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-brand-dark">{orderLabel(o.orderNo)}</h1>
        <StatusBadge status={o.status} />
        <span className="ml-auto text-sm text-gray-500">{formatDateTime(o.createdAt)}</span>
      </div>
      <div className="card space-y-4 p-5">
        <div className="grid gap-1 text-sm text-gray-700 sm:grid-cols-2">
          <div><span className="text-gray-500">Name:</span> {o.customerName}</div>
          <div><span className="text-gray-500">Shop:</span> {o.shopName}</div>
          <div><span className="text-gray-500">Mobile:</span> +91 {o.mobile}</div>
          <div><span className="text-gray-500">City:</span> {o.city}</div>
        </div>
        <OrderItemsTable items={items} total={o.total} />
      </div>
    </div>
  );
}
