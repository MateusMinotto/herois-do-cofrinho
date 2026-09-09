import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "responsavel" | "crianca";

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  responsavel: "Responsável",
  crianca: "Criança",
};

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  responsavel: "/pais",
  crianca: "/",
};

export async function fetchPrimaryRole(userId: string): Promise<AppRole> {
  const { data } = await supabase
    .from("usuario_papeis")
    .select("papel")
    .eq("usuario_id", userId);
  const roles = (data ?? []).map((r) => r.papel as AppRole);
  if (roles.includes("admin")) return "admin";
  if (roles.includes("responsavel")) return "responsavel";
  if (roles.includes("crianca")) return "crianca";
  return "responsavel";
}


export function useCurrentUser() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
        const r = await fetchPrimaryRole(data.user.id);
        if (active) setRole(r);
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!active) return;
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? null });
        fetchPrimaryRole(session.user.id).then((r) => active && setRole(r));
      } else {
        setUser(null);
        setRole(null);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, role, loading };
}

/** Map raw Supabase auth errors to friendly Portuguese messages. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials"))
    return "E-mail ou senha incorretos. Confira e tente novamente.";
  if (m.includes("email not confirmed"))
    return "Você ainda não confirmou seu e-mail. Verifique sua caixa de entrada.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Este e-mail já está cadastrado. Faça login ou recupere sua senha.";
  if (m.includes("password should be at least"))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";
  if (m.includes("network") || m.includes("fetch"))
    return "Sem conexão com o servidor. Verifique sua internet.";
  if (m.includes("signup") && m.includes("disabled"))
    return "O cadastro está temporariamente desativado.";
  return "Ocorreu um erro inesperado. Tente novamente em instantes.";
}
