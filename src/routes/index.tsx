import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe2,
  Zap,
  ShieldCheck,
  QrCode,
  FileCheck2,
  Headphones,
  Search,
  BadgeCheck,
  ArrowRight,
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
      {
        name: "description",
        content:
          "Track international shipments, verify receipts, and ship with confidence. Premium logistics by Priority Mail Express.",
      },
      { property: "og:title", content: "Priority Mail Express — International Special Delivery" },
      {
        property: "og:description",
        content: "Track international shipments, verify receipts, and ship with confidence.",
      },
    ],
  }),
  component: Landing,
});

const FEATURE_KEYS = [
  { key: "international", icon: Globe2 },
  { key: "express", icon: Zap },
  { key: "secure", icon: ShieldCheck },
  { key: "qr", icon: QrCode },
  { key: "pod", icon: FileCheck2 },
  { key: "support", icon: Headphones },
] as const;

function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSearch = (type: "track" | "verify") => {
    const trimmed = code.trim();
    if (!trimmed) {
      navigate({ to: type === "track" ? "/track" : "/verify" });
      return;
    }
    if (type === "track") {
      navigate({ to: "/track/$tracking", params: { tracking: trimmed } });
    } else {
      navigate({ to: "/verify/$receipt", params: { receipt: trimmed } });
    }
  };

  return (
    <>
      <IntroAnimation />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <section className="relative overflow-hidden bg-gradient-hero text-white">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="container relative mx-auto grid gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                <span className="h-1.5 w-1.5 rounded-full bg-pme-red" /> {t("home.tagline")}
              </div>
              <h1 className="text-display text-4xl font-bold leading-tight md:text-6xl whitespace-pre-line">
                {t("home.heroTitle")}
              </h1>
              <p className="max-w-lg text-white/80 md:text-lg">{t("home.heroSubtitle")}</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"
                >
                  <Link to="/track">
                    {t("home.trackCta")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15"
                >
                  <Link to="/verify">{t("home.verifyCta")}</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-elevated backdrop-blur md:p-8">
              <div className="mb-4 flex items-center gap-2 text-white">
                <Search className="h-5 w-5 text-pme-red" />
                <h2 className="text-display text-xl font-semibold">{t("home.trackBoxTitle")}</h2>
              </div>
              <p className="mb-5 text-sm text-white/70">{t("home.trackBoxSubtitle")}</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch("track");
                }}
                className="space-y-3"
              >
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("home.trackingPlaceholder")}
                  className="h-12 border-white/20 bg-white text-foreground placeholder:text-muted-foreground"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"
                  >
                    {t("home.trackCta")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleSearch("verify")}
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" /> {t("home.verifyCta")}
                  </Button>
                </div>
              </form>
              <div className="mt-4 text-xs text-white/60">
                {t("common.tip")}: {t("common.scanTip")}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="mb-12 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-pme-red">
              {t("home.featuresEyebrow")}
            </div>
            <h2 className="mt-2 text-display text-3xl font-bold md:text-4xl">
              {t("home.featuresTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t("home.featuresSubtitle")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="group rounded-xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-navy text-navy-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-display text-lg font-semibold">
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`home.features.${key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </div>
    </>
  );
}
