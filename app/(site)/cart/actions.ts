"use server";

import { getProductsByBarcodes } from "@/lib/catalog";

/** Current server prices for the barcodes in the browser cart. */
export async function getCartProducts(barcodes: string[]) {
  if (!Array.isArray(barcodes)) return [];
  return getProductsByBarcodes(barcodes.filter((b) => typeof b === "string").slice(0, 500));
}
