import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/movements")({
  head: () => ({ meta: [{ title: "Update Movement — PME" }] }),
  component: MovementSearch,
});

function MovementSearch() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const { data } = await supabase.from("shipments").select("id").or(`tracking_number.eq.${code.trim()},receipt_number.eq.${code.trim()}`).maybeSingle();
    setBusy(false);
    if (!data) { toast.error("Shipment not found"); return; }
    navigate({ to: "/shipments/$id", params: { id: data.id } });
  };

  return (
    <div className="container mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-display text-2xl font-bold">Update Shipment Movement</h1>
      <p className="mt-1 text-sm text-muted-foreground">Search by tracking or receipt number to add a movement event.</p>
      <form onSubmit={search} className="mt-6 flex gap-2 rounded-xl border border-border bg-card p-3 shadow-card">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="PME-AWB-... or PME-RCP-..." className="h-11 pl-9" />
        </div>
        <Button type="submit" disabled={busy} className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">Find</Button>
      </form>
    </div>
  );
}
