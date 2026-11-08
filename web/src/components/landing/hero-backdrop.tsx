"use client";

import { useEffect, useRef, useState } from "react";

export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`hero-backdrop ${paused ? "is-paused" : ""}`}
      aria-hidden="true"
    >
      <div className="hero-track">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/market-strip.svg" alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/market-strip.svg" alt="" />
      </div>
      <div className="hero-overlay" />
    </div>
  );
}
