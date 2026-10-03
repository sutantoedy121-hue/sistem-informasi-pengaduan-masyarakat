import { cn } from "@/lib/utils";

interface WaveDividerProps {
  /** Arah ombak: atas atau bawah section */
  position?: "top" | "bottom";
  className?: string;
  fillColor?: string;
}

/**
 * Pemisah Section Ombak 3D Halus (Smooth 3D Layered Wave).
 * Menggunakan 3 layer kurva SVG transparan bertumpuk dengan animasi lembut.
 */
export default function WaveDivider({
  position = "bottom",
  className = "",
  fillColor = "fill-slate-50/70",
}: WaveDividerProps) {
  const isTop = position === "top";

  return (
    <div
      className={cn(
        "pointer-events-none relative w-full overflow-hidden leading-none",
        isTop ? "rotate-180 -mt-1" : "-mb-1",
        className
      )}
      style={{ height: "48px" }}
      aria-hidden="true"
    >
      <div className="flex w-[200%] h-full">
        {/* Layer 1 - Ombak Belakang (Transparan Lembut) */}
        <svg
          className={cn("w-1/2 h-full shrink-0 opacity-40 animate-wave-slow", fillColor)}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z" />
        </svg>
        <svg
          className={cn("w-1/2 h-full shrink-0 opacity-40 animate-wave-slow", fillColor)}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      <div className="absolute inset-0 flex w-[200%] h-full">
        {/* Layer 2 - Ombak Depan Utama (Solid & Elegan) */}
        <svg
          className={cn("w-1/2 h-full shrink-0 animate-wave", fillColor)}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C200,80 400,-20 600,50 C800,120 1000,20 1200,80 L1200,120 L0,120 Z" />
        </svg>
        <svg
          className={cn("w-1/2 h-full shrink-0 animate-wave", fillColor)}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path d="M0,0 C200,80 400,-20 600,50 C800,120 1000,20 1200,80 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </div>
  );
}