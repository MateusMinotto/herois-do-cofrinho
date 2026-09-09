import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, CheckCircle2, Clock, Coins, Gift, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useChildrenList, type ChildRow } from "@/lib/children";
import { categories } from "@/lib/mock-data";
import { useCurrentProfile, greeting, firstName } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/_app/pais")({
  head: () => ({ meta: [{ title: "Painel do Responsável — Heróis do Cofrinho" }] }),
  component: Pais,
});

function Pais() {
  const { data: profile } = useCurrentProfile();
  const { data: children = [], isLoading } = useChildrenList();
  const childIds = children.map((c) => c.id);

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", "all", childIds],
    enabled: childIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("tarefas").select("*").in("crianca_id", childIds);
      if (error) throw error;
      return data;
    },
  });
  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards", "all", childIds],
    enabled: childIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("recompensas").select("*").in("crianca_id", childIds);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (children.length === 0) {
    return (
      <Card className="mx-auto max-w-xl rounded-3xl border-2 border-dashed p-10 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-4xl">🦸</div>
        <h2 className="mt-4 font-display text-2xl font-black">Cadastre suas crianças</h2>
        <p className="mt-2 text-sm text-muted-foreground">Você precisa cadastrar pelo menos uma criança para começar a acompanhar.</p>
        <Button asChild variant="hero" size="lg" className="mt-5">
          <Link to="/criancas"><Users className="h-4 w-4" /> Gerenciar crianças</Link>
        </Button>
      </Card>
    );
  }

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "concluida").length;
  const pending = tasks.filter((t) => t.status !== "concluida").length;
  const pointsGiven = tasks.filter((t) => t.status === "concluida").reduce((s, t) => s + t.pontos, 0);
  const delivered = rewards.filter((r) => r.status === "Entregue").length;
  const requested = rewards.filter((r) => r.status === "Solicitado");

  const ranking = children
    .map((c) => ({ ...c, doneCount: tasks.filter((t) => t.crianca_id === c.id && t.status === "concluida").length }))
    .sort((a, b) => b.pontos - a.pontos);

  const byCat = categories
    .map((c) => ({ name: c.name, emoji: c.emoji, count: tasks.filter((t) => t.categoria === c.name).length }))
    .filter((x) => x.count > 0);
  const maxCat = Math.max(...byCat.map((c) => c.count), 1);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Painel do Responsável</p>
          <h1 className="font-display text-3xl font-black">
            👋 {greeting(profile?.genero)}, {firstName(profile?.nome_completo) || "Responsável"}!
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso, aprove tarefas e gerencie recompensas.</p>
        </div>
        <Button asChild variant="outline"><Link to="/criancas"><Users className="h-4 w-4" /> Gerenciar crianças</Link></Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPI label="Tarefas criadas" value={total} icon={<ListChecks className="h-5 w-5" />} tint="bg-primary text-primary-foreground" />
        <KPI label="Concluídas" value={done} icon={<CheckCircle2 className="h-5 w-5" />} tint="bg-gradient-success text-white" />
        <KPI label="Pendentes" value={pending} icon={<Clock className="h-5 w-5" />} tint="bg-warning text-warning-foreground" />
        <KPI label="Pontos distribuídos" value={pointsGiven} icon={<Coins className="h-5 w-5" />} tint="bg-gradient-coin text-coin-foreground" />
        <KPI label="Recompensas entregues" value={delivered} icon={<Gift className="h-5 w-5" />} tint="bg-gradient-fun text-fun-foreground" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-3xl border-2 p-6 shadow-card">
          <h2 className="font-display text-lg font-black mb-3">🏅 Ranking</h2>
          <ul className="space-y-2">
            {ranking.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-coin text-coin-foreground font-display font-black">{i + 1}</span>
                <span className="text-2xl">{c.avatar_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{c.nome}</p>
                  <p className="text-xs text-muted-foreground">{c.doneCount} tarefas · Nv {c.nivel}</p>
                </div>
                <span className="font-display font-black">{c.pontos} 🪙</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="rounded-3xl border-2 p-6 shadow-card lg:col-span-2">
          <h2 className="font-display text-lg font-black mb-3">📂 Tarefas por categoria</h2>
          {byCat.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
          ) : (
            <div className="space-y-2">
              {byCat.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{c.emoji} {c.name}</span>
                    <span>{c.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-hero" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="rounded-3xl border-2 p-6 shadow-card">
        <h2 className="font-display text-lg font-black mb-3">🎁 Recompensas aguardando aprovação</h2>
        {requested.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma recompensa pendente.</p>
        ) : (
          <ul className="divide-y">
            {requested.map((r) => {
              const c = children.find((x) => x.id === r.crianca_id);
              return (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{r.nome}</p>
                    <p className="text-xs text-muted-foreground">{c?.avatar_emoji} {c?.nome} · {r.pontos} pts</p>
                  </div>
                  <Button asChild size="sm" variant="hero">
                    <Link to="/recompensas">Revisar</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KPI({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: string }) {
  return (
    <Card className="rounded-3xl border-2 p-5 shadow-card">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-2xl ${tint}`}>{icon}</div>
      <p className="font-display text-3xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </Card>
  );
}
