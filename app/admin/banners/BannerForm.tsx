"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Check, Upload } from "lucide-react";
import BannerCard from "@/components/BannerCard";
import { IMAGE_FORMATS } from "@/lib/images";
import {
  BANNER_COLORS,
  BANNER_FOLDER,
  BANNER_TITLE_MAX,
  COLOR_CLASSES,
  bannerImageUrl,
  type BannerLinkType,
} from "@/lib/banner-presets";
import { discardUpload, lookupProduct, saveBanner, type BannerInput } from "./actions";

type Props = {
  id: number | null;
  initial: BannerInput;
  categories: { slug: string; name: string }[];
  cloudName: string;
  apiKey: string;
};

export default function BannerForm({ id, initial, categories, cloudName, apiKey }: Props) {
  const router = useRouter();
  const [v, setV] = useState<BannerInput>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.cloudinary);
  const [lookup, setLookup] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();
  const imgRef = useRef(initial.imagePublicId);

  const set = <K extends keyof BannerInput>(k: K, val: BannerInput[K]) => setV((p) => ({ ...p, [k]: val }));

  function openWidget() {
    if (!window.cloudinary) return;
    setError("");
    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey,
        folder: BANNER_FOLDER,
        multiple: false,
        maxFiles: 1,
        resourceType: "image",
        sources: ["local", "camera", "url"],
        clientAllowedFormats: [...IMAGE_FORMATS],
        maxFileSize: 10_000_000,
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
          const next = result.info.public_id;
          // An earlier unsaved upload from this form is no longer needed.
          const prev = imgRef.current;
          if (prev && prev !== initial.imagePublicId) void discardUpload(prev);
          imgRef.current = next;
          setV((p) => ({ ...p, imagePublicId: next }));
        }
      }
    );
    widget.open();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!v.imagePublicId) return setError("Please upload a photo.");
    start(async () => {
      const r = await saveBanner(id, v);
      if (r?.error) setError(r.error);
    });
  }

  function cancel() {
    if (v.imagePublicId && v.imagePublicId !== initial.imagePublicId) void discardUpload(v.imagePublicId);
    router.push("/admin/banners");
  }

  function changeType(t: BannerLinkType) {
    setLookup(null);
    setV((p) => ({ ...p, linkType: t, linkValue: t === "category" ? (categories[0]?.slug ?? "") : "" }));
  }

  function findProduct() {
    startLookup(async () => {
      const r = await lookupProduct(v.linkValue);
      setLookup(r ? r.name : "");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Script src="https://upload-widget.cloudinary.com/latest/global/all.js" strategy="afterInteractive" onReady={() => setReady(true)} />

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <span className="label">Photo *</span>
          <button type="button" onClick={openWidget} disabled={!ready} className="btn-outline">
            <Upload className="h-4 w-4" aria-hidden />
            {!ready ? "Loading…" : v.imagePublicId ? "Replace photo" : "Upload photo"}
          </button>
          <p className="mt-1 text-xs text-gray-500">Cropped to 12:7 automatically. JPG, PNG, WebP or GIF, up to 10 MB.</p>
        </div>

        <div>
          <label className="label" htmlFor="b-label">Label</label>
          <input id="b-label" className="input" value={v.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Diwali special" />
        </div>

        <div>
          <label className="label" htmlFor="b-title">Title *</label>
          <input
            id="b-title"
            className="input"
            required
            maxLength={BANNER_TITLE_MAX}
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-gray-500">{v.title.length}/{BANNER_TITLE_MAX}</p>
        </div>

        <div>
          <label className="label" htmlFor="b-link-text">Link text</label>
          <input id="b-link-text" className="input" value={v.linkText} onChange={(e) => set("linkText", e.target.value)} placeholder="e.g. Shop now" />
        </div>

        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div>
            <label className="label" htmlFor="b-link-type">Links to</label>
            <select id="b-link-type" className="input" value={v.linkType} onChange={(e) => changeType(e.target.value as BannerLinkType)}>
              <option value="category">Category</option>
              <option value="product">Product</option>
              <option value="search">Search</option>
            </select>
          </div>
          <div>
            {v.linkType === "category" && (
              <>
                <label className="label" htmlFor="b-cat">Category</label>
                <select id="b-cat" className="input" required value={v.linkValue} onChange={(e) => set("linkValue", e.target.value)}>
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </>
            )}
            {v.linkType === "product" && (
              <>
                <label className="label" htmlFor="b-barcode">Barcode</label>
                <div className="flex gap-2">
                  <input
                    id="b-barcode"
                    className="input font-mono"
                    required
                    value={v.linkValue}
                    onChange={(e) => {
                      set("linkValue", e.target.value);
                      setLookup(null);
                    }}
                  />
                  <button type="button" onClick={findProduct} disabled={looking || !v.linkValue.trim()} className="btn-outline shrink-0">
                    {looking ? "…" : "Look up"}
                  </button>
                </div>
                {lookup !== null && (
                  <p className={`mt-1 text-xs ${lookup ? "text-green-700" : "text-red-600"}`}>{lookup || "No product with this barcode."}</p>
                )}
              </>
            )}
            {v.linkType === "search" && (
              <>
                <label className="label" htmlFor="b-q">Search text</label>
                <input id="b-q" className="input" required value={v.linkValue} onChange={(e) => set("linkValue", e.target.value)} />
              </>
            )}
          </div>
        </div>

        <div>
          <span className="label">Colour</span>
          <div className="flex gap-2">
            {BANNER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("color", c)}
                aria-label={c}
                aria-pressed={v.color === c}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-white ring-offset-2 ${COLOR_CLASSES[c].swatch} ${
                  v.color === c ? "ring-2 ring-gray-900" : ""
                }`}
              >
                {v.color === c && <Check className="h-4 w-4" aria-hidden />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="b-from">Show from</label>
            <input id="b-from" type="date" className="input" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="b-until">Show until</label>
            <input id="b-until" type="date" className="input" value={v.endsAt} min={v.startsAt || undefined} onChange={(e) => set("endsAt", e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          Active
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={cancel} className="btn-outline">Cancel</button>
          <button disabled={pending} className="btn-primary">{pending ? "Saving…" : id ? "Save changes" : "Add banner"}</button>
        </div>
      </form>

      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">Preview</div>
        <div className="rounded-3xl bg-brand p-5 lg:sticky lg:top-4">
          <BannerCard
            imageUrl={v.imagePublicId ? bannerImageUrl(v.imagePublicId) : null}
            label={v.label.trim() || null}
            title={v.title.trim() || "Banner title"}
            linkText={v.linkText.trim()}
            color={v.color}
          />
        </div>
      </div>
    </div>
  );
}
