import { Link } from "@tanstack/react-router";
import { LogoLockup } from "./Logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/track" className="hover:text-foreground transition-colors">Track Shipment</Link>
          <Link to="/verify" className="hover:text-foreground transition-colors">Verify Receipt</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link to="/track">Track</Link>
          </Button>
          <Button asChild size="sm" className="bg-navy text-navy-foreground hover:bg-navy/90">
            <Link to="/auth">Staff Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
