import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/branches")({
  head: () => ({ meta: [{ title: "Branches — PME" }] }),
  component: Branches,
});

function Branches() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => (await supabase.from("branches").select("*").order("name")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    country: "",
    city: "",
    address: "",
    manager_name: "",
    phone: "",
    status: "active",
  });

  const save = async () => {
    if (!f.name || !f.country || !f.city) {
      toast.error("Name, country, and city required");
      return;
    }
    const { error } = await supabase.from("branches").insert(f);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Branch added");
    setOpen(false);
    setF({
      name: "",
      country: "",
      city: "",
      address: "",
      manager_name: "",
      phone: "",
      status: "active",
    });
    qc.invalidateQueries({ queryKey: ["branches"] });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl font-bold">Branches</h1>
          <p className="text-sm text-muted-foreground">Network of PME branches and hubs.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
              <Plus className="mr-2 h-4 w-4" /> New Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Branch</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              {(["name", "country", "city", "manager_name", "phone"] as const).map((k) => (
                <div key={k}>
                  <Label className="capitalize">{k.replace("_", " ")}</Label>
                  <Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
                </div>
              ))}
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={f.address}
                  onChange={(e) => setF({ ...f, address: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} className="bg-navy text-navy-foreground hover:bg-navy/90">
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((b) => (
          <div key={b.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy/10 text-navy">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                {b.status}
              </span>
            </div>
            <div className="text-display text-lg font-semibold">{b.name}</div>
            <div className="text-sm text-muted-foreground">
              {b.city}, {b.country}
            </div>
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {b.address && <div>{b.address}</div>}
              {b.manager_name && <div>Manager: {b.manager_name}</div>}
              {b.phone && <div>{b.phone}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
