"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function FloatingCta({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const paket = document.getElementById("paket");

    if (!hero) {
      return;
    }

    let heroVisible = true;
    let paketVisible = false;

    const sync = () => {
      const passedHero = window.scrollY > hero.offsetHeight * 0.6;
      setVisible(passedHero && heroVisible === false && paketVisible === false);
    };

    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );

    const paketObserver = new IntersectionObserver(
      ([entry]) => {
        paketVisible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.15 },
    );

    heroObserver.observe(hero);

    if (paket) {
      paketObserver.observe(paket);
    }

    window.addEventListener("scroll", sync, { passive: true });
    sync();

    return () => {
      heroObserver.disconnect();
      paketObserver.disconnect();
      window.removeEventListener("scroll", sync);
    };
  }, []);

  const visibility = visible ? "true" : "false";

  return (
    <>
      <Link
        href="#paket"
        className="floating-cta"
        data-visible={visibility}
        tabIndex={visible ? 0 : -1}
      >
        {label}
      </Link>
      <Link
        href="#paket"
        className="floating-cta-mobile"
        data-visible={visibility}
        tabIndex={visible ? 0 : -1}
      >
        {label}
      </Link>
    </>
  );
}
