import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quiz } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedChild } from "@/lib/children";
import { EmptyChildState } from "@/components/EmptyChildState";

export const Route = createFileRoute("/_authenticated/_app/quiz")({
  head: () => ({ meta: [{ title: "Quiz Financeiro — Heróis do Cofrinho" }] }),
  component: Quiz,
});

function Quiz() {
  const { child, loading } = useSelectedChild();
  const childId = child?.id ?? null;
  const qc = useQueryClient();

  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: best } = useQuery({
    queryKey: ["quiz_best", childId],
    enabled: !!childId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tentativas_quiz")
        .select("acertos,total,criado_em")
        .eq("crianca_id", childId!)
        .order("acertos", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveAttempt = useMutation({
    mutationFn: async (finalScore: number) => {
      if (!childId) return;
      const { error } = await supabase
        .from("tentativas_quiz")
        .insert({ crianca_id: childId, acertos: finalScore, total: quiz.length });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quiz_best", childId] }),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  const q = quiz[i];

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    if (idx === q.correct) setScore((s) => s + 1);
  };

  const next = () => {
    if (i + 1 >= quiz.length) {
      const finalScore = score; // score already up to date for last
      setDone(true);
      if (!saved) {
        setSaved(true);
        saveAttempt.mutate(finalScore);
      }
    } else {
      setI(i + 1);
      setPicked(null);
    }
  };

  const reset = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    setSaved(false);
  };

  if (done) {
    const pts = score * 5;
    return (
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border-2 p-8 text-center shadow-pop">
          <div className="text-7xl animate-bounce-in">{score === quiz.length ? "🏆" : score >= 3 ? "🎉" : "💪"}</div>
          <h1 className="mt-4 font-display text-3xl font-black">Quiz finalizado!</h1>
          <p className="mt-2 text-muted-foreground">Você acertou <b className="text-success">{score}</b> de <b>{quiz.length}</b></p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Acertos" value={score} color="text-success" />
            <Stat label="Erros" value={quiz.length - score} color="text-destructive" />
            <Stat label="Pontos" value={`+${pts}`} color="text-coin-foreground" />
          </div>
          {best && (
            <p className="mt-4 text-xs text-muted-foreground">
              Seu recorde: <b>{best.acertos}/{best.total}</b>
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={reset}>Refazer</Button>
            <Button variant="hero" asChild><Link to="/">Voltar para o mundo</Link></Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-muted-foreground">Pergunta {i + 1} de {quiz.length}</span>
        <span className="rounded-full bg-gradient-coin px-3 py-1 text-xs font-black text-coin-foreground">🪙 {score * 5} pts</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-hero transition-all" style={{ width: `${((i) / quiz.length) * 100}%` }} />
      </div>

      <Card className="rounded-3xl border-2 p-6 shadow-pop">
        <h2 className="font-display text-2xl font-black">{q.q}</h2>
        <div className="mt-5 grid gap-3">
          {q.options.map((opt, idx) => {
            const isCorrect = picked !== null && idx === q.correct;
            const isWrong = picked === idx && idx !== q.correct;
            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all ${
                  isCorrect ? "bg-success/15 border-success text-success" :
                  isWrong ? "bg-destructive/10 border-destructive text-destructive" :
                  picked !== null ? "opacity-60 border-border" :
                  "border-border hover:border-primary hover:bg-primary/5 hover:-translate-y-0.5"
                }`}
              >
                <span>{opt}</span>
                {isCorrect && <Check className="h-5 w-5" />}
                {isWrong && <X className="h-5 w-5" />}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="mt-5 flex justify-end">
            <Button variant="hero" onClick={next}>{i + 1 >= quiz.length ? "Ver resultado" : "Próxima"}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <div className={`font-display text-2xl font-black ${color}`}>{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
