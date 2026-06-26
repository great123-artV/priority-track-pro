import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LogoLockup } from "./Logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 glass-header">
      <div className="container mx-auto flex h-20 items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center" aria-label="Priority Mail Express home">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-foreground/70 md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">{t("nav.home")}</Link>
          <Link to="/track" className="transition-colors hover:text-foreground">{t("nav.track")}</Link>
          <Link to="/verify" className="transition-colors hover:text-foreground">{t("nav.verify")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher variant="header" />
          </div>
          <div className="md:hidden">
            <LanguageSwitcher variant="compact" />
          </div>
          <Button asChild variant="outline" size="sm" className="hidden border-border/70 bg-white/60 backdrop-blur sm:inline-flex">
            <Link to="/track">{t("nav.track")}</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-white/70 backdrop-blur md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-white/85 backdrop-blur md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3 text-sm font-medium text-foreground">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">{t("nav.home")}</Link>
            <Link to="/track" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">{t("nav.track")}</Link>
            <Link to="/verify" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-muted">{t("nav.verify")}</Link>
            <div className="mt-2 border-t border-border/60 pt-3">
              <LanguageSwitcher variant="header" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
