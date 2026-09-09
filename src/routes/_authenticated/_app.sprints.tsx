import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { EmptyChildState } from "@/components/EmptyChildState";
import { useSelectedChild } from "@/lib/children";
import { formatWeekRange, type SprintRow, type TaskRow } from "@/lib/sprints";

export const Route = createFileRoute("/_authenticated/_app/sprints")({
  head: () => ({ meta: [{ title: "Histórico de Sprints — Heróis do Cofrinho" }] }),
  component: SprintsHistory,
});

function SprintsHistory() {
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;

  const { data: sprints = [] } = useQuery({
    queryKey: ["sprints", childId],
    enabled: !!childId,
    queryFn: async (): Promise<SprintRow[]> => {
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("crianca_id", childId!)
        .order("semana_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks-all", childId],
    enabled: !!childId,
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tarefas")
        .select("*")
        .eq("crianca_id", childId!);
      if (error) throw error;
      return data;
    },
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-black">🗓️ Histórico de Sprints</h1>
        <p className="text-sm text-muted-foreground">
          Cada sprint vai de <b>segunda a domingo</b>. Confira a evolução de {child.nome}.
        </p>
      </header>

      {sprints.length === 0 && (
        <Card className="rounded-3xl border-2 p-8 text-center text-muted-foreground">
          Nenhum sprint registrado ainda.
        </Card>
      )}

      <div className="grid gap-4">
        {sprints.map((s, i) => {
          const items = tasks.filter((t) => t.sprint_id === s.id);
          const done = items.filter((t) => t.status === "concluida" && t.aprovacao !== "rejeitada");
          const approved = items.filter((t) => t.aprovacao === "aprovada");
          const points = approved.reduce((sum, t) => sum + t.pontos, 0);
          const pct = items.length > 0 ? Math.round((done.length / items.length) * 100) : 0;
          const isCurrent = i === 0;
          return (
            <Card key={s.id} className={`rounded-3xl border-2 p-6 shadow-card ${isCurrent ? "border-primary" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-black">
                      Semana de {formatWeekRange(s.semana_inicio, s.semana_fim)}
                    </h2>
                    {isCurrent && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground uppercase">
                        Atual
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {items.length} tarefas · {done.length} concluídas · {points} pts creditados
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-black">{pct}%</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Progresso</div>
                </div>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-hero" style={{ width: `${pct}%` }} />
              </div>

              {items.length > 0 && (
                <ul className="mt-4 space-y-1.5 text-sm">
                  {items.slice(0, 6).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-1.5">
                      <span className="truncate">
                        {t.status === "concluida" ? "✅" : t.status === "fazendo" ? "⚡" : "📋"} {t.titulo}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-muted-foreground">
                        {t.frequencia} · {t.pontos} pts
                      </span>
                    </li>
                  ))}
                  {items.length > 6 && (
                    <li className="text-center text-xs text-muted-foreground">
                      + {items.length - 6} tarefa(s)
                    </li>
                  )}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
