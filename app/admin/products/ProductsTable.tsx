/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useTransition } from "react";
import { formatINR } from "@/lib/format";
import { priceFor } from "@/lib/pricing";
import { cldUrl } from "@/lib/images";
import { bulkAssignCategory, toggleVisible } from "./actions";
import ImageManager from "./ImageManager";
import ProductTextEditor from "./ProductTextEditor";

export type AdminImage = { id: number; publicId: string; isPrimary: boolean };
export type AdminProduct = {
  barcode: string;
  code: string;
  /** Shown name: display name, else the auto-cleaned ERP name. */
  name: string;
  erpName: string;
  displayName: string | null;
  autoName: string;
  description: string | null;
  unit: string;
  wholesalePrice: string;
  stockQty: string;
  reserved: number;
  available: number;
  inStock: boolean;
  isVisible: boolean;
  categoryId: number | null;
  images: AdminImage[];
};

type Props = {
  products: AdminProduct[];
  categories: { id: number; name: string }[];
  cloudName: string;
  apiKey: string;
};

export default function ProductsTable({ products, categories, cloudName, apiKey }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assignTo, setAssignTo] = useState("");
  const [openBarcode, setOpenBarcode] = useState<string | null>(null);
  const [editBarcode, setEditBarcode] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const allChecked = products.length > 0 && products.every((p) => selected.has(p.barcode));
  const open = products.find((p) => p.barcode === openBarcode) ?? null;

  function toggle(barcode: string) {
    const s = new Set(selected);
    if (s.has(barcode)) s.delete(barcode);
    else s.add(barcode);
    setSelected(s);
  }

  function assign() {
    if (!selected.size || assignTo === "") return;
    const id = assignTo === "none" ? null : Number(assignTo);
    start(async () => {
      await bulkAssignCategory([...selected], id);
      setSelected(new Set());
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-dark p-3 text-sm text-white shadow-lg">
          <span className="font-semibold">{selected.size} selected</span>
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="rounded-lg px-2 py-1.5 text-gray-900">
            <option value="">Assign category…</option>
            <option value="none">— Remove category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={assign} disabled={pending || assignTo === ""} className="rounded-lg bg-tn-yellow px-3 py-1.5 font-semibold text-gray-900 disabled:opacity-50">
            {pending ? "Saving…" : "Apply"}
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-white/80 hover:text-white">Clear</button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(products.map((p) => p.barcode)))}
                  aria-label="Select all"
                />
              </th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3 text-right">Wholesale</th>
              <th className="px-3 py-3 text-right">Retail (×2)</th>
              <th className="px-3 py-3 text-right">Stock</th>
              <th className="px-3 py-3 text-right">Reserved</th>
              <th className="px-3 py-3 text-right">Available</th>
              <th className="px-3 py-3">Images</th>
              <th className="px-3 py-3">Visible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={10} className="p-8 text-center text-gray-500">No products found.</td></tr>
            )}
            {products.map((p) => {
              const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
              return (
                <tr key={p.barcode} className={selected.has(p.barcode) ? "bg-brand-light/60" : ""}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(p.barcode)} onChange={() => toggle(p.barcode)} aria-label={`Select ${p.name}`} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {primary && <img src={cldUrl(primary.publicId, 120)} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-gray-900">{p.name}</span>
                          <button
                            onClick={() => setEditBarcode(p.barcode)}
                            className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold text-brand hover:bg-brand-light"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="truncate text-[11px] text-gray-400">ERP: {p.erpName}</div>
                        <div className="text-xs text-gray-500"><span className="font-mono">{p.barcode}</span> · #{p.code} · {p.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {p.categoryId ? catName.get(p.categoryId) : <span className="text-tn-orange">Uncategorised</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatINR(p.wholesalePrice)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">{formatINR(priceFor(p.wholesalePrice, "retail"))}</td>
                  <td className={`px-3 py-2 text-right tabular-nums ${p.inStock ? "" : "text-red-600"}`}>
                    {Number(p.stockQty)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">{p.reserved || "—"}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${p.available > 0 ? "text-tn-teal" : "text-red-600"}`}>
                    {p.available}
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => setOpenBarcode(p.barcode)} className="rounded-lg bg-brand-light px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/15">
                      {p.images.length ? `${p.images.length} image${p.images.length > 1 ? "s" : ""}` : "+ Add"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => start(() => toggleVisible(p.barcode))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.isVisible ? "bg-tn-teal/15 text-tn-teal" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isVisible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editBarcode && products.find((p) => p.barcode === editBarcode) && (
        <ProductTextEditor product={products.find((p) => p.barcode === editBarcode)!} onClose={() => setEditBarcode(null)} />
      )}

      {open && (
        <ImageManager product={open} cloudName={cloudName} apiKey={apiKey} onClose={() => setOpenBarcode(null)} />
      )}
    </>
  );
}
