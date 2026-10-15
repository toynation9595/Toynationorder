const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/**
 * Cloudinary delivery URL (f_auto,q_auto). Cards use w=400, detail w=1200.
 * `still` adds pg_1 so an animated GIF shows only its first frame (cards, cart, category tiles,
 * packing rows). The product page leaves it off, so GIFs animate (Cloudinary serves animated WebP).
 */
export function cldUrl(publicId: string, width: 400 | 1200 | 120 = 400, still = false): string {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${width}${still ? ",pg_1" : ""}/${publicId}`;
}

/** Formats the upload widget accepts. */
export const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp", "gif"] as const;
