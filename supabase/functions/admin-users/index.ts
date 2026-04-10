import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
    } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check super_admin role
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!callerRole) {
      return new Response(
        JSON.stringify({ error: "Apenas Super Admins podem gerenciar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    // GET - List admin users
    if (method === "GET") {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role, created_at")
        .order("created_at", { ascending: true });

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch user emails from auth
      const users = await Promise.all(
        roles.map(async (r) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
          return {
            user_id: r.user_id,
            email: data.user?.email ?? "unknown",
            role: r.role,
            created_at: r.created_at,
            last_sign_in: data.user?.last_sign_in_at ?? null,
          };
        })
      );

      return new Response(JSON.stringify(users), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - Invite new admin
    if (method === "POST") {
      const { email, role } = await req.json();

      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: "Email e papel são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!["super_admin", "admin_operacional"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Papel inválido" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user already exists in auth
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Invite new user
        const { data: invited, error: inviteError } =
          await supabaseAdmin.auth.admin.inviteUserByEmail(email);
        if (inviteError || !invited.user) {
          return new Response(
            JSON.stringify({ error: inviteError?.message ?? "Erro ao convidar usuário" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = invited.user.id;
      }

      // Check if role already exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: "Este usuário já possui um papel atribuído" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PATCH - Update role
    if (method === "PATCH") {
      const { user_id, role } = await req.json();

      if (!user_id || !role) {
        return new Response(
          JSON.stringify({ error: "user_id e role são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent removing own super_admin
      if (user_id === caller.id && role !== "super_admin") {
        return new Response(
          JSON.stringify({ error: "Você não pode remover seu próprio papel de Super Admin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - Remove admin role
    if (method === "DELETE") {
      const { user_id } = await req.json();

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent self-removal
      if (user_id === caller.id) {
        return new Response(
          JSON.stringify({ error: "Você não pode remover seu próprio acesso" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Método não suportado" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
