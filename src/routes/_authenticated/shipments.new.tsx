import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/shipments/new")({
  head: () => ({ meta: [{ title: "New Shipment — Priority Mail Express" }] }),
  component: NewShipment,
});

const DELIVERY_TYPES = ["Express", "Standard", "Economy", "Same-Day", "Next-Day"];
const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Mobile Money", "Account Credit"];

function NewShipment() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => (await supabase.from("branches").select("id,name,city,country").order("name")).data ?? [],
  });

  const [f, setF] = useState({
    sender_name: "", sender_phone: "", sender_email: "", sender_country: "", sender_city: "", sender_address: "",
    receiver_name: "", receiver_phone: "", receiver_email: "", receiver_country: "", receiver_city: "", receiver_address: "",
    package_description: "", package_contents: "", quantity: 1, weight_kg: 0.5, delivery_type: "Express",
    origin_branch_id: "", destination_branch_id: "", destination_country: "", destination_city: "",
    departure_date: new Date().toISOString().slice(0, 10),
    expected_arrival_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    special_handling_note: "", declared_value: 0, insurance_required: false,
    registration_charge: 25, custom_clearance_charge: 0, insurance_fee: 0, handling_fee: 10, discount: 0,
    currency: "USD", payment_method: "Cash", payment_status: "pending" as "pending" | "paid" | "partial" | "refunded",
  });

  const total = useMemo(
    () => Number(f.registration_charge) + Number(f.custom_clearance_charge) + Number(f.insurance_fee) + Number(f.handling_fee) - Number(f.discount),
    [f.registration_charge, f.custom_clearance_charge, f.insurance_fee, f.handling_fee, f.discount],
  );

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const insertPayload = {
        sender_name: f.sender_name, sender_phone: f.sender_phone, sender_email: f.sender_email,
        sender_country: f.sender_country, sender_city: f.sender_city, sender_address: f.sender_address,
        receiver_name: f.receiver_name, receiver_phone: f.receiver_phone, receiver_email: f.receiver_email,
        receiver_country: f.receiver_country, receiver_city: f.receiver_city, receiver_address: f.receiver_address,
        package_description: f.package_description, package_contents: f.package_contents,
        quantity: Number(f.quantity), weight_kg: Number(f.weight_kg), delivery_type: f.delivery_type,
        origin_branch_id: f.origin_branch_id || null, destination_branch_id: f.destination_branch_id || null,
        destination_country: f.destination_country, destination_city: f.destination_city,
        departure_date: f.departure_date, expected_arrival_date: f.expected_arrival_date,
        special_handling_note: f.special_handling_note, declared_value: Number(f.declared_value),
        insurance_required: f.insurance_required,
        registration_charge: Number(f.registration_charge), custom_clearance_charge: Number(f.custom_clearance_charge),
        insurance_fee: Number(f.insurance_fee), handling_fee: Number(f.handling_fee), discount: Number(f.discount),
        total_amount: total, currency: f.currency, payment_method: f.payment_method, payment_status: f.payment_status,
        created_by: userRes.user?.id,
        // tracking + receipt auto-filled by trigger; pass empty placeholders
        tracking_number: "", receipt_number: "",
      };
      const { data, error } = await supabase.from("shipments").insert(insertPayload as never).select("id").single();
      if (error) throw error;
      toast.success("Shipment created");
      navigate({ to: "/receipt/$id", params: { id: data.id } });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-display text-2xl font-bold">New Shipment</h1>
      <p className="mt-1 text-sm text-muted-foreground">Fill in the details below. AWB number and receipt number are generated automatically.</p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <Section title="Sender Information">
          <Grid>
            <F label="Name *"><Input required value={f.sender_name} onChange={(e) => set("sender_name", e.target.value)} /></F>
            <F label="Phone"><Input value={f.sender_phone} onChange={(e) => set("sender_phone", e.target.value)} /></F>
            <F label="Email"><Input type="email" value={f.sender_email} onChange={(e) => set("sender_email", e.target.value)} /></F>
            <F label="Country"><Input value={f.sender_country} onChange={(e) => set("sender_country", e.target.value)} /></F>
            <F label="City"><Input value={f.sender_city} onChange={(e) => set("sender_city", e.target.value)} /></F>
            <F label="Address" full><Input value={f.sender_address} onChange={(e) => set("sender_address", e.target.value)} /></F>
          </Grid>
        </Section>

        <Section title="Receiver Information">
          <Grid>
            <F label="Name *"><Input required value={f.receiver_name} onChange={(e) => set("receiver_name", e.target.value)} /></F>
            <F label="Phone"><Input value={f.receiver_phone} onChange={(e) => set("receiver_phone", e.target.value)} /></F>
            <F label="Email"><Input type="email" value={f.receiver_email} onChange={(e) => set("receiver_email", e.target.value)} /></F>
            <F label="Country"><Input value={f.receiver_country} onChange={(e) => set("receiver_country", e.target.value)} /></F>
            <F label="City"><Input value={f.receiver_city} onChange={(e) => set("receiver_city", e.target.value)} /></F>
            <F label="Address" full><Input value={f.receiver_address} onChange={(e) => set("receiver_address", e.target.value)} /></F>
          </Grid>
        </Section>

        <Section title="Shipment Information">
          <Grid>
            <F label="Package Description" full><Input value={f.package_description} onChange={(e) => set("package_description", e.target.value)} /></F>
            <F label="Contents"><Input value={f.package_contents} onChange={(e) => set("package_contents", e.target.value)} /></F>
            <F label="Quantity"><Input type="number" min={1} value={f.quantity} onChange={(e) => set("quantity", Number(e.target.value))} /></F>
            <F label="Weight (kg)"><Input type="number" step="0.01" value={f.weight_kg} onChange={(e) => set("weight_kg", Number(e.target.value))} /></F>
            <F label="Delivery Type">
              <Select value={f.delivery_type} onValueChange={(v) => set("delivery_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DELIVERY_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Origin Branch">
              <Select value={f.origin_branch_id} onValueChange={(v) => set("origin_branch_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(branches ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Destination Branch">
              <Select value={f.destination_branch_id} onValueChange={(v) => set("destination_branch_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(branches ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name} ({b.city})</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Destination Country"><Input value={f.destination_country} onChange={(e) => set("destination_country", e.target.value)} /></F>
            <F label="Destination City"><Input value={f.destination_city} onChange={(e) => set("destination_city", e.target.value)} /></F>
            <F label="Departure Date"><Input type="date" value={f.departure_date} onChange={(e) => set("departure_date", e.target.value)} /></F>
            <F label="Expected Arrival Date"><Input type="date" value={f.expected_arrival_date} onChange={(e) => set("expected_arrival_date", e.target.value)} /></F>
            <F label="Declared Value"><Input type="number" step="0.01" value={f.declared_value} onChange={(e) => set("declared_value", Number(e.target.value))} /></F>
            <F label="Insurance Required">
              <div className="flex h-10 items-center gap-3"><Switch checked={f.insurance_required} onCheckedChange={(v) => set("insurance_required", v)} /><span className="text-sm text-muted-foreground">{f.insurance_required ? "Yes" : "No"}</span></div>
            </F>
            <F label="Special Handling Note" full><Textarea rows={2} value={f.special_handling_note} onChange={(e) => set("special_handling_note", e.target.value)} /></F>
          </Grid>
        </Section>

        <Section title="Payment Information">
          <Grid>
            <F label="Registration Charge"><Input type="number" step="0.01" value={f.registration_charge} onChange={(e) => set("registration_charge", Number(e.target.value))} /></F>
            <F label="Custom Clearance"><Input type="number" step="0.01" value={f.custom_clearance_charge} onChange={(e) => set("custom_clearance_charge", Number(e.target.value))} /></F>
            <F label="Insurance Fee"><Input type="number" step="0.01" value={f.insurance_fee} onChange={(e) => set("insurance_fee", Number(e.target.value))} /></F>
            <F label="Handling Fee"><Input type="number" step="0.01" value={f.handling_fee} onChange={(e) => set("handling_fee", Number(e.target.value))} /></F>
            <F label="Discount"><Input type="number" step="0.01" value={f.discount} onChange={(e) => set("discount", Number(e.target.value))} /></F>
            <F label="Currency"><Input value={f.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} /></F>
            <F label="Payment Method">
              <Select value={f.payment_method} onValueChange={(v) => set("payment_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </F>
            <F label="Payment Status">
              <Select value={f.payment_status} onValueChange={(v) => set("payment_status", v as typeof f.payment_status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </F>
            <div className="flex items-end md:col-span-2">
              <div className="rounded-lg border-2 border-pme-red/30 bg-pme-red/5 p-4 text-right">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Amount</div>
                <div className="text-display text-2xl font-bold text-pme-red">{f.currency} {total.toFixed(2)}</div>
              </div>
            </div>
          </Grid>
        </Section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/shipments" })}>Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create Shipment & Generate Receipt
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-card">
      <h2 className="mb-4 text-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div>; }
function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <div className={`space-y-1.5 ${full ? "md:col-span-2 lg:col-span-3" : ""}`}><Label>{label}</Label>{children}</div>;
}
