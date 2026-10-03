"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Global Page Transition Wrapper (Shadow Smoke Transition).
 * Memberikan efek transisi lembut (fade + subtle depth elevation)
 * setiap kali rute halaman berpindah di seluruh website.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={`relative min-h-screen transition-all duration-400 ease-out ${
        animating ? "opacity-90 translate-y-1" : "opacity-100 translate-y-0"
      }`}
    >
      {children}
    </div>
  );
}