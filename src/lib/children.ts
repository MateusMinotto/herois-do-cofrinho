import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ChildRow = Database["public"]["Tables"]["criancas"]["Row"];
export type TaskRow = Database["public"]["Tables"]["tarefas"]["Row"];
export type RewardRow = Database["public"]["Tables"]["recompensas"]["Row"];
export type GoalRow = Database["public"]["Tables"]["metas"]["Row"];
export type AchievementRow = Database["public"]["Tables"]["conquistas"]["Row"];

export interface AvatarConfig {
  hair?: number;
  outfit?: number;
  color?: number;
  acc?: number;
}

const STORAGE_KEY = "hc.selectedChildId";

export function getStoredChildId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
export function setStoredChildId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("hc:selectedChildChanged"));
}

export function useChildrenList() {
  return useQuery({
    queryKey: ["children"],
    queryFn: async (): Promise<ChildRow[]> => {
      const { data, error } = await supabase
        .from("criancas")
        .select("*")
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Resolves the currently selected child for the active user.
 *  - Child users: forced to their own child row.
 *  - Parents/admins: respects localStorage selection (defaults to first child). */
export function useSelectedChildId(): {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  children: ChildRow[];
  loading: boolean;
} {
  const { data: children = [], isLoading } = useChildrenList();
  const [stored, setStored] = useState<string | null>(() => getStoredChildId());

  useEffect(() => {
    const handler = () => setStored(getStoredChildId());
    window.addEventListener("hc:selectedChildChanged", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("hc:selectedChildChanged", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setSelectedId = useCallback((id: string | null) => {
    setStoredChildId(id);
    setStored(id);
  }, []);

  let selectedId: string | null = null;
  if (children.length > 0) {
    if (stored && children.some((c) => c.id === stored)) selectedId = stored;
    else selectedId = children[0].id;
  }

  return { selectedId, setSelectedId, children, loading: isLoading };
}

export function useSelectedChild() {
  const { selectedId, children, loading, setSelectedId } = useSelectedChildId();
  const child = children.find((c) => c.id === selectedId) ?? null;
  return { child, selectedId, children, loading, setSelectedId };
}

/** Seed default achievements for a new child. */
export const DEFAULT_ACHIEVEMENTS = [
  { codigo: "first_mission", nome: "Primeira Missão", descricao: "Primeira tarefa concluída", emoji: "🎯" },
  { codigo: "money_reader", nome: "Leitor Financeiro", descricao: "Concluir História do Dinheiro", emoji: "📚" },
  { codigo: "quiz_master", nome: "Especialista em Dinheiro", descricao: "100% no Quiz", emoji: "🧠" },
  { codigo: "organized", nome: "Super Organizado", descricao: "10 tarefas concluídas", emoji: "⭐" },
  { codigo: "routine_master", nome: "Mestre da Rotina", descricao: "50 tarefas concluídas", emoji: "🏆" },
  { codigo: "piggy_guard", nome: "Guardião do Cofrinho", descricao: "Primeira meta alcançada", emoji: "🐷" },
  { codigo: "hero", nome: "Herói do Cofrinho", descricao: "Nível máximo", emoji: "🦸" },
];

export async function seedAchievements(childId: string) {
  const rows = DEFAULT_ACHIEVEMENTS.map((a) => ({ crianca_id: childId, ...a }));
  const { error } = await supabase.from("conquistas").insert(rows);
  if (error) console.error("seedAchievements", error);
}
