import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyChildState } from "@/components/EmptyChildState";
import { useSelectedChild, type GoalRow } from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/metas")({
  head: () => ({ meta: [{ title: "Metas — Heróis do Cofrinho" }] }),
  component: Metas,
});

const GOAL_EMOJIS = ["🎯", "🚲", "⛸️", "📕", "🎮", "🎧", "📱", "🛹", "🎸", "🏀"];

function Metas() {
  const { role } = useCurrentUser();
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target: 100, due: "", emoji: "🎯" });

  const canManage = role === "responsavel" || role === "admin";

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", childId],
    enabled: !!childId,
    queryFn: async (): Promise<GoalRow[]> => {
      const { data, error } = await supabase.from("metas").select("*").eq("crianca_id", childId!).order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!childId) return;
      if (!form.name.trim()) throw new Error("Informe o nome.");
      const { error } = await supabase.from("metas").insert({
        crianca_id: childId,
        nome: form.name.trim(),
        alvo: Math.max(1, Number(form.target) || 1),
        prazo: form.due || null,
        emoji: form.emoji,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals", childId] });
      toast.success("Meta criada!");
      setOpen(false);
      setForm({ name: "", target: 100, due: "", emoji: "🎯" });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro."),
  });

  const updateCurrent = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      const { error } = await supabase.from("metas").update({ atual: Math.max(0, current) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", childId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("metas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", childId] }),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">🎯 Metas de {child.nome}</h1>
          <p className="text-sm text-muted-foreground">Defina sonhos e acompanhe o quanto falta.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg"><Plus className="h-4 w-4" /> Nova meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Bicicleta nova" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pontos alvo</Label>
                    <Input type="number" min={1} value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Prazo</Label>
                    <Input value={form.due} onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))} placeholder="Dezembro" />
                  </div>
                </div>
                <div>
                  <Label>Ícone</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {GOAL_EMOJIS.map((e) => (
                      <button key={e} type="button" onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                        className={`grid h-11 w-11 place-items-center rounded-2xl border-2 text-xl ${form.emoji === e ? "border-primary bg-primary/10" : "border-border bg-muted"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => create.mutate()} disabled={create.isPending}>
                  {create.isPending ? "Salvando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {goals.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed p-10 text-center">
          <p className="font-display text-lg font-black">Nenhuma meta criada.</p>
          <p className="text-sm text-muted-foreground">{canManage ? "Crie a primeira meta." : "Peça ao seu responsável para criar uma."}</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {goals.map((g) => {
            const pct = g.alvo > 0 ? Math.min(100, Math.round((g.atual / g.alvo) * 100)) : 0;
            const reais = (g.alvo * Number(child.valor_ponto)).toFixed(2).replace(".", ",");
            return (
              <Card key={g.id} className="overflow-hidden rounded-3xl border-2 p-0 shadow-card">
                <div className="flex items-center gap-5 bg-gradient-hero p-6 text-primary-foreground">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/20 text-5xl backdrop-blur">
                    <span className="animate-float">{g.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-2xl font-black truncate">{g.nome}</h3>
                    <p className="text-sm opacity-90">Objetivo: {g.prazo ?? "—"}</p>
                    <p className="text-xs opacity-80 mt-0.5">≈ R$ {reais}</p>
                  </div>
                  {canManage && (
                    <button onClick={() => remove.mutate(g.id)} className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between text-sm font-bold mb-1.5">
                    <span>{g.atual} / {g.alvo} pontos</span>
                    <span className="text-primary">{pct}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-coin rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Acumulado: <b className="text-foreground">{g.atual} pts</b></span>
                    <span className="text-muted-foreground">Faltam: <b className="text-fun">{Math.max(g.alvo - g.atual, 0)} pts</b></span>
                  </div>
                  {canManage && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateCurrent.mutate({ id: g.id, current: g.atual + 10 })}>+10 pts</Button>
                      <Button size="sm" variant="outline" onClick={() => updateCurrent.mutate({ id: g.id, current: g.atual - 10 })}>-10 pts</Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
