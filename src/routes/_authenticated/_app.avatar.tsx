import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyChildState } from "@/components/EmptyChildState";
import { useSelectedChild, type AvatarConfig } from "@/lib/children";

export const Route = createFileRoute("/_authenticated/_app/avatar")({
  head: () => ({ meta: [{ title: "Meu Avatar — Heróis do Cofrinho" }] }),
  component: Avatar,
});

const hairs = ["👧", "🧒", "👦", "👩‍🦰", "🧑‍🦱"];
const outfits = ["🦸", "🧙", "🧑‍🚀", "🦄", "🧚"];
const colors = ["bg-primary/20", "bg-fun/25", "bg-success/20", "bg-accent/40", "bg-secondary/20"];
const accessories = ["🎩", "👑", "🎀", "🕶️", "⭐"];

function Avatar() {
  const { child, loading } = useSelectedChild();
  const qc = useQueryClient();
  const [hair, setHair] = useState(0);
  const [outfit, setOutfit] = useState(0);
  const [color, setColor] = useState(0);
  const [acc, setAcc] = useState(0);

  useEffect(() => {
    if (!child) return;
    const cfg = (child.avatar_config ?? {}) as AvatarConfig;
    setHair(cfg.hair ?? 0);
    setOutfit(cfg.outfit ?? 0);
    setColor(cfg.color ?? 0);
    setAcc(cfg.acc ?? 0);
  }, [child?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!child) return;
      const config: AvatarConfig = { hair, outfit, color, acc };
      const { error } = await supabase
        .from("criancas")
        .update({ avatar_config: config as unknown as Record<string, number>, avatar_emoji: outfits[outfit] })
        .eq("id", child.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success("Visual salvo! ✨");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!child) return <EmptyChildState />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-black">🎨 Avatar de {child.nome}</h1>
        <p className="text-sm text-muted-foreground">Personalize o herói do cofrinho!</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card className="rounded-3xl border-2 p-6 shadow-pop">
          <div className={`relative mx-auto grid h-64 w-64 place-items-center rounded-full ${colors[color]} shadow-card`}>
            <div className="text-9xl animate-float">{outfits[outfit]}</div>
            <div className="absolute top-2 text-5xl">{accessories[acc]}</div>
            <div className="absolute bottom-4 text-4xl">{hairs[hair]}</div>
          </div>
          <p className="mt-4 text-center font-display text-xl font-black">
            {child.nome}, {child.nivel_nome} nível {child.nivel}
          </p>
        </Card>

        <Card className="rounded-3xl border-2 p-6 shadow-card space-y-6">
          <Picker label="Cabelo" items={hairs} value={hair} onChange={setHair} />
          <Picker label="Roupa" items={outfits} value={outfit} onChange={setOutfit} />
          <Picker label="Acessório" items={accessories} value={acc} onChange={setAcc} />
          <div>
            <h3 className="mb-2 font-display font-bold">Cor favorita</h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColor(i)}
                  className={`h-12 w-12 rounded-2xl ${c} border-2 transition-all ${color === i ? "border-primary scale-110 shadow-pop" : "border-transparent"}`}
                />
              ))}
            </div>
          </div>
          <Button variant="hero" size="lg" className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar meu visual ✨"}
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Picker({ label, items, value, onChange }: { label: string; items: string[]; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <h3 className="mb-2 font-display font-bold">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`grid h-14 w-14 place-items-center rounded-2xl border-2 text-3xl transition-all ${value === i ? "border-primary bg-primary/10 scale-110 shadow-pop" : "border-border bg-muted hover:border-primary/40"}`}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}
