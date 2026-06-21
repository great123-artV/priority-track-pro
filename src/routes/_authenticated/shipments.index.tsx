import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Receipt as ReceiptIcon } from "lucide-react";
import { STATUS_LABELS, statusBadgeClass, formatDateTime } from "@/lib/pme";

export const Route = createFileRoute("/_authenticated/shipments/")({
  head: () => ({ meta: [{ title: "Shipments — Priority Mail Express" }] }),
  component: ShipmentsList,
});

function ShipmentsList() {
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["shipments", q],
    queryFn: async () => {
      let query = supabase.from("shipments").select("*").order("created_at", { ascending: false }).limit(100);
      if (q) query = query.or(`tracking_number.ilike.%${q}%,receipt_number.ilike.%${q}%,sender_name.ilike.%${q}%,receiver_name.ilike.%${q}%`);
      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-bold">Shipments</h1>
          <p className="text-sm text-muted-foreground">All shipments across branches.</p>
        </div>
        <Button asChild className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"><Link to="/shipments/new"><PlusCircle className="mr-2 h-4 w-4" /> New Shipment</Link></Button>
      </div>

      <div className="mb-4 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tracking, receipt, sender, receiver…" className="pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Tracking</th>
              <th className="px-5 py-3">Sender → Receiver</th>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3 font-mono text-xs">
                  <Link to="/shipments/$id" params={{ id: s.id }} className="hover:text-pme-red">{s.tracking_number}</Link>
                  <div className="text-[10px] text-muted-foreground">{s.receipt_number}</div>
                </td>
                <td className="px-5 py-3">{s.sender_name} → {s.receiver_name}</td>
                <td className="px-5 py-3 text-muted-foreground">{s.sender_city} → {s.destination_city}, {s.destination_country}</td>
                <td className="px-5 py-3"><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(s.current_status)}`}>{STATUS_LABELS[s.current_status]}</span></td>
                <td className="px-5 py-3 text-muted-foreground">{formatDateTime(s.created_at)}</td>
                <td className="px-5 py-3 text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/receipt/$id" params={{ id: s.id }}><ReceiptIcon className="mr-1 h-3.5 w-3.5" /> Receipt</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No shipments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
