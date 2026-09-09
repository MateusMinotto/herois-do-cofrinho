import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createInput = z.object({
  childId: z.string().uuid(),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres").max(72),
});

const removeInput = z.object({ childId: z.string().uuid() });

/** Parent/admin creates a real auth login for one of their children. */
export const createChildLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify caller controls this child (parent) or is admin.
    const { data: child, error: childErr } = await supabase
      .from("criancas")
      .select("id, nome, genero, responsavel_id, usuario_id")
      .eq("id", data.childId)
      .maybeSingle();
    if (childErr) throw new Error(childErr.message);
    if (!child) throw new Error("Criança não encontrada.");
    if (child.usuario_id) throw new Error("Esta criança já possui acesso próprio.");

    const { data: roleRow } = await supabase
      .from("usuario_papeis")
      .select("papel")
      .eq("usuario_id", userId)
      .eq("papel", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    if (!isAdmin && child.responsavel_id !== userId) {
      throw new Error("Sem permissão para criar acesso desta criança.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nome_completo: child.nome,
        genero: child.genero ?? null,
        papel: "crianca",
      },
    });
    if (createErr || !created.user) {
      const msg = createErr?.message ?? "Não foi possível criar o acesso.";
      if (msg.toLowerCase().includes("already")) {
        throw new Error("Este e-mail já está cadastrado.");
      }
      throw new Error(msg);
    }

    const newUserId = created.user.id;

    // Link child row to the new auth user. Use admin client to bypass any RLS edge cases.
    const { error: linkErr } = await supabaseAdmin
      .from("criancas")
      .update({ usuario_id: newUserId })
      .eq("id", data.childId);
    if (linkErr) {
      // best-effort rollback
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(linkErr.message);
    }

    return { ok: true, email: data.email };
  });

/** Parent/admin revokes the child's login. */
export const removeChildLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => removeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: child, error } = await supabase
      .from("criancas")
      .select("id, responsavel_id, usuario_id")
      .eq("id", data.childId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!child) throw new Error("Criança não encontrada.");
    if (!child.usuario_id) return { ok: true };

    const { data: roleRow } = await supabase
      .from("usuario_papeis")
      .select("papel")
      .eq("usuario_id", userId)
      .eq("papel", "admin")
      .maybeSingle();
    const isAdmin = !!roleRow;
    if (!isAdmin && child.responsavel_id !== userId) {
      throw new Error("Sem permissão.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("criancas").update({ usuario_id: null }).eq("id", child.id);
    await supabaseAdmin.auth.admin.deleteUser(child.usuario_id);
    return { ok: true };
  });
