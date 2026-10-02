import { formatINR } from "@/lib/format";

type Item = { id: number; productCode: string; barcode: string | null; productName: string; unit: string; qty: number; rate: string; amount: string };

export default function OrderItemsTable({ items, total }: { items: Item[]; total: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
          <tr>
            <th className="py-2 pr-3">Item</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="py-2 pl-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((i) => (
            <tr key={i.id}>
              <td className="py-2 pr-3">
                <div className="font-medium text-gray-900">{i.productName}</div>
                <div className="text-xs text-gray-500">{i.barcode && <span className="font-mono">{i.barcode} · </span>}#{i.productCode} · {i.unit}</div>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{i.qty}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatINR(i.rate)}</td>
              <td className="py-2 pl-3 text-right tabular-nums">{formatINR(i.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200">
            <td colSpan={3} className="py-3 pr-3 text-right font-semibold">Total</td>
            <td className="py-3 pl-3 text-right font-heading text-lg font-semibold text-brand-dark tabular-nums">{formatINR(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
