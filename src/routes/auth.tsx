import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { fetchPrimaryRole, friendlyAuthError, ROLE_HOME, type AppRole } from "@/lib/auth";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Heróis do Cofrinho" },
      { name: "description", content: "Faça login ou crie sua conta no Heróis do Cofrinho." },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe sua senha").max(72),
});

const childItemSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(40, "Nome muito longo"),
  gender: z.enum(["M", "F", "O"]),
  emoji: z.string().min(1).max(8),
});

const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Nome muito curto")
      .max(80, "Nome muito longo"),
    gender: z.enum(["M", "F", "O"], { message: "Selecione o sexo" }),
    email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido").max(255),
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .max(72, "Senha muito longa")
      .regex(/[A-Za-z]/, "Inclua ao menos uma letra")
      .regex(/\d/, "Inclua ao menos um número"),
    confirmPassword: z.string(),
    role: z.enum(["responsavel", "admin"]),
    adminCode: z.string().optional(),
    acceptTerms: z.boolean(),
    children: z.array(childItemSchema).max(10),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  })
  .refine((d) => d.acceptTerms === true, {
    path: ["acceptTerms"],
    message: "Você precisa aceitar os termos de uso",
  })
  .refine((d) => d.role !== "admin" || d.adminCode === "HEROIS-ADMIN-2026", {
    path: ["adminCode"],
    message: "Código de administrador inválido",
  });

const CHILD_AVATARS = ["🦸", "🦸‍♀️", "🧒", "👦", "👧", "🧑‍🚀", "🧚", "🧙", "🦄", "🐯"];

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Redirect already-signed-in users to their home
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const role = await fetchPrimaryRole(data.user.id);
        navigate({ to: ROLE_HOME[role], replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <img src={mascot} alt="" width={56} height={56} className="h-14 w-14 animate-float" />
          <div className="text-white">
            <div className="font-display text-2xl font-black leading-none">Heróis</div>
            <div className="font-display text-xl font-bold leading-none">do Cofrinho</div>
          </div>
        </div>

        <Card className="p-6 shadow-pop rounded-2xl">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSwitch={() => setTab("signup")} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm onSwitch={() => setTab("login")} />
            </TabsContent>
          </Tabs>
        </Card>

        <p className="mt-4 text-center text-xs text-white/80">
          Educação financeira que vira aventura.
        </p>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" /> {msg}
    </p>
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error || !data.user) {
      setServerError(friendlyAuthError(error?.message ?? ""));
      return;
    }
    const role = await fetchPrimaryRole(data.user.id);
    const { data: prof } = await supabase
      .from("perfis")
      .select("genero")
      .eq("id", data.user.id)
      .maybeSingle();
    const hello = prof?.genero === "F" ? "Bem-vinda" : "Bem-vindo";
    toast.success(`${hello} de volta! 🎉`);
    navigate({ to: ROLE_HOME[role], replace: true });
  }

  async function handleGoogle() {
    setServerError(null);
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      setServerError(friendlyAuthError(String(result.error)));
      return;
    }
    if (result.redirected) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const role = await fetchPrimaryRole(data.user.id);
      navigate({ to: ROLE_HOME[role], replace: true });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
        />
        <FieldError msg={errors.email} />
      </div>
      <div>
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPwd ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError msg={errors.password} />
      </div>
      <div className="flex justify-end -mt-2">
        <Link to="/forgot-password" className="text-xs text-primary font-semibold hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">ou</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continuar com Google</>}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">
          Criar conta
        </button>
      </p>
    </form>
  );
}

type ChildDraft = { name: string; gender: "M" | "F" | "O"; emoji: string };

