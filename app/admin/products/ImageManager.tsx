/* eslint-disable @next/next/no-img-element */
"use client";

import Script from "next/script";
import { useRef, useState, useTransition } from "react";
import { cldUrl } from "@/lib/images";
import { addImage, deleteImage, setPrimaryImage } from "./actions";
import type { AdminProduct } from "./ProductsTable";

const FOLDER = "toynation/products";

type UploadResult = { event: string; info: { public_id: string } };
type Widget = { open: () => void; destroy: () => void };
declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        opts: Record<string, unknown>,
        cb: (err: unknown, result: UploadResult) => void
      ) => Widget;
    };
  }
}

type Props = { product: AdminProduct; cloudName: string; apiKey: string; onClose: () => void };

export default function ImageManager({ product, cloudName, apiKey, onClose }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.cloudinary);

  function openWidget() {
    if (!window.cloudinary) return;
    setError("");
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey,
        folder: FOLDER,
        multiple: true,
        resourceType: "image",
        sources: ["local", "camera", "url"],
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
        maxFileSize: 15_000_000,
        uploadSignature: async (cb: (sig: string) => void, paramsToSign: Record<string, unknown>) => {
          const res = await fetch("/api/admin/cloudinary-sign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paramsToSign }),
          });
          const data = await res.json();
          if (res.ok) cb(data.signature);
          else setError(data.error || "Upload not allowed");
        },
      },
      (err, result) => {
        if (err) {
          setError("Upload failed. Please try again.");
          return;
        }
        if (result?.event === "success") {
          const id = result.info.public_id;
          queue.current = queue.current.then(() => addImage(product.code, id)).catch(() => setError("Could not save an image."));
        }
      }
    );
    widget.open();
  }

  function remove(id: number) {
    if (!confirm("Delete this image? It will also be removed from Cloudinary.")) return;
    start(async () => {
      const r = await deleteImage(id);
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <Script
        src="https://upload-widget.cloudinary.com/latest/global/all.js"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div className="w-full max-w-2xl rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-dark">{product.name}</h2>
            <p className="text-xs text-gray-500">#{product.code}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label="Close">×</button>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {product.images.map((img) => (
            <div key={img.id} className={`overflow-hidden rounded-xl ring-2 ${img.isPrimary ? "ring-brand" : "ring-gray-100"}`}>
              <div className="aspect-square bg-gray-100">
                <img src={cldUrl(img.publicId, 400)} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="flex text-xs">
                {img.isPrimary ? (
                  <span className="flex-1 bg-brand py-1.5 text-center font-semibold text-white">Primary</span>
                ) : (
                  <button disabled={pending} onClick={() => start(() => setPrimaryImage(img.id))} className="flex-1 py-1.5 font-medium text-brand hover:bg-brand-light">
                    Set primary
                  </button>
                )}
                <button disabled={pending} onClick={() => remove(img.id)} className="px-2 py-1.5 text-red-600 hover:bg-red-50" aria-label="Delete image">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {product.images.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-gray-500">No images yet.</p>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-500">{pending ? "Saving…" : ""}</span>
          <button onClick={openWidget} disabled={!ready} className="btn-primary">
            {ready ? "Upload images" : "Loading…"}
          </button>
        </div>
      </div>
    </div>
  );
}
