import { useId } from "react";

const HEART = "M24 42c-.6 0-1.2-.2-1.7-.6C14.4 35.3 6.5 28.5 6.5 19.6 6.5 13.8 11 9.3 16.6 9.3c3.1 0 5.8 1.4 7.4 3.7 1.6-2.3 4.3-3.7 7.4-3.7 5.6 0 10.1 4.5 10.1 10.3 0 8.9-7.9 15.7-15.8 21.8-.5.4-1.1.6-1.7.6Z";

/** Logo SunuSafeguard : un cœur — l'attention portée à chaque personne — où le soleil se lève sur la mer (« sunu » = notre). */
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <clipPath id={`${id}h`}><path d={HEART} /></clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13897B" />
          <stop offset="1" stopColor="#0A5F56" />
        </linearGradient>
      </defs>
      <path d={HEART} fill={`url(#${id}g)`} />
      <g clipPath={`url(#${id}h)`}>
        <circle cx="24" cy="29" r="8" fill="#F2C46D" />
        <circle cx="24" cy="29" r="4.8" fill="#D9902E" />
        <path d="M0 30.5c5-2.6 9-2.6 13.5 0s9 2.6 13.5 0 9-2.6 13.5 0 6 2 8 1V48H0Z" fill="#0C1B24" />
        <path d="M0 35.5c5-2.4 9-2.4 13.5 0s9 2.4 13.5 0 9-2.4 13.5 0 6 1.8 8 .9" fill="none" stroke="#4FD1BE" strokeOpacity=".55" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 32, sub, inverted = false, compact = false }: { size?: number; sub?: string; inverted?: boolean; compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="leading-none">
        <span className="flex items-baseline gap-[0.18em]">
          <span className={`font-display text-[1.32rem] font-semibold tracking-tight ${inverted ? "text-sand-100" : ""}`}>Sunu</span>
          <span className={`text-[0.98rem] font-semibold tracking-tight ${compact ? "hidden sm:inline" : ""} ${inverted ? "text-teal-light" : "text-teal dark:text-teal-light"}`}>Safeguard</span>
        </span>
        {sub && <span className={`mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.2em] ${inverted ? "text-sand-100/50" : "text-slate-400"}`}>{sub}</span>}
      </span>
    </span>
  );
}
