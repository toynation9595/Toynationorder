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
