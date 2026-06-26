import { Link } from "@tanstack/react-router";
import { LogoLockup } from "./Logo";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useTriggerInstall() {
  const { t } = useTranslation();
  return () => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __pmeDeferredInstall?: BIPEvent };
    const ev = w.__pmeDeferredInstall;
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standalone) { toast.success(t("common.appInstalled")); return; }
    if (ev) { ev.prompt(); return; }
    if (isIOS) { toast.info(t("common.appInstallHintIOS")); return; }
    toast.info(t("common.appInstallHintOther"));
  };
}

export function SiteFooter() {
  const { t } = useTranslation();
  const triggerInstall = useTriggerInstall();
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <LogoLockup variant="light" />
          <p className="max-w-md text-sm text-white/70">{t("footer.tagline")}</p>
          <button
            onClick={triggerInstall}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-pme-red/60 hover:bg-pme-red/15"
          >
            <Download className="h-4 w-4" />
            {t("common.downloadApp")}
          </button>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">{t("footer.services")}</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li>{t("footer.serviceList.international")}</li>
            <li>{t("footer.serviceList.express")}</li>
            <li>{t("footer.serviceList.tracking")}</li>
            <li>{t("footer.serviceList.qr")}</li>
            <li>{t("footer.serviceList.pod")}</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">{t("footer.support")}</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/track" className="hover:text-white">{t("nav.track")}</Link></li>
            <li><Link to="/verify" className="hover:text-white">{t("nav.verify")}</Link></li>
            <li>support@prioritymailexpress.com</li>
            <li>+1 (800) PME-SHIP</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 relative">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/60 md:flex-row">
          <Link
            to="/auth"
            className="absolute bottom-2 left-2 h-2 w-2 rounded-full bg-white/10 cursor-default"
            aria-label="Staff"
          />
          <div>© {new Date().getFullYear()} Priority Mail Express. {t("footer.rights")}</div>
        </div>
      </div>
    </footer>
  );
}
