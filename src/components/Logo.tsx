import React from "react";

interface LogoProps {
  /** Render only the icon mark (no text). */
  iconOnly?: boolean;
  className?: string;
  /** Use light text for dark backgrounds (sidebar). */
  light?: boolean;
}

/**
 * Chaafai Emballage brand logo: a carton / packaging box mark + wordmark.
 * Pure SVG, no external assets.
 */
export function Logo({ iconOnly = false, className = "", light = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      {!iconOnly && (
        <div className="leading-tight">
          <div
            className={`text-base font-bold tracking-tight ${
              light ? "text-white" : "text-slate-900"
            }`}
          >
            Chaafai <span className="text-brand-500">Emballage</span>
          </div>
          <div
            className={`text-[10px] font-medium uppercase tracking-wide ${
              light ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Solutions d&apos;emballage pro
          </div>
        </div>
      )}
    </div>
  );
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chaafai Emballage"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="chaafaiGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#0a8757" />
          <stop offset="1" stopColor="#0b553b" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill="url(#chaafaiGrad)" />
      {/* Carton box: top flaps + body + center seam */}
      <g
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      >
        {/* box body */}
        <path d="M11 18 L24 24 L37 18 L37 33 L24 39 L11 33 Z" />
        {/* left top flap */}
        <path d="M11 18 L17 13 L30 19" />
        {/* right top flap */}
        <path d="M37 18 L31 13 L18 19" />
        {/* center vertical seam */}
        <path d="M24 24 L24 39" />
      </g>
      {/* accent tape line */}
      <path d="M11 18 L24 24 L37 18" stroke="#76dfac" strokeWidth="2" fill="none" />
    </svg>
  );
}

export default Logo;
