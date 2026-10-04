import { RETAILER_STATUS_LABELS, STATUS_LABELS, type OrderStatus } from "@/lib/order-statuses";

const STYLES: Record<string, string> = {
  new: "bg-tn-orange/15 text-tn-orange",
  packing: "bg-brand-light text-brand",
  packed: "bg-tn-yellow/20 text-[#8a6d00]",
  dispatched: "bg-tn-teal/15 text-tn-teal",
  cancelled: "bg-gray-100 text-gray-500",
};

/** `forRetailer` uses the customer-facing wording ("Being packed"). */
export default function StatusBadge({ status, forRetailer = false }: { status: string; forRetailer?: boolean }) {
  const labels = forRetailer ? RETAILER_STATUS_LABELS : STATUS_LABELS;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[status] ?? STYLES.new}`}>
      {labels[status as OrderStatus] ?? status}
    </span>
  );
}
