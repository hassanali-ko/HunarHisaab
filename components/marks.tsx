import Image from "next/image";

/**
 * Brand marks.
 *
 * The star is the block print motif from the logo, redrawn as a path so it
 * can be inlined, recoloured and animated. It does the job a bullet or a
 * divider would do elsewhere, which keeps one idea running through the whole
 * interface instead of decorating it.
 */

export function Star({
  size = 14,
  className = "",
  title,
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
    >
      {title ? <title>{title}</title> : null}
      {/* eight points, long on the axes and short on the diagonals */}
      <path
        d="M12 0.8 14.1 8.0 20.1 3.9 16.0 9.9 23.2 12 16.0 14.1 20.1 20.1 14.1 16.0 12 23.2 9.9 16.0 3.9 20.1 8.0 14.1 0.8 12 8.0 9.9 3.9 3.9 9.9 8.0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A row of stitching, used as a divider between sections. */
export function Seam({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 text-green-edge ${className}`}
      aria-hidden="true"
    >
      <span className="hairline flex-1" />
      <Star size={11} className="text-marigold" />
      <span className="hairline flex-1" />
    </div>
  );
}

export function Logo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex shrink-0 items-center gap-2 ${className}`}>
      <Image
        src="/mark.png"
        alt="HunarHisaab"
        width={72}
        height={72}
        priority
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span
        className={`latin whitespace-nowrap text-[17px] font-semibold tracking-tight ${
          compact ? "hidden sm:inline" : ""
        }`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Hunar<span className="text-green">Hisaab</span>
      </span>
    </span>
  );
}

/** Shown while the parser is working. */
export function Working({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-soft">
      <Star size={13} className="spin-star text-marigold" />
      {label}
    </span>
  );
}
