"use client";

import { useActionState } from "react";
import { OWNER_TRANSITIONS, STATUS_LABELS, type OrderStatus } from "@/lib/order-statuses";
import { updateOrder, type UpdateOrderState } from "../actions";

export default function OrderStatusForm({ id, status, notes }: { id: number; status: OrderStatus; notes: string }) {
  const [state, action, pending] = useActionState<UpdateOrderState, FormData>(updateOrder, {});
  const options = [status, ...OWNER_TRANSITIONS[status]];
  return (
    <form action={action} className="card space-y-3 p-5">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="label">Status</label>
        <select id="status" name="status" defaultValue={status} disabled={options.length === 1} className="input">
          {options.map((s) => (
            <option key={s} value={s}>
              {s === status ? `${STATUS_LABELS[s]} (current)` : s === "cancelled" ? "Cancel order" : `Mark ${STATUS_LABELS[s].toLowerCase()}`}
            </option>
          ))}
        </select>
        {options.length === 1 && <input type="hidden" name="status" value={status} />}
        {status === "new" && <p className="mt-1 text-xs text-gray-500">Employees start packing from the Packing screen.</p>}
        {status === "packed" && <p className="mt-1 text-xs text-gray-500">Mark dispatched after billing it in the ERP.</p>}
      </div>
      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea id="notes" name="notes" rows={4} defaultValue={notes} className="input" placeholder="Internal notes" />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-tn-teal/10 px-3 py-2 text-sm text-tn-teal">{state.released ? "Saved." : state.ok}</p>}
      {state.released && (
        <p className="rounded-lg bg-tn-yellow/20 px-3 py-2 text-sm font-semibold text-[#6b5200]">
          Stock released — these items are available to order again.
        </p>
      )}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
