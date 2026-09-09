import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PiggyBank } from "@/components/PiggyBank";
import { EmptyChildState } from "@/components/EmptyChildState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedChild } from "@/lib/children";
import { categories, levels } from "@/lib/mock-data";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/_authenticated/_app/")({
  head: () => ({
    meta: [
      { title: "Heróis do Cofrinho — Meu Mundo" },
      { name: "description", content: "Aprenda sobre dinheiro brincando, complete missões e ganhe recompensas." },
    ],
  }),
  component: Home,
});

function Home() {
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase.from("tarefas").select("*").eq("crianca_id", childId!);
      if (error) throw error;
      return data;
    },
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase.from("metas").select("*").eq("crianca_id", childId!);
      if (error) throw error;
      return data;
    },
  });
  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase.from("conquistas").select("*").eq("crianca_id", childId!);
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  const xpPct = child.xp_proximo_nivel > 0 ? Math.round((child.xp / child.xp_proximo_nivel) * 100) : 0;
  const pendentes = tasks.filter((t) => t.status !== "concluida").length;
  const earned = achievements.filter((a) => a.conquistada);
  const nextLevelName = levels[child.nivel] ?? "Lenda";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 sm:p-8 text-primary-foreground shadow-pop">
        <div className="absolute -bottom-10 -right-6 opacity-30 sm:opacity-90">
          <img src={mascot} alt="Capitão Cofrinho" width={220} height={220} className="h-40 w-40 sm:h-56 sm:w-56 animate-float drop-shadow-2xl" />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Capitão Cofrinho diz:</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-black drop-shadow">
            {String(child.genero ?? "").toUpperCase().startsWith("F") ? "Bem-vinda" : "Bem-vindo"} de volta, {child.nome}! 🎉
          </h1>
          <p className="mt-2 text-sm sm:text-base opacity-95">
            Você tem <b>{pendentes} missões</b> esperando. Vamos juntos virar herói da economia?
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="coin" size="lg">
              <Link to="/tarefas">⚡ Ver missões</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/15 border-white/40 text-white hover:bg-white/25 hover:text-white">
              <Link to="/historia">📖 História do Dinheiro</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <PiggyBank points={child.pontos} pointValue={Number(child.valor_ponto)} goal={500} />

        <Card className="rounded-3xl p-6 shadow-card border-2">
          <div className="flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-3xl">
              {child.avatar_emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nível {child.nivel}</p>
              <h3 className="font-display text-xl font-black truncate">{child.nivel_nome}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Próximo: {nextLevelName}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>XP</span>
              <span>{child.xp} / {child.xp_proximo_nivel}</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-hero rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
          <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {levels.map((l, i) => (
              <div
                key={l}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  i + 1 <= child.nivel ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-3xl p-6 shadow-card border-2 bg-gradient-success text-white">
          <p className="text-xs font-bold uppercase tracking-wide opacity-90">Conquistas</p>
          <p className="font-display text-5xl font-black drop-shadow">
            {earned.length}
            <span className="text-2xl opacity-80">/{achievements.length}</span>
          </p>
          <p className="text-sm font-semibold opacity-95">medalhas conquistadas</p>
          <div className="mt-4 flex gap-2">
            {earned.slice(0, 4).map((a) => (
              <div key={a.id} title={a.nome} className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xl animate-bounce-in">
                {a.emoji}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-black">🎯 Suas Metas</h2>
          <Link to="/metas" className="text-sm font-bold text-primary hover:underline">Ver todas</Link>
        </div>
        {goals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma meta criada ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {goals.slice(0, 3).map((g) => {
              const pct = g.alvo > 0 ? Math.round((g.atual / g.alvo) * 100) : 0;
              return (
                <Card key={g.id} className="rounded-2xl p-5 shadow-card border-2 hover:-translate-y-1 transition-transform">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{g.emoji}</div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold truncate">{g.nome}</h3>
                      <p className="text-xs text-muted-foreground">{g.prazo}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>{g.atual} pts</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-gradient-coin rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Faltam {Math.max(g.alvo - g.atual, 0)} pontos</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-black">⚡ Missões de hoje</h2>
          <Link to="/tarefas" className="text-sm font-bold text-primary hover:underline">Ver kanban</Link>
        </div>
        {tasks.filter((t) => t.status !== "concluida").length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma missão pendente. 🎉</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {tasks.filter((t) => t.status !== "concluida").slice(0, 4).map((t) => {
              const cat = categories.find((c) => c.name === t.categoria);
              return (
                <Card key={t.id} className="flex items-center gap-3 rounded-2xl border-2 p-4 shadow-card hover:-translate-y-0.5 transition-transform">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-2xl">
                    {cat?.emoji ?? "📌"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground">{t.categoria} · {t.frequencia}</p>
                  </div>
                  <div className="shrink-0 rounded-full bg-gradient-coin px-3 py-1 text-xs font-black text-coin-foreground">+{t.pontos}</div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
