/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { cldUrl } from "@/lib/images";
import { ProductImagePlaceholder } from "@/components/ProductCard";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (images.length === 0) {
    return (
      <div className="card aspect-square overflow-hidden">
        <ProductImagePlaceholder />
      </div>
    );
  }
  return (
    <div>
      <div className="card aspect-square overflow-hidden bg-white">
        <img src={cldUrl(images[i], 1200)} alt={name} className="h-full w-full object-contain" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((id, k) => (
            <button
              key={id}
              onClick={() => setI(k)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 ${k === i ? "ring-brand" : "ring-transparent"}`}
              aria-label={`Image ${k + 1}`}
            >
              <img src={cldUrl(id, 120)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
