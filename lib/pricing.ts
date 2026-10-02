export const WHOLESALE_DISCOUNT = 0.5;

export type PriceType = "retail" | "wholesale";

/** Price for a viewer. retailPrice is the DB numeric string. No rounding. */
export function priceFor(retailPrice: string | number, priceType: PriceType): number {
  const r = Number(retailPrice);
  return priceType === "wholesale" ? r * WHOLESALE_DISCOUNT : r;
}
