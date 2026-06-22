import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import {
  STATUS_LABELS, statusBadgeClass, formatDate, formatDateTime,
  computeShipmentProgress, healthBadgeClass,
} from "@/lib/pme";
import { AlertTriangle, MapPin, Package, Truck, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
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
            <ProgressHero
              tracking={data.shipment.tracking_number}
              status={data.shipment.current_status}
              location={data.shipment.current_location}
              departure={data.shipment.departure_date}
              expected={data.shipment.expected_arrival_date}
              deliveredAt={data.delivery?.delivered_at ?? null}
            />


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

function ProgressHero(props: {
  tracking: string;
  status: import("@/lib/pme").ShipmentStatus;
  location: string | null;
  departure: string | null;
  expected: string | null;
  deliveredAt: string | null;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const p = computeShipmentProgress({
    departure_date: props.departure,
    expected_arrival_date: props.expected,
    current_status: props.status,
    delivered_at: props.deliveredAt,
    now,
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-navy via-navy to-[#0a1530] p-6 text-white shadow-elevated md:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pme-red/20 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">Tracking Number</div>
          <div className="text-display text-2xl font-bold md:text-3xl">{props.tracking}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(props.status)}`}>
              {STATUS_LABELS[props.status]}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeClass(p.health)}`}>
              <ShieldCheck className="h-3 w-3" /> {p.healthLabel}
            </span>
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-white/60">Current Location</div>
          <div className="flex items-center justify-end gap-1 font-semibold">
            <MapPin className="h-4 w-4 text-pme-red" />
            {props.location ?? "—"}
          </div>
          <div className="mt-2 text-white/60">Expected</div>
          <div className="font-semibold">{formatDate(props.expected)}</div>
        </div>
      </div>

      {/* Live countdown */}
      <div className="relative mt-6 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
          <Clock className="h-4 w-4" /> {p.phase === "delivered" ? "Delivery Complete" : p.phase === "overdue" ? "Delivery Status" : "Live Countdown"}
        </div>
        <div className="mt-1 text-display text-xl font-bold md:text-2xl">{p.countdownLabel}</div>
        <div className="mt-1 text-sm text-white/70">{p.countdownDetail}</div>
      </div>

      {/* Progress */}
      <div className="relative mt-6">
        <div className="flex justify-between text-xs text-white/70">
          <span>Registered</span>
          <span className="font-semibold text-white">Delivery progress: {p.progressPct}%</span>
          <span>Delivered</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pme-red via-[#ff5b66] to-white transition-all duration-700"
            style={{ width: `${p.progressPct}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-white/60">{p.message}</div>
      </div>
    </div>
  );
}

