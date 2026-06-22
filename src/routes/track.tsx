import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Shipment — Priority Mail Express" },
      { name: "description", content: "Track your international shipment with Priority Mail Express." },
    ],
  }),
  component: TrackSearch,
});

function TrackSearch() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <div className="mb-8 text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-pme-red">Tracking</div>
          <h1 className="mt-2 text-display text-3xl font-bold md:text-4xl">Track your shipment</h1>
          <p className="mt-2 text-muted-foreground">Enter your tracking number or scan the QR on your receipt.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = code.trim();
            if (trimmed) navigate({ to: "/track/$tracking", params: { tracking: trimmed } });
          }}
          className="flex gap-2 rounded-xl border border-border bg-card p-3 shadow-card"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PME-AWB-YYYYMMDD-000001" className="h-12 pl-9" />
          </div>
          <Button type="submit" size="lg" className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">Track</Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">Customers do not need to log in. Just enter your tracking number.</p>
      </section>
      <SiteFooter />
    </div>
  );
}
