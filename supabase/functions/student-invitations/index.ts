import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";

const MEMBER_APP_URL = Deno.env.get("MEMBER_APP_URL") ?? "https://member-haven-forge.lovable.app";

const StudentSchema = z.object({
  student_id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).nullable().optional(),
  cpf: z.string().trim().max(30).nullable().optional(),
  status: z.enum(["active", "blocked", "pending", "canceled"]).default("active"),
  origin: z.string().trim().max(100).nullable().optional(),
  avatar_url: z.string().trim().max(2048).nullable().optional(),
  send_invite: z.boolean().default(true),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function findAuthUserByEmail(supabaseAdmin: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Não foi possível localizar a conta deste aluno");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não suportado" }, 405);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, 401);

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user: caller }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !caller) return json({ error: "Não autorizado" }, 401);

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("role, permissions")
      .eq("user_id", caller.id)
      .maybeSingle();
    const permissions = role?.permissions as { students?: { manage?: boolean } } | null;
    if (!role || (role.role !== "super_admin" && !permissions?.students?.manage)) {
      return json({ error: "Você não tem permissão para cadastrar alunos" }, 403);
    }

    const parsed = StudentSchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: "Revise os dados informados" }, 400);
    const { student_id: studentId, send_invite: sendInvite, ...studentInput } = parsed.data;

    const { data: duplicate } = await supabaseAdmin
      .from("students")
      .select("id, auth_user_id")
      .ilike("email", studentInput.email)
      .maybeSingle();
    if (duplicate && duplicate.id !== studentId) {
      return json({ error: "Já existe um aluno cadastrado com este e-mail" }, 409);
    }
    if (studentId && !duplicate) return json({ error: "Aluno não encontrado" }, 404);

    let authUserId: string | null = null;
    let accessEmailSent = false;
    if (sendInvite) {
      const existingAuthUser = await findAuthUserByEmail(supabaseAdmin, studentInput.email);
      if (existingAuthUser) {
        authUserId = existingAuthUser.id;
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(studentInput.email, {
          redirectTo: `${MEMBER_APP_URL}/reset-password`,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(studentInput.email, {
          redirectTo: `${MEMBER_APP_URL}/reset-password`,
          data: { name: studentInput.name },
        });
        if (error || !data.user) throw error ?? new Error("Não foi possível enviar o convite");
        authUserId = data.user.id;
      }
      accessEmailSent = true;
    }

    const studentRecord = {
      ...studentInput,
      origin: studentInput.origin || "Manual",
      ...(authUserId ? { auth_user_id: authUserId } : {}),
    };
    const query = studentId
      ? supabaseAdmin.from("students").update(studentRecord).eq("id", studentId)
      : supabaseAdmin.from("students").insert(studentRecord);
    const { data: student, error: writeError } = await query.select("id").single();
    if (writeError) throw writeError;

    return json({
      success: true,
      student_id: student.id,
      auth_user_id: authUserId ?? duplicate?.auth_user_id ?? null,
      access_email_sent: accessEmailSent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao cadastrar aluno";
    return json({ error: message }, 500);
  }
});