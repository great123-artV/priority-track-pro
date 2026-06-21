import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers — PME" }] }),
  component: Customers,
});

function Customers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await supabase.from("customers").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", email: "", country: "", city: "", address: "" });

  const save = async () => {
    if (!f.name) { toast.error("Name required"); return; }
    const { error } = await supabase.from("customers").insert(f);
    if (error) { toast.error(error.message); return; }
    toast.success("Customer added");
    setOpen(false); setF({ name: "", phone: "", email: "", country: "", city: "", address: "" });
    qc.invalidateQueries({ queryKey: ["customers"] });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground">Saved senders and receivers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90"><Plus className="mr-2 h-4 w-4" /> New Customer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {(["name", "phone", "email", "country", "city"] as const).map((k) => (
                <div key={k}><Label className="capitalize">{k}</Label><Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
              ))}
              <div className="md:col-span-2"><Label>Address</Label><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} className="bg-navy text-navy-foreground hover:bg-navy/90">Save</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3">Name</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Location</th></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{[c.city, c.country].filter(Boolean).join(", ")}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
