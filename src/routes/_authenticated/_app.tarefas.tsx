import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyChildState } from "@/components/EmptyChildState";
import { useSelectedChild, type TaskRow } from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";
import { categories } from "@/lib/mock-data";
import {
  ensureSprintForChild,
  currentWeek,
  dateISO,
  formatWeekRange,
} from "@/lib/sprints";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["status_tarefa"];
type TaskFrequency = Database["public"]["Enums"]["frequencia_tarefa"];

export const Route = createFileRoute("/_authenticated/_app/tarefas")({
  head: () => ({ meta: [{ title: "Minhas Tarefas — Heróis do Cofrinho" }] }),
  component: Tarefas,
});

const columns: { key: TaskStatus; label: string; emoji: string; tint: string }[] = [
  { key: "a_fazer", label: "A Fazer", emoji: "📋", tint: "bg-primary/10 border-primary/30" },
  { key: "fazendo", label: "Fazendo", emoji: "⚡", tint: "bg-warning/15 border-warning/40" },
  { key: "concluida", label: "Concluída", emoji: "✅", tint: "bg-success/15 border-success/40" },
];

function catEmoji(name: string) {
  return categories.find((c) => c.name === name)?.emoji ?? "📌";
}

function Tarefas() {
  const { role } = useCurrentUser();
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: categories[0].name,
    points: 10,
    frequency: "Única" as TaskFrequency,
    task_date: dateISO(new Date()),
  });

  const canManage = role === "responsavel" || role === "admin";

  // Ensure current sprint exists whenever a child is loaded.
  useEffect(() => {
    if (!childId) return;
    ensureSprintForChild(childId)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["tasks", childId] });
        qc.invalidateQueries({ queryKey: ["current-sprint", childId] });
      })
      .catch((e) => console.error("ensureSprint", e));
  }, [childId, qc]);

  const { data: sprint } = useQuery({
    queryKey: ["current-sprint", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { monday } = currentWeek();
      const { data } = await supabase
        .from("sprints")
        .select("*")
        .eq("crianca_id", childId!)
        .eq("semana_inicio", dateISO(monday))
        .maybeSingle();
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", childId, sprint?.id],
    enabled: !!childId && !!sprint?.id,
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tarefas")
        .select("*")
        .eq("crianca_id", childId!)
        .eq("sprint_id", sprint!.id)
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  /** Handles kanban moves with approval workflow. */
  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || task.status === status) return;
      if (!child) return;

      const wasApproved = task.status === "concluida" && task.aprovacao === "aprovada";

      let nextApproval = task.aprovacao;
      let delta = 0;

      if (status === "concluida" && task.status !== "concluida") {
        // Entering "concluida" → pending review (unless parent/admin, who auto-approves)
        if (canManage) {
          nextApproval = "aprovada";
          delta = task.pontos;
        } else {
          nextApproval = "pendente";
        }
      } else if (status !== "concluida" && task.status === "concluida") {
        // Leaving "concluida" → resets approval; refund if previously approved
        if (wasApproved) delta = -task.pontos;
        nextApproval = "nao_requerido";
      }

      const { error } = await supabase
        .from("tarefas")
        .update({ status, aprovacao: nextApproval })
        .eq("id", id);
      if (error) throw error;

      if (delta !== 0) {
        await supabase
          .from("criancas")
          .update({
            pontos: Math.max(0, child.pontos + delta),
            xp: Math.max(0, child.xp + delta),
          })
          .eq("id", child.id);
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", childId] });
      qc.invalidateQueries({ queryKey: ["children"] });
      if (vars.status === "concluida") {
        toast.success(
          canManage
            ? "🎉 Pontos adicionados ao cofrinho!"
            : "✔️ Tarefa enviada para aprovação do responsável.",
        );
      }
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const approve = useMutation({
    mutationFn: async ({ id, ok }: { id: string; ok: boolean }) => {
      const task = tasks.find((t) => t.id === id);
      if (!task || !child) return;
      if (ok) {
        const { error } = await supabase
          .from("tarefas")
          .update({ aprovacao: "aprovada" })
          .eq("id", id);
        if (error) throw error;
        await supabase
          .from("criancas")
          .update({
            pontos: Math.max(0, child.pontos + task.pontos),
            xp: Math.max(0, child.xp + task.pontos),
          })
          .eq("id", child.id);
      } else {
        const { error } = await supabase
          .from("tarefas")
          .update({ status: "fazendo", aprovacao: "rejeitada" })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", childId] });
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success(vars.ok ? "🎉 Aprovada e pontos creditados!" : "↩️ Devolvida para Fazendo.");
    },
    onError: () => toast.error("Não foi possível avaliar a tarefa."),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!childId || !sprint) return;
      const title = form.title.trim();
      if (!title) throw new Error("Informe o título.");
      const { monday } = currentWeek();
      const weekStart = dateISO(monday);
      let taskDate = form.task_date || dateISO(new Date());
      if (form.frequency === "Semanal" || form.frequency === "Mensal") taskDate = weekStart;
      const { error } = await supabase.from("tarefas").insert({
        crianca_id: childId,
        sprint_id: sprint.id,
        titulo: title,
        categoria: form.category,
        pontos: Math.max(1, Number(form.points) || 1),
        frequencia: form.frequency,
        data_tarefa: taskDate,
        aprovacao: "nao_requerido",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", childId] });
      toast.success("Tarefa criada!");
      setOpen(false);
      setForm({
        title: "",
        category: categories[0].name,
        points: 10,
        frequency: "Única",
        task_date: dateISO(new Date()),
      });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tarefas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", childId] }),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">Missões de {child.nome} ⚡</h1>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Crie missões e aprove as conclusões. A criança pode arrastar os cartões ou usar as setas ◀ ▶."
              : "Arraste os cartões ou toque nas setas ◀ ▶. Ao concluir, o responsável aprova para creditar os pontos."}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary">
            💰 Cada ponto vale R$ {child.valor_ponto.toFixed(2).replace(".", ",")} no seu cofrinho.
            {sprint && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5">
                🗓️ Sprint atual: {formatWeekRange(sprint.semana_inicio, sprint.semana_fim)}
              </span>
            )}
          </p>
        </div>

        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg"><Plus className="h-4 w-4" /> Nova tarefa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova tarefa</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Arrumar a cama" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Frequência</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.frequency}
                      onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as TaskFrequency }))}
                    >
                      {(["Única","Diária","Semanal","Mensal"] as TaskFrequency[]).map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Pontos</Label>
                    <Input type="number" min={1} value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))} />
                  </div>
                  <div>
                    <Label>
                      Data{" "}
                      {form.frequency === "Semanal" || form.frequency === "Mensal"
                        ? "(início da semana)"
                        : ""}
                    </Label>
                    <Input
                      type="date"
                      value={
                        form.frequency === "Semanal" || form.frequency === "Mensal"
                          ? dateISO(currentWeek().monday)
                          : form.task_date
                      }
                      disabled={form.frequency === "Semanal" || form.frequency === "Mensal"}
                      onChange={(e) => setForm((f) => ({ ...f, task_date: e.target.value }))}
                    />
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

      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dragId && move.mutate({ id: dragId, status: col.key })}
              className={`rounded-3xl border-2 border-dashed ${col.tint} p-4 min-h-[400px]`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="font-display font-black flex items-center gap-2">
                  <span className="text-xl">{col.emoji}</span> {col.label}
                </h2>
                <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-bold shadow-sm">{items.length}</span>
              </div>

              <div className="space-y-3">
                {items.map((t) => {
                  const idx = columns.findIndex((c) => c.key === col.key);
                  const prev = idx > 0 ? columns[idx - 1].key : null;
                  const next = idx < columns.length - 1 ? columns[idx + 1].key : null;
                  const isPending = col.key === "concluida" && t.aprovacao === "pendente";
                  const isApproved = col.key === "concluida" && t.aprovacao === "aprovada";
                  const isRejected = t.aprovacao === "rejeitada";
                  return (
                  <Card
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    className="group cursor-grab active:cursor-grabbing rounded-2xl border-2 p-4 shadow-card hover:-translate-y-0.5 transition-transform bg-card touch-manipulation"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-2xl">
                        {catEmoji(t.categoria)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-tight">{t.titulo}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t.categoria}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 font-semibold">{t.frequencia}</span>
                          {t.data_tarefa && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                              📅 {new Date(t.data_tarefa + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {isPending && (
                            <span className="rounded-full bg-warning/25 px-2 py-0.5 font-semibold text-warning-foreground">
                              <Clock className="inline h-3 w-3" /> Aguardando aprovação
                            </span>
                          )}
                          {isApproved && (
                            <span className="rounded-full bg-success/20 px-2 py-0.5 font-semibold text-success-foreground">
                              ✔ Aprovada
                            </span>
                          )}
                          {isRejected && col.key !== "concluida" && (
                            <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-semibold text-destructive">
                              ✖ Rejeitada — refaça
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-gradient-coin px-2.5 py-0.5 text-xs font-black text-coin-foreground self-center">+{t.pontos}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!prev || move.isPending}
                          onClick={() => prev && move.mutate({ id: t.id, status: prev })}
                          aria-label="Mover para coluna anterior"
                          className="h-8 px-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!next || move.isPending}
                          onClick={() => next && move.mutate({ id: t.id, status: next })}
                          aria-label="Mover para próxima coluna"
                          className="h-8 px-2"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => remove.mutate(t.id)}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                      )}
                    </div>

                    {canManage && isPending && (
                      <div className="mt-3 flex gap-2 border-t pt-3">
                        <Button
                          type="button"
                          variant="success"
                          size="sm"
                          className="flex-1"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate({ id: t.id, ok: true })}
                        >
                          <Check className="h-4 w-4" /> OK, aprovar
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          disabled={approve.isPending}
                          onClick={() => approve.mutate({ id: t.id, ok: false })}
                        >
                          <X className="h-4 w-4" /> Não OK
                        </Button>
                      </div>
                    )}
                  </Card>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Solte aqui</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
