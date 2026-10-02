"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import type { ErpRow, ImportSummary } from "@/lib/erp-import";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function iso(y: number, m: number, d: number): string | null {
  if (!y || !m || !d || m > 12 || d > 31) return null;
  if (y < 100) y += 2000;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Rec.Date: "06-Sep-26", dd-mm-yyyy, or an Excel date serial. */
function parseDate(v: unknown): string | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const p = XLSX.SSF.parse_date_code(v);
    return p ? iso(p.y, p.m, p.d) : null;
  }
  if (v instanceof Date) return iso(v.getFullYear(), v.getMonth() + 1, v.getDate());
  const s = String(v).trim();
  let m = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[A-Za-z]*[-/ ](\d{2,4})$/);
  if (m) return iso(Number(m[3]), MONTHS[m[2].toLowerCase()] ?? 0, Number(m[1]));
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) return iso(Number(m[3]), Number(m[2]), Number(m[1]));
  return null;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

async function readFile(file: File): Promise<ErpRow[]> {
  const wb = XLSX.read(await file.arrayBuffer());
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"]) return [];
  const ref = XLSX.utils.decode_range(ws["!ref"]);
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: true,
    range: { s: { r: 0, c: 0 }, e: ref.e },
  });
  return raw.slice(4).map((r) => ({
    code: str(r[0]),
    name: str(r[1]),
    unit: str(r[2]),
    stock: num(r[3]),
    price: num(r[12]),
    recDate: parseDate(r[15]),
  }));
}

export default function ImportForm() {
  const [rows, setRows] = useState<ErpRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setSummary(null);
    setError("");
    setRows(null);
    if (!f) return;
    setFileName(f.name);
    try {
      const r = await readFile(f);
      setRows(r);
      if (r.length === 0) setError("No data rows found after the 4 header rows.");
    } catch {
      setError("Could not read this file. Please upload the .xlsx stock report from the ERP.");
    }
  }

  async function onImport() {
    if (!rows?.length) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSummary(data);
      setRows(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  const preview = rows?.filter((r) => r.code && r.price > 0).slice(0, 8) ?? [];

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <label className="label" htmlFor="file">ERP stock report (.xlsx)</label>
        <input
          id="file"
          type="file"
          accept=".xlsx,.xls"
          onChange={onFile}
          className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-4 file:py-2 file:font-semibold file:text-brand hover:file:bg-brand/15"
        />
        <p className="mt-2 text-xs text-gray-500">
          First 4 rows are skipped. Reads Code, Product Name, Unit, Current Stock, Sales Price and Rec.Date only.
        </p>

        {rows && rows.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{fileName}</span> — {rows.length} data rows read.
            </p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2 text-right">Stock</th>
                    <th className="px-3 py-2 text-right">Sales Price</th>
                    <th className="px-3 py-2">Rec.Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 font-mono">{r.code}</td>
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5">{r.unit}</td>
                      <td className="px-3 py-1.5 text-right">{r.stock}</td>
                      <td className="px-3 py-1.5 text-right">{r.price}</td>
                      <td className="px-3 py-1.5">{r.recDate ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-500">Preview of first valid rows (before grouping batches).</p>
            <button onClick={onImport} disabled={busy} className="btn-primary mt-4">
              {busy ? "Importing…" : "Import stock"}
            </button>
          </div>
        )}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>

      {summary && (
        <div className="card p-5">
          <h2 className="text-lg font-semibold text-brand-dark">Import complete</h2>
          <p className="text-sm text-gray-500">{summary.products} products in file</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="New" value={summary.created} color="bg-tn-teal/10 text-tn-teal" />
            <Stat label="Updated" value={summary.updated} color="bg-brand-light text-brand" />
            <Stat label="Marked out of stock" value={summary.markedOutOfStock} color="bg-tn-orange/10 text-tn-orange" />
            <Stat label="Skipped rows" value={summary.skipped} color="bg-gray-100 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="font-heading text-2xl font-semibold">{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}
