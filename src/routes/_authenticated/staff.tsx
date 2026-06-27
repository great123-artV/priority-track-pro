import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, formatDateTime } from "@/lib/pme";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [{ title: "Staff & Roles — PME" }] }),
  component: Staff,
});

function Staff() {
  const { data } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
      }));
    },
  });

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-display text-2xl font-bold">Staff & Roles</h1>
        <p className="text-sm text-muted-foreground">
          All registered staff accounts. First user becomes Super Admin automatically.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Roles</th>
              <th className="px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-5 py-3 font-medium">{u.full_name || "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${r === "super_admin" ? "border-pme-red/30 bg-pme-red/10 text-pme-red" : "border-navy/20 bg-navy/10 text-navy"}`}
                      >
                        {ROLE_LABELS[r]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{formatDateTime(u.created_at)}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                  No staff yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