function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [userGender, setUserGender] = useState<"M" | "F" | "O">("O");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AppRole>("responsavel");
  const [adminCode, setAdminCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [children, setChildren] = useState<ChildDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addChild() {
    setChildren((cs) => [...cs, { name: "", gender: "O", emoji: CHILD_AVATARS[0] }]);
  }
  function updateChild(i: number, patch: Partial<ChildDraft>) {
    setChildren((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeChild(i: number) {
    setChildren((cs) => cs.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    const parsed = signupSchema.safeParse({
      fullName,
      gender: userGender,
      email,
      password,
      confirmPassword,
      role,
      adminCode,
      acceptTerms,
      children,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const key = i.path.join(".");
        fieldErrors[key] = i.message;
        if (typeof i.path[0] === "string" && !fieldErrors[i.path[0] as string]) {
          fieldErrors[i.path[0] as string] = i.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          nome_completo: parsed.data.fullName,
          genero: parsed.data.gender,
          papel: parsed.data.role,
        },
      },
    });
    if (error) {
      setLoading(false);
      setServerError(friendlyAuthError(error.message));
      return;
    }
    // If we have a session and children to create, insert them linked to the parent.
    if (data.session && parsed.data.role === "responsavel" && parsed.data.children.length > 0) {
      const parentId = data.session.user.id;
      const rows = parsed.data.children.map((c) => ({
        responsavel_id: parentId,
        nome: c.name,
        avatar_emoji: c.emoji,
        genero: c.gender,
      }));
      const { data: inserted, error: insErr } = await supabase
        .from("criancas")
        .insert(rows)
        .select("id");
      if (insErr) {
        console.error("Falha ao cadastrar crianças:", insErr);
        toast.error("Conta criada, mas houve erro ao cadastrar as crianças. Você pode adicioná-las depois.");
      } else if (inserted) {
        const { seedAchievements } = await import("@/lib/children");
        await Promise.all(inserted.map((c) => seedAchievements(c.id)));
      }
    }
    setLoading(false);
    if (!data.session) {
      if (parsed.data.children.length > 0) {
        toast.success("Conta criada! Confirme seu e-mail e depois cadastre as crianças no app.");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
      onSwitch();
      return;
    }
    const hello = parsed.data.gender === "F" ? "Bem-vinda" : "Bem-vindo";
    toast.success(`Conta criada! ${hello}! 🎉`);
    navigate({ to: ROLE_HOME[parsed.data.role], replace: true });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="signup-name">Nome completo</Label>
        <Input
          id="signup-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como devemos te chamar"
          aria-invalid={!!errors.fullName}
          maxLength={80}
        />
        <FieldError msg={errors.fullName} />
      </div>
      <div>
        <Label>Sexo</Label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([
            { v: "M", label: "👨 Masculino" },
            { v: "F", label: "👩 Feminino" },
            { v: "O", label: "🧑 Outro" },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setUserGender(opt.v)}
              className={`rounded-xl border-2 p-2 text-sm font-semibold transition ${
                userGender === opt.v ? "border-primary bg-primary/10" : "border-input hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <FieldError msg={errors.gender} />
      </div>
      <div>
        <Label htmlFor="signup-email">E-mail</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@email.com"
          aria-invalid={!!errors.email}
        />
        <FieldError msg={errors.email} />
      </div>
      <div>
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres, letras e números"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <FieldError msg={errors.password} />
      </div>
      <div>
        <Label htmlFor="signup-confirm">Confirmar senha</Label>
        <Input
          id="signup-confirm"
          type={showPwd ? "text" : "password"}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repita a senha"
          aria-invalid={!!errors.confirmPassword}
        />
        <FieldError msg={errors.confirmPassword} />
      </div>
      <div>
        <Label>Eu sou…</Label>
        <RadioGroup
          value={role}
          onValueChange={(v) => setRole(v as AppRole)}
          className="grid grid-cols-2 gap-2 mt-2"
        >
          {(
            [
              { v: "responsavel", label: "👨‍👩‍👧 Responsável" },
              { v: "admin", label: "🛡️ Admin" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.v}
              className={`cursor-pointer rounded-xl border-2 p-3 text-center text-sm font-semibold transition-colors ${
                role === opt.v ? "border-primary bg-primary/10" : "border-input hover:bg-accent"
              }`}
            >
              <RadioGroupItem value={opt.v} className="sr-only" />
              {opt.label}
            </label>
          ))}
        </RadioGroup>
        <p className="mt-2 text-xs text-muted-foreground">
          Contas de criança são criadas dentro do app pelo responsável.
        </p>
      </div>
      {role === "admin" && (
        <div>
          <Label htmlFor="admin-code">Código de administrador</Label>
          <Input
            id="admin-code"
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Solicite à equipe"
            aria-invalid={!!errors.adminCode}
          />
          <FieldError msg={errors.adminCode} />
        </div>
      )}
      {role === "responsavel" && (
        <div className="rounded-2xl border-2 border-dashed p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-black text-sm">👶 Vincular crianças (opcional)</p>
              <p className="text-xs text-muted-foreground">
                Cadastre seus filhos agora — eles ficarão vinculados ao seu perfil.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addChild} disabled={children.length >= 10}>
              + Adicionar
            </Button>
          </div>
          {children.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Você também pode adicionar depois em "Crianças".</p>
          )}
          {children.map((c, i) => (
            <div key={i} className="rounded-xl bg-muted/40 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => updateChild(i, { name: e.target.value })}
                  placeholder="Nome da criança"
                  maxLength={40}
                  aria-invalid={!!errors[`children.${i}.name`]}
                />
                <button
                  type="button"
                  onClick={() => removeChild(i)}
                  className="text-xs font-semibold text-destructive hover:underline shrink-0"
                  aria-label="Remover"
                >
                  Remover
                </button>
              </div>
              <FieldError msg={errors[`children.${i}.name`]} />
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "M", label: "👦" },
                  { v: "F", label: "👧" },
                  { v: "O", label: "🧒" },
                ] as const).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => updateChild(i, { gender: opt.v })}
                    className={`rounded-lg border-2 py-1 text-sm transition ${
                      c.gender === opt.v ? "border-primary bg-primary/10" : "border-input"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {CHILD_AVATARS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => updateChild(i, { emoji: e })}
                    className={`grid h-9 w-9 place-items-center rounded-lg border-2 text-lg ${
                      c.emoji === e ? "border-primary bg-primary/10" : "border-input"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={acceptTerms}
          onCheckedChange={(v) => setAcceptTerms(v === true)}
          aria-invalid={!!errors.acceptTerms}
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
          Li e aceito os{" "}
          <Link to="/" className="text-primary font-semibold hover:underline">
            termos de uso
          </Link>{" "}
          e a política de privacidade infantil.
        </label>
      </div>
      <FieldError msg={errors.acceptTerms} />
      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">
          Entrar
        </button>
      </p>
    </form>
  );
}
