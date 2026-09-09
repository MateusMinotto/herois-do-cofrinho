import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Shield, Users, Activity } from "lucide-react";
import { fetchPrimaryRole } from "@/lib/auth";
import { useCurrentProfile, greeting, firstName } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app/admin")({
  head: () => ({ meta: [{ title: "Administração — Heróis do Cofrinho" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const role = await fetchPrimaryRole(data.user.id);
    if (role !== "admin") {
      throw redirect({ to: role === "responsavel" ? "/pais" : "/" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: profile } = useCurrentProfile();
  const [counts, setCounts] = useState({ profiles: 0, parents: 0, children: 0, admins: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: profiles }, { data: roles }] = await Promise.all([
        supabase.from("perfis").select("*", { count: "exact", head: true }),
        supabase.from("usuario_papeis").select("papel"),
      ]);
      const r = roles ?? [];
      setCounts({
        profiles: profiles ?? 0,
        parents: r.filter((x) => x.papel === "responsavel").length,
        children: r.filter((x) => x.papel === "crianca").length,
        admins: r.filter((x) => x.papel === "admin").length,
      });
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex items-center gap-3">
        <div className="rounded-2xl bg-gradient-hero p-3 text-white shadow-pop">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Painel do Administrador</p>
          <h1 className="font-display text-3xl font-black">
            👋 {greeting(profile?.genero)}, {firstName(profile?.nome_completo) || "Admin"}!
          </h1>
          <p className="text-muted-foreground">Visão geral da plataforma</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={<Users className="h-5 w-5" />} label="Perfis" value={counts.profiles} />
        <KPI icon={<Activity className="h-5 w-5" />} label="Pais" value={counts.parents} />
        <KPI icon={<Activity className="h-5 w-5" />} label="Crianças" value={counts.children} />
        <KPI icon={<Shield className="h-5 w-5" />} label="Admins" value={counts.admins} />
      </div>

      <Card className="p-6">
        <h2 className="font-display text-xl font-bold mb-2">Olá, {firstName(profile?.nome_completo) || "admin"} 👋</h2>
        <p className="text-sm text-muted-foreground">
          Aqui você pode acompanhar a saúde da plataforma. Em breve, mais ferramentas de moderação,
          relatórios e suporte às famílias.
        </p>
      </Card>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="rounded-xl bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-black">{value}</div>
      </div>
    </Card>
  );
}
