"use client";

import { useActionState, useTransition } from "react";
import { resetDisplayName, saveProductText, type TextState } from "./actions";
import type { AdminProduct } from "./ProductsTable";

type Props = { product: AdminProduct; onClose: () => void };

/** Edit the customer-facing name and description. The ERP name is read-only (it comes from the import). */
export default function ProductTextEditor({ product, onClose }: Props) {
  const [state, action, pending] = useActionState<TextState, FormData>(saveProductText, {});
  const [resetting, startReset] = useTransition();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <form
        action={action}
        key={product.displayName ?? ""}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-t-3xl bg-white p-5 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark">Edit product text</h2>
            <p className="font-mono text-xs text-gray-500">{product.barcode} · #{product.code}</p>
          </div>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label="Close">
            ×
          </button>
        </div>

        <input type="hidden" name="barcode" value={product.barcode} />

        <div>
          <label htmlFor="displayName" className="label">Display name</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={product.displayName ?? ""}
            placeholder={product.autoName}
            maxLength={200}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-500">Leave empty to use the auto name: “{product.autoName}”.</p>
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description ?? ""}
            maxLength={4000}
            placeholder="Shown on the product page"
            className="input"
          />
        </div>

        <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-500">
          ERP name (from import, read-only): <span className="font-medium text-gray-700">{product.erpName}</span>
        </div>

        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state.ok && <p className="rounded-lg bg-tn-teal/10 px-3 py-2 text-sm text-tn-teal">{state.ok}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={resetting || !product.displayName}
            onClick={() => startReset(() => resetDisplayName(product.barcode))}
            className="btn-outline"
          >
            {resetting ? "Resetting…" : "Reset to auto"}
          </button>
          <button disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
