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
import { useSelectedChild, type RewardRow } from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";
import type { Database } from "@/integrations/supabase/types";

type RewardStatus = Database["public"]["Enums"]["status_recompensa"];

export const Route = createFileRoute("/_authenticated/_app/recompensas")({
  head: () => ({ meta: [{ title: "Recompensas — Heróis do Cofrinho" }] }),
  component: Recompensas,
});

function statusBadge(s: string) {
  if (s === "Ativo") return "bg-primary/15 text-primary";
  if (s === "Solicitado") return "bg-warning/20 text-warning-foreground";
  return "bg-success/15 text-success";
}

const REWARD_EMOJIS = ["🎮", "🍦", "🎬", "🧸", "🍕", "📚", "🎨", "🚲", "⚽", "🎁"];

function Recompensas() {
  const { role } = useCurrentUser();
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", points: 50, emoji: "🎁" });

  const canManage = role === "responsavel" || role === "admin";

  const { data: rewards = [] } = useQuery({
    queryKey: ["rewards", childId],
    enabled: !!childId,
    queryFn: async (): Promise<RewardRow[]> => {
      const { data, error } = await supabase.from("recompensas").select("*").eq("crianca_id", childId!).order("criado_em");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!childId) return;
      const name = form.name.trim();
      if (!name) throw new Error("Informe o nome.");
      const { error } = await supabase.from("recompensas").insert({
        crianca_id: childId,
        nome: name,
        pontos: Math.max(1, Number(form.points) || 1),
        emoji: form.emoji,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards", childId] });
      toast.success("Recompensa criada!");
      setOpen(false);
      setForm({ name: "", points: 50, emoji: "🎁" });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro."),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, pointsCost }: { id: string; status: RewardStatus; pointsCost?: number }) => {
      const { error } = await supabase.from("recompensas").update({ status }).eq("id", id);
      if (error) throw error;
      if (pointsCost && child) {
        await supabase.from("criancas").update({ pontos: Math.max(0, child.pontos - pointsCost) }).eq("id", child.id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rewards", childId] });
      qc.invalidateQueries({ queryKey: ["children"] });
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recompensas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rewards", childId] }),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">🎁 Recompensas de {child.nome}</h1>
          <p className="text-sm text-muted-foreground">Use pontos em prêmios cadastrados pelos pais.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-coin px-4 py-2 text-coin-foreground shadow-pop">
            <span className="text-xs font-bold uppercase tracking-wide">Saldo</span>
            <p className="font-display text-2xl font-black leading-none">{child.pontos} 🪙</p>
          </div>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" size="lg"><Plus className="h-4 w-4" /> Nova</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nova recompensa</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: 1 hora de videogame" />
                  </div>
                  <div>
                    <Label>Pontos</Label>
                    <Input type="number" min={1} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>Ícone</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {REWARD_EMOJIS.map((e) => (
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
      </div>

      {rewards.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed p-10 text-center">
          <p className="font-display text-lg font-black">Nenhuma recompensa cadastrada.</p>
          <p className="text-sm text-muted-foreground">{canManage ? "Crie a primeira para começar." : "Peça aos seus pais para cadastrar uma."}</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r) => {
            const canAfford = child.pontos >= r.pontos;
            return (
              <Card key={r.id} className="rounded-3xl border-2 p-5 shadow-card hover:-translate-y-1 transition-transform">
                <div className="grid h-32 place-items-center rounded-2xl bg-gradient-fun text-7xl shadow-coin">
                  <span className="animate-float">{r.emoji}</span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-black leading-tight">{r.nome}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(r.status)}`}>{r.status}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="rounded-full bg-gradient-coin px-3 py-1 text-coin-foreground text-sm font-black">{r.pontos} 🪙</div>
                  <div className="flex gap-1">
                    {r.status === "Ativo" && (
                      <Button
                        variant={canAfford ? "hero" : "outline"}
                        size="sm"
                        disabled={!canAfford}
                        onClick={() => updateStatus.mutate({ id: r.id, status: "Solicitado" })}
                      >
                        {canAfford ? "Resgatar" : "Faltam pts"}
                      </Button>
                    )}
                    {r.status === "Solicitado" && canManage && (
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: r.id, status: "Entregue", pointsCost: r.pontos })}
                      >
                        Entregar
                      </Button>
                    )}
                    {r.status === "Solicitado" && !canManage && (
                      <Button variant="outline" size="sm" disabled>Aguardando</Button>
                    )}
                    {r.status === "Entregue" && (
                      <Button variant="outline" size="sm" disabled>Resgatada</Button>
                    )}
                    {canManage && (
                      <Button variant="outline" size="icon" onClick={() => remove.mutate(r.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
