import "server-only";
import { createHash } from "crypto";

export const CLOUDINARY_FOLDER = "toynation/products";

/** Cloudinary API signature: sha1 of sorted "k=v" pairs joined by & + secret. */
export function signParams(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + process.env.CLOUDINARY_API_SECRET).digest("hex");
}

export async function destroyImage(publicId: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ public_id: publicId, timestamp });
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: process.env.CLOUDINARY_API_KEY!,
    signature,
  });
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`,
    { method: "POST", body }
  );
  if (!res.ok) throw new Error(`Cloudinary delete failed (${res.status})`);
}
