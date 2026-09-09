import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, UserCog, KeyRound, ShieldOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  useChildrenList,
  seedAchievements,
  setStoredChildId,
  type ChildRow,
} from "@/lib/children";
import { useCurrentUser } from "@/lib/auth";
import { createChildLogin, removeChildLogin } from "@/lib/child-login.functions";

export const Route = createFileRoute("/_authenticated/_app/criancas")({
  head: () => ({ meta: [{ title: "Crianças — Heróis do Cofrinho" }] }),
  component: CriancasPage,
});

const AVATAR_OPTIONS = ["🦸", "🦸‍♀️", "🧒", "👦", "👧", "🧑‍🚀", "🧚", "🧙", "🦄", "🐯"];

function CriancasPage() {
  const { role } = useCurrentUser();
  const { data: children = [], isLoading } = useChildrenList();
  const qc = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(AVATAR_OPTIONS[0]);
  const [pointValue, setPointValue] = useState("0.50");
  const [gender, setGender] = useState<"M" | "F" | "O">("O");

  function openCreate() {
    setEditing(null);
    setName("");
    setEmoji(AVATAR_OPTIONS[0]);
    setPointValue("0.50");
    setGender("O");
    setOpen(true);
  }
  function openEdit(c: ChildRow) {
    setEditing(c);
    setName(c.nome);
    setEmoji(c.avatar_emoji);
    setPointValue(String(c.valor_ponto));
    setGender((c.genero as "M" | "F" | "O") ?? "O");
    setOpen(true);
  }

  const upsert = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Informe o nome da criança.");
      const pv = parseFloat(pointValue.replace(",", "."));
      if (Number.isNaN(pv) || pv < 0) throw new Error("Valor por ponto inválido.");
      if (editing) {
        const { error } = await supabase
          .from("criancas")
          .update({ nome: trimmed, avatar_emoji: emoji, valor_ponto: pv, genero: gender })
          .eq("id", editing.id);
        if (error) throw error;
        return { id: editing.id, isNew: false };
      }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");
      const { data, error } = await supabase
        .from("criancas")
        .insert({
          responsavel_id: auth.user.id,
          nome: trimmed,
          avatar_emoji: emoji,
          valor_ponto: pv,
          genero: gender,
        })
        .select("id")
        .single();
      if (error) throw error;
      await seedAchievements(data.id);
      return { id: data.id, isNew: true };
    },
    onSuccess: ({ id, isNew }) => {
      qc.invalidateQueries({ queryKey: ["children"] });
      if (isNew) setStoredChildId(id);
      toast.success(isNew ? "Criança cadastrada! 🎉" : "Alterações salvas.");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Não foi possível salvar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("criancas").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["children"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
      qc.invalidateQueries({ queryKey: ["rewards", id] });
      qc.invalidateQueries({ queryKey: ["goals", id] });
      qc.invalidateQueries({ queryKey: ["achievements", id] });
      toast.success("Criança removida.");
    },
    onError: () => toast.error("Não foi possível remover."),
  });

  // ----- Child login management -----
  const createLoginFn = useServerFn(createChildLogin);
  const removeLoginFn = useServerFn(removeChildLogin);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginChild, setLoginChild] = useState<ChildRow | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  function openLogin(c: ChildRow) {
    setLoginChild(c);
    setLoginEmail("");
    setLoginPassword("");
    setLoginOpen(true);
  }

  const createLogin = useMutation({
    mutationFn: async () => {
      if (!loginChild) throw new Error("Selecione uma criança.");
      return createLoginFn({
        data: { childId: loginChild.id, email: loginEmail.trim(), password: loginPassword },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success("Acesso criado! A criança já pode entrar com o e-mail e senha.");
      setLoginOpen(false);
    },
    onError: (e: Error) => toast.error(e.message ?? "Não foi possível criar o acesso."),
  });

  const revokeLogin = useMutation({
    mutationFn: async (id: string) => removeLoginFn({ data: { childId: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["children"] });
      toast.success("Acesso removido.");
    },
    onError: (e: Error) => toast.error(e.message ?? "Não foi possível remover o acesso."),
  });

  if (role === "crianca") {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border-2 p-8 text-center">
          <h1 className="font-display text-2xl font-black">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas responsáveis e administradores podem cadastrar crianças.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">👨‍👩‍👧 Minhas Crianças</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre cada filho para acompanhar missões, metas e recompensas separadamente.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="lg" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nova criança
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar criança" : "Cadastrar criança"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: Lara"
                  maxLength={40}
                />
              </div>
              <div>
                <Label>Sexo</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    { v: "M", label: "👦 Menino" },
                    { v: "F", label: "👧 Menina" },
                    { v: "O", label: "🧒 Outro" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setGender(opt.v)}
                      className={`rounded-xl border-2 p-2 text-sm font-semibold transition ${
                        gender === opt.v ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Avatar</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`grid h-12 w-12 place-items-center rounded-2xl border-2 text-2xl transition ${
                        emoji === e ? "border-primary bg-primary/10 scale-110" : "border-border bg-muted hover:border-primary/40"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="pv">Valor por ponto (R$)</Label>
                <Input
                  id="pv"
                  inputMode="decimal"
                  value={pointValue}
                  onChange={(e) => setPointValue(e.target.value)}
                  placeholder="0,50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Usado para mostrar o valor estimado em reais no cofrinho.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="hero" onClick={() => upsert.mutate()} disabled={upsert.isPending}>
                {upsert.isPending ? "Salvando..." : editing ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : children.length === 0 ? (
        <Card className="rounded-3xl border-2 border-dashed p-10 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-4xl">🦸</div>
          <p className="mt-3 font-display text-lg font-black">Nenhuma criança cadastrada ainda.</p>
          <p className="text-sm text-muted-foreground">Clique em "Nova criança" para começar.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((c) => (
            <Card key={c.id} className="rounded-3xl border-2 p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-4xl">
                  {c.avatar_emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-black truncate">{c.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    Nv {c.nivel} · {c.nivel_nome}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <Stat label="Pontos" value={c.pontos} />
                <Stat label="XP" value={c.xp} />
                <Stat label="R$/pt" value={Number(c.valor_ponto).toFixed(2).replace(".", ",")} />
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs">
                {c.usuario_id ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">
                    <CheckCircle2 className="h-3 w-3" /> Acesso próprio ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-semibold text-muted-foreground">
                    Sem login próprio
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(c)}>
                  <UserCog className="h-4 w-4" /> Editar
                </Button>
                {c.usuario_id ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" title="Remover acesso">
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover o acesso de {c.nome}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          A conta de login será excluída. O perfil da criança e o progresso continuam aqui no painel do responsável.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => revokeLogin.mutate(c.id)}>
                          Remover acesso
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button variant="fun" size="sm" onClick={() => openLogin(c)} title="Criar login">
                    <KeyRound className="h-4 w-4" /> Criar login
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover {c.nome}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso apaga todas as tarefas, recompensas, metas e conquistas dela. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(c.id)}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Criar login para {loginChild?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A criança terá uma conta própria vinculada ao seu cadastro. Use um e-mail acessível por você (do responsável) — não é necessário confirmá-lo.
            </p>
            <div>
              <Label htmlFor="child-email">E-mail de acesso</Label>
              <Input
                id="child-email"
                type="email"
                autoComplete="off"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="ex.: lara.cofrinho@email.com"
              />
            </div>
            <div>
              <Label htmlFor="child-password">Senha (mín. 6 caracteres)</Label>
              <Input
                id="child-password"
                type="text"
                autoComplete="off"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Escolha uma senha simples para a criança"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Anote a senha em local seguro. Você pode remover o acesso a qualquer momento.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={() => createLogin.mutate()}
              disabled={createLogin.isPending}
            >
              {createLogin.isPending ? "Criando..." : "Criar acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted px-2 py-1.5">
      <p className="font-display font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
