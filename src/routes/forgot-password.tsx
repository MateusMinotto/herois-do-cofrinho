import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { friendlyAuthError } from "@/lib/auth";
import mascot from "@/assets/mascot.png";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Heróis do Cofrinho" },
      { name: "description", content: "Receba um link no seu e-mail para criar uma nova senha." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido").max(255),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setFieldError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "E-mail inválido");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setServerError(friendlyAuthError(error.message));
      return;
    }
    setSent(true);
  }

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
          <h1 className="font-display text-2xl font-bold mb-1">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Vamos te enviar um link para criar uma nova senha.
          </p>

          {sent ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Se houver uma conta com <strong>{email}</strong>, enviamos um link de recuperação.
                  Verifique sua caixa de entrada (e o spam!).
                </AlertDescription>
              </Alert>
              <Button asChild variant="hero" size="lg" className="w-full">
                <Link to="/auth">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {serverError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  aria-invalid={!!fieldError}
                />
                {fieldError && (
                  <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {fieldError}
                  </p>
                )}
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
              </Button>
              <Link
                to="/auth"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar para o login
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
