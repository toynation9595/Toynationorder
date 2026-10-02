import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUSES } from "@/lib/db";
import { getOrderById, waLink } from "@/lib/orders";
import { formatDateTime, orderLabel } from "@/lib/format";
import OrderItemsTable from "@/components/OrderItemsTable";
import StatusBadge from "@/components/StatusBadge";
import { updateOrder } from "../actions";

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const data = await getOrderById(Number(id));
  if (!data) notFound();
  const { order: o, items } = data;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/orders" className="text-sm text-gray-500 hover:text-brand">← All orders</Link>
      <div className="mt-2 mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold text-brand-dark">{orderLabel(o.orderNo)}</h1>
        <StatusBadge status={o.status} />
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-gray-600">{o.priceType}</span>
        <span className="ml-auto text-sm text-gray-500">{formatDateTime(o.createdAt)}</span>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_300px]">
        <div className="card p-5">
          <OrderItemsTable items={items} total={o.total} />
        </div>

        <div className="space-y-5">
          <div className="card p-5 text-sm">
            <h2 className="mb-2 text-base font-semibold text-brand-dark">Customer</h2>
            <div className="font-medium text-gray-900">{o.customerName}</div>
            <div className="text-gray-600">{o.shopName}</div>
            <div className="text-gray-600">{o.city}</div>
            <div className="mt-1 text-gray-600">+91 {o.mobile}</div>
            {!o.userId && <div className="mt-1 text-xs text-gray-400">Guest order</div>}
            <div className="mt-3 flex gap-2">
              <a href={`tel:+91${o.mobile}`} className="btn-outline flex-1 py-2">Call</a>
              <a
                href={waLink(o.mobile, `Hello ${o.customerName}, regarding your Toy Nation order ${orderLabel(o.orderNo)}:`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn flex-1 bg-[#25D366] py-2 text-white hover:bg-[#1ebe5b]"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <form action={updateOrder} className="card space-y-3 p-5">
            <input type="hidden" name="id" value={o.id} />
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select id="status" name="status" defaultValue={o.status} className="input capitalize">
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="label">Notes</label>
              <textarea id="notes" name="notes" rows={4} defaultValue={o.notes ?? ""} className="input" placeholder="Internal notes" />
            </div>
            <button className="btn-primary w-full">Save</button>
          </form>
        </div>
      </div>
    </div>
  );
}
