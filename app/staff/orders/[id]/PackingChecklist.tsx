/* eslint-disable @next/next/no-img-element */
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatINR } from "@/lib/format";
import { cldUrl } from "@/lib/images";
import { finishPacking, setItemDone, setItemShort, startPacking } from "../actions";

export type PackItem = {
  id: number;
  productName: string;
  barcode: string | null;
  productCode: string;
  unit: string;
  qty: number;
  rate: string;
  packed: boolean;
  packedQty: number | null;
  image: string | null;
};

type Row = { packed: boolean; packedQty: number | null };

type Props = {
  orderId: number;
  status: string;
  total: string;
  packer: string | null;
  isMine: boolean;
  items: PackItem[];
};

export default function PackingChecklist({ orderId, status, total, packer, isMine, items }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<number, Row>>(() =>
    Object.fromEntries(items.map((i) => [i.id, { packed: i.packed, packedQty: i.packedQty }]))
  );
  const [shortFor, setShortFor] = useState<number | null>(null);
  const [shortQty, setShortQty] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();

  const editable = status === "packing" && isMine;
  const done = items.filter((i) => rows[i.id]?.packed).length;
  const allDone = done === items.length && items.length > 0;
  const qtyPacked = (i: PackItem) => {
    const r = rows[i.id];
    if (!r?.packed) return status === "packed" || status === "dispatched" ? (r?.packedQty ?? 0) : 0;
    return r.packedQty ?? i.qty;
  };
  const packedTotal = items.reduce((s, i) => s + Number(i.rate) * qtyPacked(i), 0);

  /** Optimistic update; revert and show the error if the server refuses. */
  function save(id: number, next: Row, call: () => Promise<{ error?: string }>) {
    const prev = rows[id];
    setRows((r) => ({ ...r, [id]: next }));
    setError("");
    start(async () => {
      const res = await call();
      if (res.error) {
        setRows((r) => ({ ...r, [id]: prev }));
        setError(res.error);
        router.refresh();
      }
    });
  }

  function onStart() {
    setError("");
    start(async () => {
      const res = await startPacking(orderId);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  function onFinish() {
    setError("");
    start(async () => {
      const res = await finishPacking(orderId);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="pb-28">
      {status === "new" && (
        <button onClick={onStart} disabled={busy} className="btn-primary mb-4 h-14 w-full text-lg">
          {busy ? "Starting…" : "Start packing"}
        </button>
      )}
      {status === "packing" && !isMine && (
        <div className="mb-4 rounded-2xl bg-tn-yellow/20 p-4 text-center font-semibold text-[#6b5200]">
          Being packed by {packer ?? "someone else"}
        </div>
      )}
      {error && <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {(status === "packing" || status === "packed" || status === "dispatched") && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-sm font-semibold text-gray-700">
            <span>{done} of {items.length} done</span>
            <span className="tabular-nums">{Math.round((done / Math.max(1, items.length)) * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-tn-teal transition-all" style={{ width: `${(done / Math.max(1, items.length)) * 100}%` }} />
          </div>
        </div>
      )}

      <ul className="space-y-3">
        {items.map((i) => {
          const r = rows[i.id];
          const short = r?.packed && r.packedQty !== null && r.packedQty < i.qty;
          return (
            <li
              key={i.id}
              className={`card overflow-hidden p-3 ${r?.packed ? (short ? "ring-2 ring-amber-300" : "ring-2 ring-tn-teal/50") : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
                  {i.image ? (
                    <img src={cldUrl(i.image, 120)} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">🧸</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-medium leading-snug text-gray-900">{i.productName}</div>
                  <div className="font-mono text-xs text-gray-500">{i.barcode ?? `#${i.productCode}`}</div>
                  <div className="text-xs text-gray-500">{formatINR(i.rate)} · {i.unit}</div>
                </div>
                <div className="shrink-0 text-center">
                  <div className="font-heading text-3xl font-semibold leading-none text-brand-dark">{i.qty}</div>
                  <div className="text-[11px] text-gray-500">qty</div>
                </div>
                {editable && (
                  <button
                    onClick={() => save(i.id, { packed: !r?.packed, packedQty: null }, () => setItemDone(i.id, !r?.packed))}
                    aria-label={r?.packed ? "Untick" : "Tick as packed"}
                    aria-pressed={!!r?.packed}
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 text-3xl font-bold transition ${
                      r?.packed ? (short ? "border-amber-400 bg-amber-400 text-white" : "border-tn-teal bg-tn-teal text-white") : "border-gray-300 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                )}
              </div>

              {short && (
                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  Short: packed {r.packedQty} of {i.qty}
                </div>
              )}
              {!editable && (status === "packed" || status === "dispatched") && !short && (
                <div className="mt-2 text-xs font-medium text-tn-teal">Packed {qtyPacked(i)} of {i.qty}</div>
              )}

              {editable && (
                shortFor === i.id ? (
                  <form
                    className="mt-3 flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = Number(shortQty);
                      if (!Number.isInteger(n) || n < 0 || n > i.qty) {
                        setError(`Enter a number from 0 to ${i.qty}.`);
                        return;
                      }
                      setShortFor(null);
                      save(i.id, { packed: true, packedQty: n === i.qty ? null : n }, () => setItemShort(i.id, n));
                    }}
                  >
                    <label className="text-sm text-gray-700" htmlFor={`short-${i.id}`}>Packed qty</label>
                    <input
                      id={`short-${i.id}`}
                      autoFocus
                      inputMode="numeric"
                      value={shortQty}
                      onChange={(e) => setShortQty(e.target.value.replace(/\D/g, ""))}
                      className="input h-12 w-20 text-center text-lg font-semibold"
                      placeholder={`0–${i.qty}`}
                    />
                    <button className="btn h-12 flex-1 bg-amber-500 text-white hover:bg-amber-600">Save short</button>
                    <button type="button" onClick={() => setShortFor(null)} className="btn h-12 border border-gray-300 bg-white text-gray-600">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => {
                      setShortFor(i.id);
                      setShortQty(r?.packedQty !== null && r?.packedQty !== undefined ? String(r.packedQty) : "");
                    }}
                    className="mt-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
                  >
                    {short ? "Change short qty" : "Short"}
                  </button>
                )
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 card space-y-1 p-4 text-sm">
        <div className="flex justify-between"><span className="text-gray-600">Order total</span><span className="font-semibold tabular-nums">{formatINR(total)}</span></div>
        <div className="flex justify-between"><span className="text-gray-600">Packed total</span><span className="font-semibold tabular-nums text-brand-dark">{formatINR(packedTotal)}</span></div>
      </div>

      {editable && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <button onClick={onFinish} disabled={!allDone || busy} className="btn-primary h-14 w-full text-lg">
              {busy ? "Saving…" : allDone ? "Finish packing" : `Finish packing (${items.length - done} left)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
