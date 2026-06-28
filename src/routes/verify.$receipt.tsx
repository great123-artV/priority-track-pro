import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BadgeCheck, XCircle, ShieldAlert, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import {
  STATUS_LABELS,
  PAYMENT_LABELS,
  formatDateTime,
  getVerificationCode,
  verifyReceiptCode,
} from "@/lib/pme";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/verify/$receipt")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [{ title: `Verify ${params.receipt} — Priority Mail Express` }],
  }),
  component: VerifyDetail,
});

function VerifyDetail() {
  const { receipt } = Route.useParams();
  const { code } = Route.useSearch();
  const { data, isLoading } = useQuery({
    queryKey: ["verify", receipt],
    queryFn: async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("*, origin:branches!shipments_origin_branch_id_fkey(name,city,country)")
        .eq("receipt_number", receipt)
        .maybeSingle();

      if (!shipment) return null;

      const { data: events } = await supabase
        .from("shipment_events")
        .select("*")
        .eq("shipment_id", shipment.id)
        .order("event_at", { ascending: false });

      return { ...shipment, events: events ?? [] };
    },
  });

  const codeProvided = !!code && code.trim().length > 0;
  const codeValid = data && codeProvided ? verifyReceiptCode(data.receipt_number, code!) : false;
  const verified = !!data && codeProvided && codeValid;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-16">
        {isLoading && <div className="text-muted-foreground">Verifying…</div>}

        {!isLoading && !data && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-display text-2xl font-bold">Receipt not verified</h1>
            <p className="mt-2 text-muted-foreground">
              No receipt matches <span className="font-mono">{receipt}</span>. Please check the
              receipt number and try again.
            </p>
            <Button asChild className="mt-5">
              <Link to="/verify">Try again</Link>
            </Button>
          </div>
        )}

        {!isLoading && data && !codeProvided && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-8 text-center">
            <ShieldAlert className="mx-auto h-10 w-10 text-warning" />
            <h1 className="mt-3 text-display text-2xl font-bold">Verification code required</h1>
            <p className="mt-2 text-muted-foreground">
              A receipt was found, but you must also enter the 6-character verification code printed
              on the receipt to confirm authenticity.
            </p>
            <Button asChild className="mt-5">
              <Link to="/verify">Enter verification code</Link>
            </Button>
          </div>
        )}

        {!isLoading && data && codeProvided && !codeValid && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-display text-2xl font-bold">Invalid verification code</h1>
            <p className="mt-2 text-muted-foreground">
              The code <span className="font-mono font-semibold">{code}</span> does not match
              receipt <span className="font-mono">{receipt}</span>. This receipt may be forged or
              the code was mistyped.
            </p>
            <Button asChild className="mt-5">
              <Link to="/verify">Try again</Link>
            </Button>
          </div>
        )}

        {verified && data && (
          <div className="space-y-6">
            <div className="rounded-xl border border-success/30 bg-card p-8 shadow-elevated">
              <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                <BadgeCheck className="h-4 w-4" /> Verified Authentic Receipt
              </div>
              <h1 className="mt-4 text-display text-2xl font-bold">
                This receipt is genuine and issued by Priority Mail Express.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Receipt number and verification code both match our records.
              </p>

              <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
                <Row label="Receipt Number" value={data.receipt_number} />
                <Row label="Verification Code" value={getVerificationCode(data.receipt_number)} />
                <Row label="Tracking Number" value={data.tracking_number} />
                <Row label="Status" value={STATUS_LABELS[data.current_status]} />
                <Row label="Created" value={formatDateTime(data.created_at)} />
                <Row
                  label="Origin Branch"
                  value={
                    data.origin
                      ? `${data.origin.name} — ${data.origin.city}, ${data.origin.country}`
                      : "—"
                  }
                />
                <Row
                  label="Destination"
                  value={`${data.destination_city ?? ""}, ${data.destination_country ?? ""}`}
                />
                <Row label="Payment" value={PAYMENT_LABELS[data.payment_status]} />
                <Row
                  label="Total"
                  value={`${data.currency} ${Number(data.total_amount).toFixed(2)}`}
                />
              </dl>

              <div className="mt-6 flex gap-2">
                <Button asChild className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
                  <Link to="/track/$tracking" params={{ tracking: data.tracking_number }}>
                    Full Tracking Page
                  </Link>
                </Button>
              </div>
            </div>

            {/* Embedded Tracking Information */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h3 className="flex items-center gap-2 text-display text-xl font-bold">
                  <Package className="h-5 w-5 text-pme-red" /> Shipment Progress
                </h3>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Current Location
                  </div>
                  <div className="flex items-center justify-end gap-1 text-sm font-semibold text-navy">
                    <MapPin className="h-3.5 w-3.5 text-pme-red" />
                    {data.current_location ?? "In Transit"}
                  </div>
                </div>
              </div>

              <TrackingTimeline events={data.events} currentStatus={data.current_status} />
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
