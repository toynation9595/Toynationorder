import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db, orders, orderItems } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, orderLabel } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import PackingChecklist, { type PackItem } from "./PackingChecklist";

export const dynamic = "force-dynamic";

export default async function StaffOrderPage({ params }: PageProps<"/staff/orders/[id]">) {
  const me = await requireStaff();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  // Customer mobile is never selected for staff.
  const [o] = await db
    .select({
      id: orders.id,
      orderNo: orders.orderNo,
      status: orders.status,
      customerName: orders.customerName,
      shopName: orders.shopName,
      city: orders.city,
      total: orders.total,
      createdAt: orders.createdAt,
      packedBy: orders.packedBy,
      packedAt: orders.packedAt,
      packer: sql<string | null>`(select u.name from users u where u.id = "orders"."packed_by")`,
    })
    .from(orders)
    .where(eq(orders.id, orderId));
  if (!o) notFound();

  const items: PackItem[] = await db
    .select({
      id: orderItems.id,
      productName: orderItems.productName,
      barcode: orderItems.barcode,
      productCode: orderItems.productCode,
      unit: orderItems.unit,
      qty: orderItems.qty,
      rate: orderItems.rate,
      packed: orderItems.packed,
      packedQty: orderItems.packedQty,
      image: sql<string | null>`(
        select pi.public_id from product_images pi
        where pi.barcode = "order_items"."barcode"
        order by pi.is_primary desc, pi.sort_order asc limit 1
      )`,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.id));

  return (
    <div>
      <Link href="/staff/orders" className="text-sm text-gray-500 hover:text-brand">← Orders</Link>
      <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-semibold text-brand-dark">{orderLabel(o.orderNo)}</h1>
        <StatusBadge status={o.status} />
      </div>
      <div className="card mb-4 p-4 text-sm">
        <div className="font-medium text-gray-900">{o.customerName}</div>
        {o.shopName && <div className="text-gray-600">{o.shopName}</div>}
        {o.city && <div className="text-gray-500">{o.city}</div>}
        <div className="mt-1 text-xs text-gray-400">Ordered {formatDateTime(o.createdAt)}</div>
        {o.packer && (
          <div className="mt-1 text-xs text-gray-500">
            {o.status === "packing" ? "Being packed by" : "Packed by"} <b>{o.packer}</b>
            {o.packedAt && <> · {formatDateTime(o.packedAt)}</>}
          </div>
        )}
      </div>

      <PackingChecklist
        key={`${o.status}-${o.packedBy ?? 0}`} /* remount with fresh server state when the order changes stage */
        orderId={o.id}
        status={o.status}
        total={o.total}
        packer={o.packer}
        isMine={o.packedBy === me.id}
        items={items}
      />
    </div>
  );
}
