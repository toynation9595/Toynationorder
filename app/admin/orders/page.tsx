import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, orders, orderItems, ORDER_STATUSES } from "@/lib/db";
import { formatDateTime, formatINR, orderLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const metadata = { title: "Orders – Toy Nation Admin" };

const PAGE_SIZE = 50;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = typeof sp.status === "string" && (ORDER_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const conds: SQL[] = [];
  if (status) conds.push(eq(orders.status, status as (typeof ORDER_STATUSES)[number]));
  if (q) {
    const digits = q.replace(/^TN-?/i, "").replace(/\D/g, "");
    const or_: SQL[] = [ilike(orders.shopName, `%${q}%`), ilike(orders.customerName, `%${q}%`)];
    if (digits) {
      or_.push(sql`${orders.orderNo}::text = ${digits}`);
      or_.push(ilike(orders.mobile, `%${digits}%`));
    }
    conds.push(or(...or_)!);
  }
  const where = conds.length ? and(...conds) : undefined;

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(orders).where(where),
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        customerName: orders.customerName,
        shopName: orders.shopName,
        mobile: orders.mobile,
        city: orders.city,
        priceType: orders.priceType,
        status: orders.status,
        total: orders.total,
        createdAt: orders.createdAt,
        packedAt: orders.packedAt,
        packedBy: sql<string | null>`(select u.name from users u where u.id = "orders"."packed_by")`,
        items: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
      })
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (o: { status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const s = o.status ?? status;
    if (q) p.set("q", q);
    if (s) p.set("status", s);
    if (o.page && o.page > 1) p.set("page", String(o.page));
    const str = p.toString();
    return `/admin/orders${str ? `?${str}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-dark">Orders</h1>
        <form className="flex w-full gap-2 sm:w-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Order no, mobile or shop" className="input sm:w-72" />
          <button className="btn-primary">Search</button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {["", ...ORDER_STATUSES].map((s) => (
          <Link
            key={s || "all"}
            href={href({ status: s, page: 1 })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              status === s ? "bg-brand text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-brand-light"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
        <span className="ml-auto self-center text-sm text-gray-500">{total} orders</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Packed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No orders found.</td></tr>
            )}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-brand-light/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-heading font-semibold text-brand hover:underline">
                    {orderLabel(o.orderNo)}
                  </Link>
                  <div className="text-xs capitalize text-gray-500">{o.priceType}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{o.shopName || o.customerName}</div>
                  <div className="text-xs text-gray-500">{o.customerName} · +91 {o.mobile} · {o.city}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{o.items}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatINR(o.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {o.packedBy ? (
                    <>
                      <div className="font-medium text-gray-800">{o.packedBy}</div>
                      <div>{o.packedAt ? formatDateTime(o.packedAt) : "in progress"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={href({ page: page - 1 })} className="btn-outline">← Prev</Link>}
          <span className="text-gray-500">Page {page} of {pages}</span>
          {page < pages && <Link href={href({ page: page + 1 })} className="btn-outline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
