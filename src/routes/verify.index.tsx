import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify Receipt — Priority Mail Express" },
      { name: "description", content: "Verify the authenticity of a Priority Mail Express receipt." },
    ],
  }),
  component: VerifySearch,
});

function VerifySearch() {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState("");
  const [code, setCode] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto max-w-2xl px-4 py-20">
        <div className="mb-8 text-center">
          <BadgeCheck className="mx-auto h-10 w-10 text-pme-red" />
          <h1 className="mt-3 text-display text-3xl font-bold md:text-4xl">Verify a receipt</h1>
          <p className="mt-2 text-muted-foreground">
            Enter the receipt number and the 6-character verification code printed on your PME receipt.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const r = receipt.trim();
            const c = code.trim();
            if (!r) return;
            navigate({
              to: "/verify/$receipt",
              params: { receipt: r },
              search: c ? { code: c } : {},
            });
          }}
          className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-card"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Receipt Number</label>
            <Input
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              placeholder="PME-RCP-YYYYMMDD-000001"
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Verification Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6-character code (e.g. A3K9PX)"
              maxLength={6}
              className="h-12 font-mono tracking-[0.4em] uppercase"
            />
          </div>
          <Button type="submit" size="lg" className="w-full bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
            Verify Receipt
          </Button>
        </form>
      </section>
      <SiteFooter />
    </div>
  );
}
