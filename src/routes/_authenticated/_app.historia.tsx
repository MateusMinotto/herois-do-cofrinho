import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chapters } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedChild } from "@/lib/children";
import { EmptyChildState } from "@/components/EmptyChildState";
import { toast } from "sonner";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/_authenticated/_app/historia")({
  head: () => ({ meta: [{ title: "História do Dinheiro — Heróis do Cofrinho" }] }),
  component: Historia,
});

function Historia() {
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();

  const { data: progressRows = [] } = useQuery({
    queryKey: ["chapter_progress", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progresso_capitulos")
        .select("*")
        .eq("crianca_id", childId!);
      if (error) throw error;
      return data;
    },
  });

  const progressByChapter = new Map<number, number>();
  progressRows.forEach((r) => progressByChapter.set(r.capitulo_id, r.progresso));

  const markComplete = useMutation({
    mutationFn: async (chapterId: number) => {
      if (!childId) return;
      const { error } = await supabase
        .from("progresso_capitulos")
        .upsert(
          { crianca_id: childId, capitulo_id: chapterId, progresso: 100, concluido_em: new Date().toISOString() },
          { onConflict: "crianca_id,capitulo_id" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapter_progress", childId] });
      toast.success("Capítulo concluído! 📚");
    },
    onError: () => toast.error("Não foi possível salvar o progresso."),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  const total = chapters.length;
  const completed = chapters.filter((c) => (progressByChapter.get(c.id) ?? 0) === 100).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 sm:p-8 text-primary-foreground shadow-pop">
        <div className="absolute -bottom-6 -right-2 opacity-60">
          <img src={mascot} alt="" width={180} height={180} className="h-44 w-44 animate-float" />
        </div>
        <div className="relative max-w-lg">
          <p className="text-xs font-bold uppercase tracking-widest opacity-90">Jornada Educativa</p>
          <h1 className="font-display text-3xl sm:text-4xl font-black mt-1">A História do Dinheiro 📖</h1>
          <p className="mt-2 text-sm opacity-95">Descubra como o dinheiro foi inventado e evoluiu até o PIX!</p>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>{completed} de {total} capítulos</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-coin rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((c) => {
          const p = progressByChapter.get(c.id) ?? 0;
          return (
            <Card key={c.id} className="overflow-hidden rounded-3xl border-2 p-0 shadow-card hover:-translate-y-1 transition-transform">
              <div className="relative h-40 overflow-hidden bg-muted">
                <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute top-2 left-2 rounded-full bg-background/90 px-2.5 py-1 text-xs font-black backdrop-blur">
                  Capítulo {c.id}
                </div>
                {p === 100 && (
                  <div className="absolute top-2 right-2 rounded-full bg-success px-2.5 py-1 text-xs font-black text-white">✓ Concluído</div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-black">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.desc}</p>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-coin" style={{ width: `${p}%` }} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button asChild variant={p === 100 ? "outline" : "hero"} size="sm" className="flex-1">
                    <Link to="/quiz">{p === 100 ? "Revisar" : p > 0 ? "Continuar" : "Começar"}</Link>
                  </Button>
                  {p < 100 && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => markComplete.mutate(c.id)}
                      disabled={markComplete.isPending}
                    >
                      Concluir
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
