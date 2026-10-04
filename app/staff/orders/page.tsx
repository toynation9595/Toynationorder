import Link from "next/link";
import { asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db, orders, orderItems } from "@/lib/db";
import { formatDateTime, formatINR, orderLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Packing – Toy Nation" };

const TABS = [
  { key: "topack", label: "To pack" },
  { key: "packing", label: "Packing" },
  { key: "packed", label: "Packed" },
  { key: "all", label: "All" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default async function StaffOrdersPage({ searchParams }: PageProps<"/staff/orders">) {
  const sp = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "topack";

  const where: SQL | undefined =
    tab === "topack" ? eq(orders.status, "new") : tab === "packing" ? eq(orders.status, "packing") : tab === "packed" ? eq(orders.status, "packed") : undefined;
  const orderBy =
    tab === "topack" ? [asc(orders.createdAt)] : tab === "packing" ? [asc(orders.packingStartedAt)] : tab === "packed" ? [desc(orders.packedAt)] : [desc(orders.createdAt)];

  // Never select the customer's mobile for staff screens.
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: orders.id,
        orderNo: orders.orderNo,
        createdAt: orders.createdAt,
        customerName: orders.customerName,
        shopName: orders.shopName,
        city: orders.city,
        status: orders.status,
        total: orders.total,
        packer: sql<string | null>`(select u.name from users u where u.id = "orders"."packed_by")`,
        items: sql<number>`(select count(*)::int from ${orderItems} where ${orderItems.orderId} = ${orders.id})`,
      })
      .from(orders)
      .where(where)
      .orderBy(...orderBy)
      .limit(100),
    db
      .select({ status: orders.status, n: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.status} in ('new', 'packing', 'packed')`)
      .groupBy(orders.status),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?.n ?? 0;
  const badge: Partial<Record<Tab, number>> = { topack: count("new"), packing: count("packing"), packed: count("packed") };

  return (
    <div>
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/staff/orders?tab=${t.key}`}
            className={`flex flex-col items-center rounded-xl px-1 py-2 text-center text-sm font-semibold ${
              tab === t.key ? "bg-brand text-white" : "text-gray-600 hover:bg-brand-light"
            }`}
          >
            {t.label}
            {badge[t.key] !== undefined && <span className={`text-xs ${tab === t.key ? "text-white/80" : "text-gray-400"}`}>{badge[t.key]}</span>}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          {tab === "topack" ? "Nothing to pack right now." : "No orders here."}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/staff/orders/${o.id}`} className="card block p-4 active:bg-brand-light/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-heading text-xl font-semibold text-brand">{orderLabel(o.orderNo)}</div>
                    <div className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-2 text-sm text-gray-800">
                  <span className="font-medium">{o.customerName}</span>
                  {o.shopName && <span className="text-gray-600"> · {o.shopName}</span>}
                  {o.city && <span className="text-gray-500"> · {o.city}</span>}
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {o.items} item{o.items === 1 ? "" : "s"}
                    {o.packer && o.status !== "new" && <span className="text-gray-500"> · {o.packer}</span>}
                  </span>
                  <span className="font-semibold tabular-nums">{formatINR(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
