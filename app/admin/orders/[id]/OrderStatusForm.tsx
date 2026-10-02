"use client";

import { useActionState } from "react";
import { ORDER_STATUSES } from "@/lib/order-statuses";
import { updateOrder, type UpdateOrderState } from "../actions";

export default function OrderStatusForm({ id, status, notes }: { id: number; status: string; notes: string }) {
  const [state, action, pending] = useActionState<UpdateOrderState, FormData>(updateOrder, {});
  return (
    <form action={action} className="card space-y-3 p-5">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="status" className="label">Status</label>
        <select id="status" name="status" defaultValue={status} className="input capitalize">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className="label">Notes</label>
        <textarea id="notes" name="notes" rows={4} defaultValue={notes} className="input" placeholder="Internal notes" />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="rounded-lg bg-tn-teal/10 px-3 py-2 text-sm text-tn-teal">{state.ok}</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Save"}</button>
    </form>
  );
}
