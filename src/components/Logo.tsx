
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <img
      src="/pme-logo.png"
      alt="Priority Mail Express — International Special Delivery"
      className={className}
      draggable={false}
      crossOrigin="anonymous"
    />
  );
}

// The supplied logo already contains the full wordmark + tagline,
// so the "lockup" just renders the artwork at an appropriate scale.
// `variant` is kept for API compatibility; on dark backgrounds we drop
// the image onto a soft white glass plate so the red/blue stay vivid.
export function LogoLockup({ variant = "dark" }: { variant?: "dark" | "light" }) {
  if (variant === "light") {
    return (
      <div className="inline-flex items-center rounded-xl bg-white/95 px-3 py-1.5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/30 backdrop-blur">
        <Logo className="h-9 w-auto" />
      </div>
    );
  }
  return <Logo className="h-10 w-auto md:h-11" />;
}
