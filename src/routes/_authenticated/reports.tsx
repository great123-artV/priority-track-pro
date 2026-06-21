import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { STATUS_LABELS, formatMoney } from "@/lib/pme";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — PME" }] }),
  component: Reports,
});

const COLORS = ["#0B1E3F", "#E1131D", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2"];

function Reports() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data: rows } = await supabase.from("shipments").select("created_at,current_status,total_amount,payment_status,origin_branch_id");
      const { data: branches } = await supabase.from("branches").select("id,name");
      return { rows: rows ?? [], branches: branches ?? [] };
    },
  });

  const rows = data?.rows ?? [];
  const branches = data?.branches ?? [];

  // Last 14 days
  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  rows.forEach((r) => {
    const k = new Date(r.created_at).toISOString().slice(0, 10);
    if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + 1);
  });
  const daily = Array.from(byDay.entries()).map(([day, count]) => ({ day: day.slice(5), count }));

  // By status
  const statusCounts = new Map<string, number>();
  rows.forEach((r) => statusCounts.set(r.current_status, (statusCounts.get(r.current_status) ?? 0) + 1));
  const statusData = Array.from(statusCounts.entries()).map(([k, v]) => ({ name: STATUS_LABELS[k as keyof typeof STATUS_LABELS] ?? k, value: v }));

  // By branch
  const branchMap = new Map(branches.map((b) => [b.id, b.name]));
  const byBranch = new Map<string, number>();
  rows.forEach((r) => {
    const n = r.origin_branch_id ? branchMap.get(r.origin_branch_id) ?? "Unknown" : "Unassigned";
    byBranch.set(n, (byBranch.get(n) ?? 0) + 1);
  });
  const branchData = Array.from(byBranch.entries()).map(([name, count]) => ({ name, count }));

  // Revenue
  const totalRevenue = rows.filter((r) => r.payment_status === "paid").reduce((a, r) => a + Number(r.total_amount), 0);
  const pendingRevenue = rows.filter((r) => r.payment_status === "pending").reduce((a, r) => a + Number(r.total_amount), 0);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-display text-2xl font-bold">Reports & Analytics</h1>
      <p className="text-sm text-muted-foreground">Real-time operations and revenue insights.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <KPI label="Total Shipments" value={rows.length} />
        <KPI label="Delivered" value={rows.filter((r) => r.current_status === "delivered").length} />
        <KPI label="Revenue (Paid)" value={formatMoney(totalRevenue)} />
        <KPI label="Outstanding" value={formatMoney(pendingRevenue)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Shipments — last 14 days">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={daily}>
              <XAxis dataKey="day" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#E1131D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="By Status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Branch Performance">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={branchData}>
              <XAxis dataKey="name" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#0B1E3F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Payment Summary">
          <div className="space-y-2 p-4 text-sm">
            <Row k="Paid" v={formatMoney(totalRevenue)} />
            <Row k="Pending" v={formatMoney(pendingRevenue)} />
            <Row k="Total Shipments Billed" v={String(rows.length)} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-display text-2xl font-bold">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-5 py-3 text-display font-semibold">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between border-b border-border/60 py-2"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>;
}
