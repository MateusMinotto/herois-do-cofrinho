import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/auth";

export interface ProfileRow {
  id: string;
  nome_completo: string;
  email: string | null;
  genero: "M" | "F" | "O" | null;
}

export function useCurrentProfile() {
  const { user } = useCurrentUser();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ProfileRow | null> => {
      const { data, error } = await supabase
        .from("perfis")
        .select("id, nome_completo, email, genero")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as ProfileRow) ?? null;
    },
  });
}


export function greeting(gender: string | null | undefined) {
  return gender === "F" ? "Bem-vinda" : "Bem-vindo";
}

export function firstName(fullName: string | null | undefined) {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}
