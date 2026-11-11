"use client";

import { useEffect, useRef, useState } from "react";
import { Boxes } from "lucide-react";
import BannerCard from "./BannerCard";
import type { SlideData } from "@/lib/banners";

const INTERVAL = 3500;

/** Hero banner slider: auto-rotates (2+), dots, swipe, pause on hover. 0 banners → default card. */
export default function BannerSlider({ slides, countLabel }: { slides: SlideData[]; countLabel: string }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL);
    return () => clearInterval(t);
  }, [n, paused, index]);

  if (n === 0) {
    return (
      <BannerCard
        href="/products"
        imageUrl={null}
        label="Full catalogue"
        title={`Browse ${countLabel} products`}
        linkText="Shop now"
        color="orange"
        visual={
          <div className="relative flex h-full items-center justify-center bg-gradient-to-br from-brand-light to-white">
            <span className="absolute left-[12%] top-[20%] h-3 w-3 rounded-full bg-tn-yellow" aria-hidden />
            <span className="absolute bottom-[18%] left-[22%] h-2 w-2 rounded-full bg-tn-teal" aria-hidden />
            <span className="absolute right-[14%] top-[26%] h-2.5 w-2.5 rounded-full bg-tn-pink" aria-hidden />
            <span className="absolute bottom-[22%] right-[20%] h-3 w-3 rounded-full bg-tn-orange" aria-hidden />
            <Boxes className="h-20 w-20 text-brand" strokeWidth={1.5} aria-hidden />
          </div>
        }
      />
    );
  }

  if (n === 1) {
    const s = slides[0];
    return <BannerCard {...s} />;
  }

  function go(i: number) {
    setIndex(((i % n) + n) % n);
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      aria-roledescription="carousel"
    >
      <div className="overflow-hidden rounded-2xl">
        {/* All slides stay rendered in one row → equal height, no layout jump. */}
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((s, i) => (
            <div key={s.id} className="w-full shrink-0" aria-hidden={i !== index} inert={i !== index}>
              <BannerCard {...s} />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => go(i)}
            aria-label={`Show banner ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-tn-yellow" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
