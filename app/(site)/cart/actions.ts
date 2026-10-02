"use server";

import { getProductsByCodes } from "@/lib/catalog";

/** Current server prices for the codes in the browser cart. */
export async function getCartProducts(codes: string[]) {
  if (!Array.isArray(codes)) return [];
  return getProductsByCodes(codes.filter((c) => typeof c === "string").slice(0, 500));
}
