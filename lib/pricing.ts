/** ERP Sales Price is the WHOLESALE rate; retail is wholesale × RETAIL_MULTIPLIER. */
export const RETAIL_MULTIPLIER = 2;

export type PriceType = "retail" | "wholesale";

/**
 * Price for a viewer, decided on the server from the session.
 * Active retailer → wholesale_price; guest (and owner) → wholesale_price × 2. No rounding.
 * wholesalePrice is the DB numeric string.
 */
export function priceFor(wholesalePrice: string | number, priceType: PriceType): number {
  const w = Number(wholesalePrice);
  return priceType === "wholesale" ? w : w * RETAIL_MULTIPLIER;
}

/** Fixed packing charge on WHOLESALE (retailer) orders only: 1% of the items subtotal, no rounding. */
export const PACKING_CHARGE_RATE = 0.01;
export const PACKING_CHARGE_LABEL = "Packing charges (1%)";

export function packingChargeFor(subtotal: number, priceType: PriceType): number {
  return priceType === "wholesale" ? Math.round(subtotal * PACKING_CHARGE_RATE * 1000) / 1000 : 0;
}
