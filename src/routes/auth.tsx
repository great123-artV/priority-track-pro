import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoLockup } from "@/components/Logo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Staff Login — Priority Mail Express" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: name },
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/dashboard" : undefined,
          },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setTab("signin");
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-gradient-hero p-12 text-white md:flex md:flex-col md:justify-between">
        <LogoLockup variant="light" />
        <div className="space-y-3">
          <h1 className="text-display text-4xl font-bold">Staff Portal</h1>
          <p className="max-w-md text-white/80">
            Sign in to create shipments, generate QR receipts, update movement, and manage
            customers and branches.
          </p>
        </div>
        <div className="text-xs text-white/50">© Priority Mail Express · International Special Delivery</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-elevated">
          <div className="mb-6 md:hidden"><LogoLockup /></div>
          <h2 className="text-display text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access the PME control panel.</p>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6"><form onSubmit={submit} className="space-y-4">
              <Field label="Email"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@prioritymailexpress.com" /></Field>
              <Field label="Password"><Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
              <Button type="submit" disabled={loading} className="w-full bg-pme-red text-pme-red-foreground hover:bg-pme-red/90">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}</Button>
            </form></TabsContent>
            <TabsContent value="signup" className="mt-6"><form onSubmit={submit} className="space-y-4">
              <Field label="Full Name"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Email"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="Password"><Input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
              <Button type="submit" disabled={loading} className="w-full bg-navy text-navy-foreground hover:bg-navy/90">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}</Button>
              <p className="text-xs text-muted-foreground">First registered user becomes Super Admin automatically.</p>
            </form></TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
