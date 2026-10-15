import { formatINR } from "@/lib/format";
import { PACKING_CHARGE_LABEL, PACKING_CHARGE_RATE } from "@/lib/pricing";

type Item = {
  id: number;
  productCode: string;
  barcode: string | null;
  productName: string;
  unit: string;
  qty: number;
  rate: string;
  amount: string;
  packed?: boolean;
  packedQty?: number | null;
};

/**
 * Order lines. With `showPacked`, short items (packed qty < ordered qty) are highlighted in amber
 * with "ordered vs packed" and a packed total is shown.
 */
export default function OrderItemsTable({
  items,
  total,
  packingCharge = "0",
  showPacked = false,
}: {
  items: Item[];
  /** Order total incl. packing charge. */
  total: string;
  packingCharge?: string;
  showPacked?: boolean;
}) {
  const charge = Number(packingCharge);
  const packedQty = (i: Item) => (i.packedQty ?? (i.packed ? i.qty : null));
  const anyPacked = showPacked && items.some((i) => packedQty(i) !== null);
  const packedItems = items.reduce((s, i) => s + Number(i.rate) * (packedQty(i) ?? 0), 0);
  // Wholesale orders carry the 1% packing charge on whatever was actually packed.
  const packedTotal = charge > 0 ? packedItems + Math.round(packedItems * PACKING_CHARGE_RATE * 1000) / 1000 : packedItems;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2 pr-3">Item</th>
            <th className="px-3 py-2 text-right">Qty</th>
            {anyPacked && <th className="px-3 py-2 text-right">Packed</th>}
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="py-2 pl-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((i) => {
            const pq = packedQty(i);
            const short = anyPacked && pq !== null && pq < i.qty;
            return (
              <tr key={i.id} className={short ? "bg-amber-50" : ""}>
                <td className="py-2 pr-3">
                  <div className="font-medium text-gray-900">{i.productName}</div>
                  <div className="text-xs text-gray-500">{i.barcode && <span className="font-mono">{i.barcode} · </span>}#{i.productCode} · {i.unit}</div>
                  {short && <div className="mt-0.5 text-xs font-semibold text-amber-700">Short: ordered {i.qty}, packed {pq}</div>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{i.qty}</td>
                {anyPacked && (
                  <td className={`px-3 py-2 text-right tabular-nums ${short ? "font-semibold text-amber-700" : ""}`}>{pq ?? "—"}</td>
                )}
                <td className="px-3 py-2 text-right tabular-nums">{formatINR(i.rate)}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{formatINR(i.amount)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {charge > 0 && (
            <>
              <tr className="border-t border-gray-200 text-gray-600">
                <td colSpan={anyPacked ? 4 : 3} className="pt-3 pr-3 text-right">Items</td>
                <td className="pt-3 pl-3 text-right tabular-nums">{formatINR(Number(total) - charge)}</td>
              </tr>
              <tr className="text-gray-600">
                <td colSpan={anyPacked ? 4 : 3} className="pr-3 text-right">{PACKING_CHARGE_LABEL}</td>
                <td className="pl-3 text-right tabular-nums">{formatINR(charge)}</td>
              </tr>
            </>
          )}
          <tr className={charge > 0 ? "" : "border-t border-gray-200"}>
            <td colSpan={anyPacked ? 4 : 3} className="py-3 pr-3 text-right font-semibold">Total</td>
            <td className="py-3 pl-3 text-right font-heading text-lg font-semibold text-brand-dark tabular-nums">{formatINR(total)}</td>
          </tr>
          {anyPacked && (
            <tr>
              <td colSpan={4} className="pb-3 pr-3 text-right text-sm text-gray-600">Packed total</td>
              <td className="pb-3 pl-3 text-right font-semibold tabular-nums text-gray-800">{formatINR(packedTotal)}</td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}
