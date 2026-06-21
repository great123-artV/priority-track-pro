import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { STATUS_FLOW, STATUS_LABELS, statusBadgeClass, formatDateTime, formatMoney, PAYMENT_LABELS } from "@/lib/pme";
import type { ShipmentStatus } from "@/lib/pme";
import { Receipt as ReceiptIcon, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shipments/$id")({
  head: ({ params }) => ({ meta: [{ title: `Shipment ${params.id} — PME` }] }),
  component: ShipmentDetail,
});

function ShipmentDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      const { data: shipment } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
      if (!shipment) return null;
      const [{ data: events }, { data: delivery }] = await Promise.all([
        supabase.from("shipment_events").select("*").eq("shipment_id", id).order("event_at", { ascending: false }),
        supabase.from("delivery_confirmations").select("*").eq("shipment_id", id).maybeSingle(),
      ]);
      return { shipment, events: events ?? [], delivery };
    },
  });

  const [newStatus, setNewStatus] = useState<ShipmentStatus>("in_transit");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const [recv, setRecv] = useState("");
  const [delivNote, setDelivNote] = useState("");
  const [delivBusy, setDelivBusy] = useState(false);

  const addEvent = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.user!.id).maybeSingle();
      const { error } = await supabase.from("shipment_events").insert({
        shipment_id: id, status: newStatus, location: location || null, note: note || null,
        updated_by: u.user!.id, updated_by_name: prof?.full_name ?? u.user!.email ?? "Staff",
      });
      if (error) throw error;
      toast.success("Movement updated");
      setLocation(""); setNote("");
      qc.invalidateQueries({ queryKey: ["shipment", id] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  const confirmDelivery = async () => {
    if (!data || !recv.trim()) { toast.error("Receiver name required"); return; }
    setDelivBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", u.user!.id).maybeSingle();
      const { error } = await supabase.from("delivery_confirmations").upsert({
        shipment_id: id, receiver_name: recv, note: delivNote || null,
        delivered_by: u.user!.id, delivered_by_name: prof?.full_name ?? u.user!.email ?? "Driver",
      }, { onConflict: "shipment_id" });
      if (error) throw error;
      await supabase.from("shipment_events").insert({
        shipment_id: id, status: "delivered", location: location || data.shipment.destination_city,
        note: `Delivered to ${recv}`,
        updated_by: u.user!.id, updated_by_name: prof?.full_name ?? u.user!.email ?? "Driver",
      });
      toast.success("Delivery confirmed");
      setRecv(""); setDelivNote("");
      qc.invalidateQueries({ queryKey: ["shipment", id] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setDelivBusy(false); }
  };

  if (!data) return <div className="container mx-auto px-6 py-8 text-muted-foreground">Loading…</div>;
  const s = data.shipment;

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Tracking</div>
          <h1 className="text-display text-2xl font-bold">{s.tracking_number}</h1>
          <div className="mt-1 text-sm text-muted-foreground">Receipt: {s.receipt_number}</div>
          <span className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(s.current_status)}`}>{STATUS_LABELS[s.current_status]}</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/track/$tracking" params={{ tracking: s.tracking_number }}>Public Page</Link></Button>
          <Button asChild className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"><Link to="/receipt/$id" params={{ id: s.id }}><ReceiptIcon className="mr-2 h-4 w-4" /> View Receipt</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Update movement */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 text-display text-lg font-semibold"><MapPin className="h-4 w-4 text-pme-red" /> Update Movement</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>New Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ShipmentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_FLOW.map((st) => <SelectItem key={st} value={st}>{STATUS_LABELS[st]}</SelectItem>)}
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Current Location</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country / Hub" /></div>
              <div className="md:col-span-2"><Label>Note</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={addEvent} disabled={busy} className="bg-navy text-navy-foreground hover:bg-navy/90">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Update</Button>
            </div>
          </section>

          {/* Timeline */}
          <TrackingTimeline events={data.events} currentStatus={s.current_status} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <Card title="Sender">
            <P l="Name" v={s.sender_name} /><P l="Phone" v={s.sender_phone ?? "—"} />
            <P l="Location" v={`${s.sender_city ?? ""}, ${s.sender_country ?? ""}`} />
          </Card>
          <Card title="Receiver">
            <P l="Name" v={s.receiver_name} /><P l="Phone" v={s.receiver_phone ?? "—"} />
            <P l="Location" v={`${s.receiver_city ?? ""}, ${s.receiver_country ?? ""}`} />
          </Card>
          <Card title="Package">
            <P l="Description" v={s.package_description ?? "—"} />
            <P l="Quantity" v={String(s.quantity)} /><P l="Weight" v={`${s.weight_kg} kg`} />
            <P l="Service" v={s.delivery_type} />
          </Card>
          <Card title="Payment">
            <P l="Total" v={formatMoney(s.total_amount, s.currency)} />
            <P l="Status" v={PAYMENT_LABELS[s.payment_status]} />
            <P l="Method" v={s.payment_method ?? "—"} />
            <P l="Created" v={formatDateTime(s.created_at)} />
          </Card>

          {/* Delivery confirmation */}
          {!data.delivery ? (
            <Card title="Confirm Delivery">
              <Label>Receiver name</Label><Input value={recv} onChange={(e) => setRecv(e.target.value)} />
              <Label className="mt-2">Note</Label><Textarea rows={2} value={delivNote} onChange={(e) => setDelivNote(e.target.value)} />
              <Button onClick={confirmDelivery} disabled={delivBusy} className="mt-3 w-full bg-success text-success-foreground hover:bg-success/90">
                {delivBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Mark Delivered
              </Button>
            </Card>
          ) : (
            <Card title="Delivered">
              <P l="Received by" v={data.delivery.receiver_name} />
              <P l="At" v={formatDateTime(data.delivery.delivered_at)} />
              <P l="By" v={data.delivery.delivered_by_name ?? "—"} />
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-pme-red">{title}</div>
      <div className="space-y-1.5 text-sm">{children}</div>
    </div>
  );
}
function P({ l, v }: { l: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{l}</span><span className="text-right font-medium">{v}</span></div>;
}
