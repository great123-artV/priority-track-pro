import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDateTime, STATUS_LABELS, statusBadgeClass } from "@/lib/pme";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Priority Mail Express" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [
        { count: total },
        { count: todayCount },
        { count: inTransit },
        { count: delivered },
        { count: pending },
        { count: delayed },
        { data: revenueRow },
        { data: recent },
      ] = await Promise.all([
        supabase.from("shipments").select("*", { count: "exact", head: true }),
        supabase
          .from("shipments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", today.toISOString()),
        supabase
          .from("shipments")
          .select("*", { count: "exact", head: true })
          .in("current_status", [
            "in_transit",
            "dispatched_origin",
            "arrived_destination",
            "out_for_delivery",
          ]),
        supabase
          .from("shipments")
          .select("*", { count: "exact", head: true })
          .eq("current_status", "delivered"),
        supabase
          .from("shipments")
          .select("*", { count: "exact", head: true })
          .in("current_status", [
            "shipment_registered",
            "received_at_origin",
            "processing_sorting",
          ]),
        supabase
          .from("shipments")
          .select("*", { count: "exact", head: true })
          .eq("current_status", "delayed"),
        supabase.from("shipments").select("total_amount").eq("payment_status", "paid"),
        supabase
          .from("shipments")
          .select("id,tracking_number,sender_name,receiver_name,current_status,created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      const revenue = (revenueRow ?? []).reduce((a, r) => a + Number(r.total_amount ?? 0), 0);
      return {
        total: total ?? 0,
        todayCount: todayCount ?? 0,
        inTransit: inTransit ?? 0,
        delivered: delivered ?? 0,
        pending: pending ?? 0,
        delayed: delayed ?? 0,
        revenue,
        recent: recent ?? [],
      };
    },
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Live overview of all shipments and revenue.
          </p>
        </div>
        <Button asChild className="bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">
          <Link to="/shipments/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Shipment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Stat label="Total Shipments" value={stats?.total ?? 0} icon={<Package />} accent="navy" />
        <Stat
          label="Shipments Today"
          value={stats?.todayCount ?? 0}
          icon={<PlusCircle />}
          accent="red"
        />
        <Stat label="In Transit" value={stats?.inTransit ?? 0} icon={<Truck />} accent="navy" />
        <Stat
          label="Delivered"
          value={stats?.delivered ?? 0}
          icon={<CheckCircle2 />}
          accent="success"
        />
        <Stat label="Pending" value={stats?.pending ?? 0} icon={<Clock />} accent="navy" />
        <Stat
          label="Delayed"
          value={stats?.delayed ?? 0}
          icon={<AlertTriangle />}
          accent="warning"
        />
        <Stat
          label="Total Revenue"
          value={formatMoney(stats?.revenue ?? 0)}
          icon={<DollarSign />}
          accent="success"
          wide
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-display font-semibold">Recent Shipments</h2>
          <Link to="/shipments" className="text-sm text-pme-red hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3">Tracking</th>
                <th className="px-6 py-3">From → To</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 font-mono text-xs">
                    <Link to="/shipments/$id" params={{ id: r.id }} className="hover:text-pme-red">
                      {r.tracking_number}
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    {r.sender_name} → {r.receiver_name}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.current_status)}`}
                    >
                      {STATUS_LABELS[r.current_status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatDateTime(r.created_at)}
                  </td>
                </tr>
              ))}
              {(stats?.recent ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                    No shipments yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
  wide,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent: "navy" | "red" | "success" | "warning";
  wide?: boolean;
}) {
  const accentClass =
    accent === "red"
      ? "bg-pme-red/10 text-pme-red"
      : accent === "success"
        ? "bg-success/10 text-success"
        : accent === "warning"
          ? "bg-warning/15 text-warning-foreground"
          : "bg-navy/10 text-navy";
  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 shadow-card ${wide ? "lg:col-span-2" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-display text-2xl font-bold">{value}</div>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${accentClass}`}>{icon}</div>
      </div>
    </div>
  );
}
