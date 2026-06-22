import { Link } from "@tanstack/react-router";
import { LogoLockup } from "./Logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center" aria-label="Priority Mail Express home">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">Home</Link>
          <Link to="/track" className="transition-colors hover:text-foreground">Track Shipment</Link>
          <Link to="/verify" className="transition-colors hover:text-foreground">Verify Receipt</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden border-border/70 bg-white/60 backdrop-blur sm:inline-flex">
            <Link to="/track">Track</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
