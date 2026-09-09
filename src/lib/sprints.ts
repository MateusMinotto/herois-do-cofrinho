import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SprintRow = Database["public"]["Tables"]["sprints"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tarefas"]["Row"];

export const dateISO = (d: Date) => {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
};

export function currentWeek(now: Date = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Dom..6=Sáb
  const diffToMon = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
}

export function formatWeekRange(startISO: string, endISO: string) {
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(s)} – ${fmt(e)}`;
}

/** Ensures the child has a sprint for the current week (Mon–Sun),
 *  carries over unfinished tasks and recurring templates from the last sprint,
 *  and guarantees today's daily-task instances exist in "todo". */
export async function ensureSprintForChild(childId: string): Promise<SprintRow | null> {
  const { monday, sunday } = currentWeek();
  const weekStart = dateISO(monday);
  const weekEnd = dateISO(sunday);
  const today = dateISO(new Date());

  const existing = await supabase
    .from("sprints")
    .select("*")
    .eq("crianca_id", childId)
    .eq("semana_inicio", weekStart)
    .maybeSingle();

  let sprint: SprintRow | null = existing.data ?? null;

  if (!sprint) {
    const prev = await supabase
      .from("sprints")
      .select("*")
      .eq("crianca_id", childId)
      .lt("semana_inicio", weekStart)
      .order("semana_inicio", { ascending: false })
      .limit(1)
      .maybeSingle();

    const created = await supabase
      .from("sprints")
      .insert({ crianca_id: childId, semana_inicio: weekStart, semana_fim: weekEnd })
      .select("*")
      .single();
    if (created.error) throw created.error;
    sprint = created.data;

    if (prev.data) {
      const prevTasks = await supabase
        .from("tarefas")
        .select("*")
        .eq("sprint_id", prev.data.id);
      const list = prevTasks.data ?? [];

      const isFinished = (t: TaskRow) =>
        t.status === "concluida" &&
        (t.aprovacao === "aprovada" || t.aprovacao === "nao_requerido");

      const inserts: Array<Partial<TaskRow> & { crianca_id: string; titulo: string }> = [];
      const seenDaily = new Set<string>();
      const seenWeekly = new Set<string>();
      const seenMonthly = new Set<string>();

      for (const t of list) {
        if (t.frequencia === "Única") {
          if (isFinished(t)) continue;
          inserts.push({
            crianca_id: childId,
            sprint_id: sprint.id,
            titulo: t.titulo,
            categoria: t.categoria,
            pontos: t.pontos,
            frequencia: t.frequencia,
            status: "a_fazer",
            aprovacao: "nao_requerido",
            data_tarefa: weekStart,
          });
        } else if (t.frequencia === "Diária") {
          if (seenDaily.has(t.titulo)) continue;
          seenDaily.add(t.titulo);
          inserts.push({
            crianca_id: childId,
            sprint_id: sprint.id,
            titulo: t.titulo,
            categoria: t.categoria,
            pontos: t.pontos,
            frequencia: t.frequencia,
            status: "a_fazer",
            aprovacao: "nao_requerido",
            data_tarefa: today,
          });
        } else if (t.frequencia === "Semanal") {
          if (seenWeekly.has(t.titulo)) continue;
          seenWeekly.add(t.titulo);
          inserts.push({
            crianca_id: childId,
            sprint_id: sprint.id,
            titulo: t.titulo,
            categoria: t.categoria,
            pontos: t.pontos,
            frequencia: t.frequencia,
            status: "a_fazer",
            aprovacao: "nao_requerido",
            data_tarefa: weekStart,
          });
        } else if (t.frequencia === "Mensal") {
          if (seenMonthly.has(t.titulo)) continue;
          seenMonthly.add(t.titulo);
          inserts.push({
            crianca_id: childId,
            sprint_id: sprint.id,
            titulo: t.titulo,
            categoria: t.categoria,
            pontos: t.pontos,
            frequencia: t.frequencia,
            status: "a_fazer",
            aprovacao: "nao_requerido",
            data_tarefa: weekStart,
          });
        }
      }

      if (inserts.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("tarefas").insert(inserts as any);
      }
    }
  }

  // Ensure today's Diária instances exist
  const dailyRes = await supabase
    .from("tarefas")
    .select("*")
    .eq("sprint_id", sprint.id)
    .eq("frequencia", "Diária");
  const daily = dailyRes.data ?? [];
  const titlesToday = new Set(
    daily.filter((t) => t.data_tarefa === today).map((t) => t.titulo),
  );
  const templates = new Map<string, TaskRow>();
  for (const t of daily) {
    if (!templates.has(t.titulo)) templates.set(t.titulo, t);
  }
  const missing: Array<Partial<TaskRow> & { crianca_id: string; titulo: string }> = [];
  for (const [title, t] of templates) {
    if (titlesToday.has(title)) continue;
    missing.push({
      crianca_id: childId,
      sprint_id: sprint.id,
      titulo: t.titulo,
      categoria: t.categoria,
      pontos: t.pontos,
      frequencia: t.frequencia,
      status: "a_fazer",
      aprovacao: "nao_requerido",
      data_tarefa: today,
    });
  }
  if (missing.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("tarefas").insert(missing as any);
  }

  return sprint;
}
