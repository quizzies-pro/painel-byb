import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PERMISSIONS = {
  courses: { view: true, manage: true },
  modules: { view: true, manage: true },
  lessons: { view: true, manage: true },
  students: { view: true, manage: true },
  enrollments: { view: true, manage: true },
  payments: { view: true },
  webhooks: { view: true, manage: true },
  settings: { view: true },
  logs: { view: true },
  dashboard: { revenue: true, students: true, enrollments: true, payments: true },
};

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonRes({ error: "Não autorizado" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) return jsonRes({ error: "Não autorizado" }, 401);

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!callerRole) {
      return jsonRes({ error: "Apenas Super Admins podem gerenciar usuários" }, 403);
    }

    const method = req.method;

    // GET — List admin users
    if (method === "GET") {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role, permissions, created_at")
        .order("created_at", { ascending: true });

      if (!roles || roles.length === 0) return jsonRes([]);

      const users = await Promise.all(
        roles.map(async (r) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          return {
            user_id: r.user_id,
            email: data.user?.email ?? "unknown",
            role: r.role,
            permissions: r.permissions ?? DEFAULT_PERMISSIONS,
            created_at: r.created_at,
            last_sign_in: data.user?.last_sign_in_at ?? null,
          };
        })
      );

      return jsonRes(users);
    }

    // POST — Invite new admin
    if (method === "POST") {
      const { email, role, permissions } = await req.json();

      if (!email || !role) {
        return jsonRes({ error: "Email e papel são obrigatórios" }, 400);
      }
      if (!["super_admin", "admin_operacional"].includes(role)) {
        return jsonRes({ error: "Papel inválido" }, 400);
      }

      // Find or invite user
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      let userId: string;
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: invited, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (inviteError || !invited.user) {
          return jsonRes({ error: inviteError?.message ?? "Erro ao convidar" }, 500);
        }
        userId = invited.user.id;
      }

      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        return jsonRes({ error: "Este usuário já possui um papel atribuído" }, 409);
      }

      const finalPermissions = role === "super_admin"
        ? DEFAULT_PERMISSIONS
        : (permissions ?? DEFAULT_PERMISSIONS);

      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role, permissions: finalPermissions });

      if (insertError) return jsonRes({ error: insertError.message }, 500);

      return jsonRes({ success: true, user_id: userId });
    }

    // PATCH — Update role and/or permissions
    if (method === "PATCH") {
      const { user_id, role, permissions } = await req.json();
      if (!user_id) return jsonRes({ error: "user_id é obrigatório" }, 400);

      if (user_id === caller.id && role && role !== "super_admin") {
        return jsonRes({ error: "Você não pode remover seu próprio papel de Super Admin" }, 400);
      }

      const updates: Record<string, unknown> = {};
      if (role) updates.role = role;
      if (permissions) updates.permissions = permissions;

      if (Object.keys(updates).length === 0) {
        return jsonRes({ error: "Nenhuma alteração fornecida" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .update(updates)
        .eq("user_id", user_id);

      if (error) return jsonRes({ error: error.message }, 500);
      return jsonRes({ success: true });
    }

    // DELETE — Remove admin role
    if (method === "DELETE") {
      const { user_id } = await req.json();
      if (!user_id) return jsonRes({ error: "user_id é obrigatório" }, 400);
      if (user_id === caller.id) {
        return jsonRes({ error: "Você não pode remover seu próprio acesso" }, 400);
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      if (error) return jsonRes({ error: error.message }, 500);
      return jsonRes({ success: true });
    }

    return jsonRes({ error: "Método não suportado" }, 405);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
