import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import {
  STATUS_LABELS, statusBadgeClass, statusProgress, formatDate, formatDateTime,
} from "@/lib/pme";
import { AlertTriangle, MapPin, Package, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/track/$tracking")({
  head: ({ params }) => ({
    meta: [
      { title: `Tracking ${params.tracking} — Priority Mail Express` },
      { name: "description", content: `Live tracking and movement timeline for shipment ${params.tracking}.` },
    ],
  }),
  component: TrackDetail,
});

function TrackDetail() {
  const { tracking } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["track", tracking],
    queryFn: async () => {
      const { data: shipment } = await supabase
        .from("shipments")
        .select("*")
        .eq("tracking_number", tracking)
        .maybeSingle();
      if (!shipment) return null;
      const [{ data: events }, { data: delivery }] = await Promise.all([
        supabase.from("shipment_events").select("*").eq("shipment_id", shipment.id).order("event_at", { ascending: false }),
        supabase.from("delivery_confirmations").select("*").eq("shipment_id", shipment.id).maybeSingle(),
      ]);
      return { shipment, events: events ?? [], delivery };
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        {isLoading && <div className="text-muted-foreground">Loading shipment…</div>}

        {!isLoading && !data && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-3 text-display text-2xl font-bold">Tracking number not found</h1>
            <p className="mt-2 text-muted-foreground">"{tracking}" doesn't match any shipment in our system.</p>
            <Button asChild className="mt-5"><Link to="/track">Try again</Link></Button>
          </div>
        )}

        {data && (
          <>
            {/* Status header */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Tracking Number</div>
                  <div className="text-display text-2xl font-bold md:text-3xl">{data.shipment.tracking_number}</div>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusBadgeClass(data.shipment.current_status)}"
                    style={{}}
                  >
                    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${statusBadgeClass(data.shipment.current_status)}`}>
                      {STATUS_LABELS[data.shipment.current_status]}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Current Location</div>
                  <div className="flex items-center justify-end gap-1 font-semibold">
                    <MapPin className="h-4 w-4 text-pme-red" />
                    {data.shipment.current_location ?? "—"}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Registered</span><span>{statusProgress(data.shipment.current_status)}%</span><span>Delivered</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-navy to-pme-red transition-all" style={{ width: `${statusProgress(data.shipment.current_status)}%` }} />
                </div>
              </div>
            </div>

            {/* KPI grid */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <KPI icon={<Package />} label="Service" value={data.shipment.delivery_type} />
              <KPI icon={<Truck />} label="Departure" value={formatDate(data.shipment.departure_date)} />
              <KPI icon={<CheckCircle2 />} label="Expected Arrival" value={formatDate(data.shipment.expected_arrival_date)} />
            </div>

            {/* Parties + details */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <PartyCard title="From" name={data.shipment.sender_name} phone={data.shipment.sender_phone} loc={[data.shipment.sender_city, data.shipment.sender_country]} address={data.shipment.sender_address} />
              <PartyCard title="To" name={data.shipment.receiver_name} phone={data.shipment.receiver_phone} loc={[data.shipment.receiver_city, data.shipment.receiver_country]} address={data.shipment.receiver_address} />
            </div>

            <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-display text-lg font-semibold">Package Details</h3>
              <div className="mt-3 grid gap-4 text-sm md:grid-cols-4">
                <Detail label="Description" value={data.shipment.package_description ?? "—"} />
                <Detail label="Quantity" value={String(data.shipment.quantity)} />
                <Detail label="Weight" value={`${data.shipment.weight_kg} kg`} />
                <Detail label="Destination" value={`${data.shipment.destination_city ?? ""}, ${data.shipment.destination_country ?? ""}`} />
              </div>
            </div>

            {/* Proof of delivery */}
            {data.delivery && (
              <div className="mt-6 rounded-xl border border-success/30 bg-success/5 p-6">
                <div className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-5 w-5" /> Delivered Successfully
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
                  <Detail label="Received by" value={data.delivery.receiver_name} />
                  <Detail label="Date / time" value={formatDateTime(data.delivery.delivered_at)} />
                  <Detail label="Delivered by" value={data.delivery.delivered_by_name ?? "—"} />
                </div>
                {data.delivery.photo_url && (
                  <img src={data.delivery.photo_url} alt="Proof of delivery" className="mt-4 max-h-64 rounded-lg border" />
                )}
                {data.delivery.note && <p className="mt-3 text-sm">{data.delivery.note}</p>}
              </div>
            )}

            {/* Timeline */}
            <div className="mt-6">
              <TrackingTimeline events={data.events} currentStatus={data.shipment.current_status} />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy/10 text-navy">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function PartyCard({ title, name, phone, loc, address }: { title: string; name: string; phone?: string | null; loc: (string | null)[]; address?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="text-xs font-semibold uppercase tracking-wider text-pme-red">{title}</div>
      <div className="mt-2 text-display text-lg font-bold">{name}</div>
      {phone && <div className="text-sm text-muted-foreground">{phone}</div>}
      <div className="mt-2 text-sm">{loc.filter(Boolean).join(", ")}</div>
      {address && <div className="text-sm text-muted-foreground">{address}</div>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
