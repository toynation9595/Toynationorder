import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, orders, orderItems } from "@/lib/db";
import { requireRetailer } from "@/lib/auth";
import { formatDate, formatINR, orderLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const metadata = { title: "My orders – Toy Nation" };

export default async function MyOrdersPage() {
  const user = await requireRetailer();
  const list = await db
    .select({
      orderNo: orders.orderNo,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      items: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
    })
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-5 text-3xl font-semibold text-brand-dark">My orders</h1>
      {list.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-600">You have not placed any orders yet.</p>
          <Link href="/products" className="btn-primary mt-4">Browse products</Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {list.map((o) => (
            <Link key={o.orderNo} href={`/my-orders/${o.orderNo}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:bg-brand-light/40">
              <div className="min-w-0 flex-1">
                <div className="font-heading text-lg font-semibold text-brand">{orderLabel(o.orderNo)}</div>
                <div className="text-xs text-gray-500">
                  {formatDate(o.createdAt)} · {o.items} item{o.items === 1 ? "" : "s"}
                </div>
              </div>
              <div className="font-semibold tabular-nums">{formatINR(o.total)}</div>
              <StatusBadge status={o.status} forRetailer />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
