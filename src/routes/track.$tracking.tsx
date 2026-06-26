import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { ShipmentMap } from "@/components/ShipmentMap";
import {
  statusBadgeClass, formatDate, formatDateTime,
  computeShipmentProgress, healthBadgeClass, useStatusLabel, useHealthLabel,
} from "@/lib/pme";
import { AlertTriangle, MapPin, CheckCircle2, Clock, ShieldCheck, Search, MessageSquare, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRACKING_REGEX = /^PME-AWB-\d{8}-\d{6}$/i;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["track", tracking],
    queryFn: async () => {
      let query = supabase.from("shipments").select("*");

      if (UUID_REGEX.test(tracking)) {
        query = query.eq("id", tracking);
      } else {
        query = query.eq("tracking_number", tracking);
      }

      const { data: shipment } = await query.maybeSingle();

      if (!shipment) return null;

      // If searched by UUID, redirect to the tracking number URL
      if (UUID_REGEX.test(tracking)) {
        setIsRedirecting(true);
        navigate({
          to: "/track/$tracking",
          params: { tracking: shipment.tracking_number },
          replace: true,
        });
        return null;
      }

      const [{ data: events }, { data: delivery }] = await Promise.all([
        supabase
          .from("shipment_events")
          .select("*")
          .eq("shipment_id", shipment.id)
          .order("event_at", { ascending: false }),
        supabase
          .from("delivery_confirmations")
          .select("*")
          .eq("shipment_id", shipment.id)
          .maybeSingle(),
      ]);
      return { shipment, events: events ?? [], delivery };
    },
  });

  const isValidFormat = TRACKING_REGEX.test(tracking) || UUID_REGEX.test(tracking);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-10">
        {(isLoading || isRedirecting) && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-pme-red border-t-transparent" />
            <p>Locating shipment...</p>
          </div>
        )}

        {!isLoading && !isRedirecting && (!data || !isValidFormat) && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center shadow-lg">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-display text-3xl font-bold text-foreground">Shipment Not Found</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              We could not locate a shipment with the tracking number entered.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="min-w-[160px] bg-pme-red hover:bg-pme-red/90">
                <Link to="/track">
                  <Search className="mr-2 h-4 w-4" /> Search Again
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                <a href="https://wa.me/2340000000000" target="_blank" rel="noopener noreferrer">
                  <MessageSquare className="mr-2 h-4 w-4" /> Contact Support
                </a>
              </Button>
              <Button asChild variant="ghost" size="lg" className="min-w-[160px]">
                <a href="mailto:support@prioritymailexpress.com">
                  <Mail className="mr-2 h-4 w-4" /> Email Us
                </a>
              </Button>
            </div>
          </div>
        )}

        {data && !isRedirecting && (
          <>
            <div className="mb-6 flex flex-col gap-6 lg:flex-row">
              <div className="flex-1">
                <ProgressHero
                  tracking={data.shipment.tracking_number}
                  status={data.shipment.current_status}
                  location={data.shipment.current_location}
                  departure={data.shipment.departure_date}
                  expected={data.shipment.expected_arrival_date}
                  deliveredAt={data.delivery?.delivered_at ?? null}
                  originCity={data.shipment.sender_city}
                  originCountry={data.shipment.sender_country}
                  destCity={data.shipment.destination_city}
                  destCountry={data.shipment.destination_country}
                  contents={data.shipment.package_contents}
                />
              </div>

              <div className="w-full lg:w-80">
                <StatusCard
                  status={data.shipment.current_status}
                  departure={data.shipment.departure_date}
                  expected={data.shipment.expected_arrival_date}
                  deliveredAt={data.delivery?.delivered_at ?? null}
                  updatedAt={data.shipment.updated_at}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                    <h3 className="text-display text-xl font-bold">Shipment Summary</h3>
                    <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                      <ShieldCheck className="h-4 w-4" /> Verified Shipment
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <PartyCard
                      title="Sender"
                      name={data.shipment.sender_name}
                      phone={data.shipment.sender_phone}
                      loc={[data.shipment.sender_city, data.shipment.sender_country]}
                      address={data.shipment.sender_address}
                    />
                    <PartyCard
                      title="Receiver"
                      name={data.shipment.receiver_name}
                      phone={data.shipment.receiver_phone}
                      loc={[data.shipment.receiver_city, data.shipment.receiver_country]}
                      address={data.shipment.receiver_address}
                    />
                  </div>

                  <div className="mt-8 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <Detail label="Origin" value={`${data.shipment.sender_city ?? ""}, ${data.shipment.sender_country ?? ""}`} />
                    <Detail label="Destination" value={`${data.shipment.destination_city ?? ""}, ${data.shipment.destination_country ?? ""}`} />
                    <Detail label="Service Type" value={data.shipment.delivery_type} />
                    <Detail label="Package" value={data.shipment.package_description ?? "—"} />
                  </div>
                </div>

                <div className="mt-6">
                  <TrackingTimeline events={data.events} currentStatus={data.shipment.current_status} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="mb-4 text-display text-lg font-semibold">Package Details</h3>
                  <div className="space-y-4">
                    <Detail label="Contents" value={data.shipment.package_contents ?? "—"} />
                    <Detail label="Quantity" value={String(data.shipment.quantity)} />
                    <Detail label="Weight" value={`${data.shipment.weight_kg} kg`} />
                  </div>
                </div>

                {/* Proof of delivery */}
                {data.delivery && (
                  <div className="rounded-xl border border-success/30 bg-success/5 p-6">
                    <div className="flex items-center gap-2 font-semibold text-success">
                      <CheckCircle2 className="h-5 w-5" /> Delivered Successfully
                    </div>
                    <div className="mt-2 space-y-3 text-sm">
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
              </div>
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusCard(props: {
  status: import("@/lib/pme").ShipmentStatus;
  departure: string | null;
  expected: string | null;
  deliveredAt: string | null;
  updatedAt: string | null;
}) {
  const { t } = useTranslation();
  const statusLabel = useStatusLabel();
  const healthLabel = useHealthLabel();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tm = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tm);
  }, []);

  const p = computeShipmentProgress({
    departure_date: props.departure,
    expected_arrival_date: props.expected,
    current_status: props.status,
    delivered_at: props.deliveredAt,
    now,
  });

  return (
    <div className="h-full rounded-xl border border-border bg-card p-6 shadow-card">
      <h3 className="mb-4 text-display text-lg font-semibold">{t("track.shipmentStatus")}</h3>
      <div className="space-y-6">
        <Detail
          label={t("track.currentStatus")}
          value={
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(props.status)}`}>
              {statusLabel(props.status)}
            </span>
          }
        />
        <Detail
          label={t("track.deliveryHealth")}
          value={
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${healthBadgeClass(p.health)}`}>
              <ShieldCheck className="h-3 w-3" /> {healthLabel(p.health)}
            </span>
          }
        />
        <Detail label={t("track.lastUpdate")} value={formatDateTime(props.updatedAt)} />
        <Detail label={t("track.expectedDelivery")} value={formatDate(props.expected)} />

        <div className="border-t border-border pt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("track.timeRemaining")}</div>
          <div className="mt-1 font-bold text-foreground">{p.countdownLabel}</div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("track.progress")}</span>
            <span className="font-semibold text-foreground">{p.progressPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-pme-red transition-all duration-700"
              style={{ width: `${p.progressPct}%` }}
            />
          </div>
        </div>
      </div>
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
  originCity?: string | null;
  originCountry?: string | null;
  destCity?: string | null;
  destCountry?: string | null;
  contents?: string | null;
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

      <div className="relative mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/60">Tracking Number</div>
          <div className="text-display text-2xl font-bold md:text-3xl">{props.tracking}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-white/60">Current Location</div>
          <div className="flex items-center justify-end gap-1 font-semibold">
            <MapPin className="h-4 w-4 text-pme-red" />
            {props.location ?? "—"}
          </div>
        </div>
      </div>

      <div className="relative mb-8">
        <ShipmentMap
          originCity={props.originCity}
          originCountry={props.originCountry}
          destCity={props.destCity}
          destCountry={props.destCountry}
          progress={p.progressPct}
          contents={props.contents}
        />
      </div>

      {/* Progress */}
      <div className="relative mt-8">
        <div className="flex justify-between text-xs text-white/70">
          <span>Registered</span>
          <span className="font-semibold text-white">Journey Progress</span>
          <span>Delivered</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pme-red via-[#ff5b66] to-white transition-all duration-700"
            style={{ width: `${p.progressPct}%` }}
          />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/5 p-3 text-sm backdrop-blur">
          <Clock className="h-4 w-4 text-pme-red" />
          <span>{p.message}</span>
        </div>
      </div>
    </div>
  );
}

function PartyCard({ title, name, phone, loc, address }: { title: string; name: string; phone?: string | null; loc: (string | null)[]; address?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-accent/5">
      <div className="text-xs font-semibold uppercase tracking-wider text-pme-red">{title}</div>
      <div className="mt-2 text-lg font-bold">{name}</div>
      {phone && <div className="text-sm text-muted-foreground">{phone}</div>}
      <div className="mt-2 text-sm">{loc.filter(Boolean).join(", ")}</div>
      {address && <div className="mt-1 text-sm text-muted-foreground">{address}</div>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}
