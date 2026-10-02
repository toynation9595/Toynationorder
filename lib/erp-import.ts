/** Raw row extracted in the browser from the ERP stock report (columns by position). */
export type ErpRow = {
  code: string; // col 0
  name: string; // col 1
  unit: string; // col 2
  stock: number; // col 3
  price: number; // col 12
  recDate: string | null; // col 15, ISO yyyy-mm-dd
  barcode: string; // col 23 — the product key
};

export type ImportSummary = {
  products: number;
  created: number;
  updated: number;
  markedOutOfStock: number;
  skipped: number;
};

export type GroupedProduct = {
  barcode: string;
  code: string;
  name: string;
  unit: string;
  retailPrice: number;
  stockQty: number;
  lastReceived: string | null;
};

/**
 * Group batch rows by Barcode. stock = SUM of all batches; code/name/unit/price/date
 * come from the row with the latest Rec.Date (tie → last row).
 */
export function groupErpRows(rows: ErpRow[]): { products: GroupedProduct[]; skipped: number } {
  let skipped = 0;
  const map = new Map<string, { latest: ErpRow; stock: number }>();
  for (const r of rows) {
    const barcode = r.barcode.trim();
    if (!barcode || !r.code.trim() || !(r.price > 0)) {
      skipped++;
      continue;
    }
    const stock = Number.isFinite(r.stock) ? r.stock : 0;
    const g = map.get(barcode);
    if (!g) {
      map.set(barcode, { latest: r, stock });
      continue;
    }
    g.stock += stock;
    // Latest date wins; equal date (incl. both empty) → later row wins.
    if ((r.recDate ?? "") >= (g.latest.recDate ?? "")) g.latest = r;
  }
  const products: GroupedProduct[] = [];
  for (const [barcode, g] of map) {
    products.push({
      barcode,
      code: g.latest.code.trim(),
      name: g.latest.name.trim() || barcode,
      unit: g.latest.unit.trim(),
      retailPrice: g.latest.price,
      stockQty: Math.round(g.stock * 1000) / 1000,
      lastReceived: g.latest.recDate,
    });
  }
  return { products, skipped };
}
