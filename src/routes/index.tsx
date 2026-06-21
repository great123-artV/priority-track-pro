import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Globe2, Zap, ShieldCheck, QrCode, FileCheck2, Headphones,
  Search, BadgeCheck, ArrowRight,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { IntroAnimation } from "@/components/IntroAnimation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Priority Mail Express — International Special Delivery" },
      { name: "description", content: "Track international shipments, verify receipts, and ship with confidence. Premium logistics by Priority Mail Express." },
      { property: "og:title", content: "Priority Mail Express — International Special Delivery" },
      { property: "og:description", content: "Track international shipments, verify receipts, and ship with confidence." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Globe2, title: "International Delivery", desc: "Door-to-door coverage across 200+ countries with regional sortation hubs." },
  { icon: Zap, title: "Express Courier Service", desc: "Time-definite next-day, 2-day, and same-week express options worldwide." },
  { icon: ShieldCheck, title: "Secure Shipment Tracking", desc: "End-to-end visibility from registration to delivery with audit-grade events." },
  { icon: QrCode, title: "QR Code Receipt Tracking", desc: "Every receipt embeds a unique QR linking customers straight to live tracking." },
  { icon: FileCheck2, title: "Proof of Delivery", desc: "Receiver signature, photo, GPS, and timestamped delivery confirmation." },
  { icon: Headphones, title: "Customer Support", desc: "24/7 multilingual support team for senders, receivers, and enterprise clients." },
];

function Landing() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const onTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    navigate({ to: "/track/$tracking", params: { tracking: code.trim() } });
  };

  return (
    <>
      <IntroAnimation />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero text-white">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="container relative mx-auto grid gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full bg-pme-red" /> International Special Delivery
              </div>
              <h1 className="text-display text-4xl font-bold leading-tight md:text-6xl">
                Move the world,<br />one shipment at a time.
              </h1>
              <p className="max-w-lg text-white/80 md:text-lg">
                Priority Mail Express is your enterprise courier partner for international
                express delivery, secure tracking, and QR-verified receipts.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
                  <Link to="/track">Track Shipment <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15">
                  <Link to="/verify">Verify Receipt</Link>
                </Button>
              </div>
            </div>

            {/* Tracking box */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-elevated backdrop-blur md:p-8">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-pme-red" />
                <h2 className="text-display text-xl font-semibold">Track Your Shipment</h2>
              </div>
              <p className="mb-5 text-sm text-white/70">Enter your tracking number to see live shipment movement.</p>
              <form onSubmit={onTrack} className="space-y-3">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PME-AWB-YYYYMMDD-000001"
                  className="h-12 border-white/20 bg-white text-foreground placeholder:text-muted-foreground"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button type="submit" size="lg" className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
                    Track Shipment
                  </Button>
                  <Button asChild type="button" size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                    <Link to="/verify"><BadgeCheck className="mr-2 h-4 w-4" /> Verify Receipt</Link>
                  </Button>
                </div>
              </form>
              <div className="mt-4 text-xs text-white/60">Tip: scan the QR code on your printed receipt with your phone camera.</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="mb-12 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-pme-red">What we deliver</div>
            <h2 className="mt-2 text-display text-3xl font-bold md:text-4xl">A complete logistics platform</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Built for couriers, branches, and customers — every shipment is registered,
              tracked, and verified end-to-end.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-navy text-navy-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section className="bg-navy text-navy-foreground">
          <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 py-14 md:flex-row">
            <div>
              <h3 className="text-display text-2xl font-bold md:text-3xl">Ship with Priority Mail Express today</h3>
              <p className="mt-1 text-white/70">Staff sign-in to create shipments, generate QR receipts, and update movement.</p>
            </div>
            <Button asChild size="lg" className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
              <Link to="/auth">Staff Login <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
