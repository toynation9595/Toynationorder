const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Cloudinary delivery URL. Cards use w=400, detail w=1200. */
export function cldUrl(publicId: string, width: 400 | 1200 | 120 = 400): string {
  return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}
