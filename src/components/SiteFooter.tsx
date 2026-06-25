import { Link } from "@tanstack/react-router";
import { LogoLockup } from "./Logo";
import { Download } from "lucide-react";
import { toast } from "sonner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function triggerInstall() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __pmeDeferredInstall?: BIPEvent };
  const ev = w.__pmeDeferredInstall;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (standalone) {
    toast.success("App already installed");
    return;
  }
  if (ev) {
    ev.prompt();
    return;
  }
  if (isIOS) {
    toast.info("To install: tap Share, then 'Add to Home Screen'.");
    return;
  }
  toast.info("Open in Chrome/Edge and use the menu → 'Install app'.");
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-navy-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <LogoLockup variant="light" />
          <p className="max-w-md text-sm text-white/70">
            Priority Mail Express delivers fast, secure international courier and logistics
            services with end-to-end QR-verified tracking for every shipment.
          </p>
          <button
            onClick={triggerInstall}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-pme-red/60 hover:bg-pme-red/15"
          >
            <Download className="h-4 w-4" />
            Download App
          </button>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">Services</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li>International Delivery</li>
            <li>Express Courier</li>
            <li>Secure Tracking</li>
            <li>QR Code Receipts</li>
            <li>Proof of Delivery</li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/80">Support</div>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link to="/track" className="hover:text-white">Track Shipment</Link></li>
            <li><Link to="/verify" className="hover:text-white">Verify Receipt</Link></li>
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
          />
          <div>© {new Date().getFullYear()} Priority Mail Express. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
