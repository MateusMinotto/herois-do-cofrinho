import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { EmptyChildState } from "@/components/EmptyChildState";
import { useSelectedChild, type AchievementRow } from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/conquistas")({
  head: () => ({ meta: [{ title: "Conquistas — Heróis do Cofrinho" }] }),
  component: Conquistas,
});

function Conquistas() {
  const { role } = useCurrentUser();
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();
  const canManage = role === "responsavel" || role === "admin";

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", childId],
    enabled: !!childId,
    queryFn: async (): Promise<AchievementRow[]> => {
      const { data, error } = await supabase.from("conquistas").select("*").eq("crianca_id", childId!).order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async (a: AchievementRow) => {
      const earned = !a.conquistada;
      const { error } = await supabase
        .from("conquistas")
        .update({ conquistada: earned, conquistada_em: earned ? new Date().toISOString() : null })
        .eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["achievements", childId] }),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  const earned = achievements.filter((a) => a.conquistada).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black">🏆 Conquistas de {child.nome}</h1>
        <p className="text-sm text-muted-foreground">{earned} de {achievements.length} medalhas conquistadas</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => (
          <Card
            key={a.id}
            onClick={() => canManage && toggle.mutate(a)}
            className={`rounded-3xl border-2 p-6 text-center shadow-card transition-transform hover:-translate-y-1 ${canManage ? "cursor-pointer" : ""} ${a.conquistada ? "" : "opacity-60 grayscale"}`}
          >
            <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-6xl ${a.conquistada ? "bg-gradient-coin" : "bg-muted"}`}>
              <span className="animate-float">{a.emoji}</span>
            </div>
            <h3 className="mt-3 font-display text-lg font-black">{a.nome}</h3>
            <p className="text-xs text-muted-foreground">{a.descricao}</p>
            {a.conquistada && a.conquistada_em && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-success">
                Conquistada em {new Date(a.conquistada_em).toLocaleDateString("pt-BR")}
              </p>
            )}
            {canManage && (
              <p className="mt-2 text-[10px] text-muted-foreground">Clique para {a.conquistada ? "remover" : "conceder"}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
