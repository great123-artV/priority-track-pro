import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Truck,
  Users,
  Building2,
  UserCog,
  BarChart3,
  LogOut,
} from "lucide-react";
import { LogoLockup } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shipments", label: "Shipments", icon: Package },
  { to: "/shipments/new", label: "New Shipment", icon: PlusCircle },
  { to: "/movements", label: "Update Movement", icon: Truck },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/branches", label: "Branches", icon: Building2 },
  { to: "/staff", label: "Staff & Roles", icon: UserCog },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="border-b border-sidebar-border px-5 py-5">
        <LogoLockup variant="light" />
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-pme-red text-white shadow-elevated"
                  : "text-white/80 hover:bg-sidebar-accent hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-sidebar-accent hover:text-white"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
