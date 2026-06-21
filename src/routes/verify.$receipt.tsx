import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STATUS_LABELS, PAYMENT_LABELS, formatDateTime } from "@/lib/pme";

export const Route = createFileRoute("/verify/$receipt")({
  head: ({ params }) => ({
    meta: [{ title: `Verify ${params.receipt} — Priority Mail Express` }],
  }),
  component: VerifyDetail,
});

function VerifyDetail() {
  const { receipt } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["verify", receipt],
    queryFn: async () => {
      const { data } = await supabase
        .from("shipments")
        .select("*, origin:branches!shipments_origin_branch_id_fkey(name,city,country)")
        .eq("receipt_number", receipt)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-2xl px-4 py-16">
        {isLoading && <div className="text-muted-foreground">Verifying…</div>}
        {!isLoading && !data && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-display text-2xl font-bold">Receipt not verified</h1>
            <p className="mt-2 text-muted-foreground">Invalid or unknown receipt. Please contact Priority Mail Express support.</p>
            <Button asChild className="mt-5"><Link to="/verify">Try again</Link></Button>
          </div>
        )}
        {data && (
          <div className="rounded-xl border border-success/30 bg-card p-8 shadow-elevated">
            <div className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
              <BadgeCheck className="h-4 w-4" /> Verified Receipt
            </div>
            <h1 className="mt-4 text-display text-2xl font-bold">This receipt is authentic.</h1>

            <dl className="mt-6 grid gap-3 text-sm md:grid-cols-2">
              <Row label="Receipt Number" value={data.receipt_number} />
              <Row label="Tracking Number" value={data.tracking_number} />
              <Row label="Status" value={STATUS_LABELS[data.current_status]} />
              <Row label="Created" value={formatDateTime(data.created_at)} />
              <Row label="Origin Branch" value={data.origin ? `${data.origin.name} — ${data.origin.city}, ${data.origin.country}` : "—"} />
              <Row label="Destination" value={`${data.destination_city ?? ""}, ${data.destination_country ?? ""}`} />
              <Row label="Payment" value={PAYMENT_LABELS[data.payment_status]} />
              <Row label="Total" value={`${data.currency} ${Number(data.total_amount).toFixed(2)}`} />
            </dl>

            <div className="mt-6 flex gap-2">
              <Button asChild className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
                <Link to="/track/$tracking" params={{ tracking: data.tracking_number }}>View Tracking</Link>
              </Button>
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
