import logoSrc from "@/assets/pme-logo.png";

export function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={logoSrc} alt="Priority Mail Express" className={className} />;
}

export function LogoLockup({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const text = variant === "dark" ? "text-navy" : "text-white";
  return (
    <div className="flex items-center gap-3">
      <Logo className="h-10 w-10" />
      <div className="leading-tight">
        <div className={`text-display text-base font-bold ${text}`}>PRIORITY MAIL EXPRESS</div>
        <div className={`text-[10px] tracking-[0.18em] uppercase ${variant === "dark" ? "text-pme-red" : "text-pme-red"}`}>
          International Special Delivery
        </div>
      </div>
    </div>
  );
}
