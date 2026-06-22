import { Link } from "@tanstack/react-router";
import { LogoLockup } from "./Logo";

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
            className="absolute bottom-2 left-2 h-1 w-1 rounded-full bg-white/5 cursor-default"
          />
          <div>© {new Date().getFullYear()} Priority Mail Express. All rights reserved.</div>
          <div>Powered by <span className="text-white">Nosky Tech</span></div>
        </div>
      </div>
    </footer>
  );
}
