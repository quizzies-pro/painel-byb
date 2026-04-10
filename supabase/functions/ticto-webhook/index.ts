import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let payload: Record<string, unknown>;

  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Log the webhook
  const { data: logEntry } = await supabase.from("webhook_logs").insert({
    source: "ticto",
    event_type: (payload.event as string) || "unknown",
    payload,
    status: "received",
  }).select("id").single();

  const logId = logEntry?.id;

  try {
    // Validate token
    const { data: tokenSetting } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "ticto_webhook_token")
      .single();

    const expectedToken = tokenSetting?.value;
    if (expectedToken && expectedToken.length > 0) {
      const receivedToken = req.headers.get("x-webhook-token") || (payload.token as string);
      if (receivedToken !== expectedToken) {
        await updateLog(supabase, logId, "failed", "Token inválido");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = (payload.event as string) || "";

    // Check for duplicate
    const externalId = (payload.payment_id as string) || (payload.transaction_id as string);
    if (externalId) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("external_payment_id", externalId)
        .maybeSingle();

      if (existing && (event === "purchase_created" || event === "payment_approved")) {
        await updateLog(supabase, logId, "ignored", "Pagamento duplicado");
        return new Response(JSON.stringify({ status: "duplicate" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Process events
    switch (event) {
      case "purchase_created":
      case "payment_approved": {
        const customerEmail = (payload.customer_email as string) || (payload.email as string) || "";
        const customerName = (payload.customer_name as string) || (payload.name as string) || "Sem nome";
        const customerPhone = (payload.customer_phone as string) || (payload.phone as string) || null;
        const customerCpf = (payload.customer_cpf as string) || (payload.cpf as string) || null;

        // Upsert student
        let studentId: string;
        const { data: existingStudent } = await supabase
          .from("students")
          .select("id")
          .eq("email", customerEmail)
          .maybeSingle();

        if (existingStudent) {
          studentId = existingStudent.id;
          await supabase.from("students").update({
            name: customerName,
            phone: customerPhone,
            cpf: customerCpf,
            status: "active",
          }).eq("id", studentId);
        } else {
          const { data: newStudent } = await supabase.from("students").insert({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            cpf: customerCpf,
            status: "active",
            origin: "ticto",
          }).select("id").single();
          studentId = newStudent!.id;
        }

        // Find course by ticto_product_id
        const productId = (payload.product_id as string) || "";
        const { data: course } = await supabase
          .from("courses")
          .select("id")
          .eq("ticto_product_id", productId)
          .maybeSingle();

        // Create payment
        await supabase.from("payments").insert({
          external_payment_id: externalId || null,
          external_order_id: (payload.order_id as string) || null,
          student_id: studentId,
          course_id: course?.id || null,
          product_name: (payload.product_name as string) || null,
          product_id: productId || null,
          amount: Number(payload.amount || payload.value || 0),
          currency: "BRL",
          payment_method: (payload.payment_method as string) || null,
          installments: Number(payload.installments || 1),
          status: event === "payment_approved" ? "approved" : "pending",
          coupon_code: (payload.coupon as string) || null,
          affiliate_name: (payload.affiliate as string) || null,
          purchased_at: new Date().toISOString(),
          approved_at: event === "payment_approved" ? new Date().toISOString() : null,
          raw_payload: payload,
          origin: "ticto",
        });

        // Create enrollment if course found and payment approved
        if (course?.id && event === "payment_approved") {
          const { data: existingEnrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_id", studentId)
            .eq("course_id", course.id)
            .maybeSingle();

          if (!existingEnrollment) {
            await supabase.from("enrollments").insert({
              student_id: studentId,
              course_id: course.id,
              origin: "purchase",
              status: "active",
              started_at: new Date().toISOString(),
            });
          }
        }

        await updateLog(supabase, logId, "processed", null);
        break;
      }

      case "payment_refunded":
      case "payment_chargeback": {
        const refundExternalId = (payload.payment_id as string) || (payload.transaction_id as string);
        if (refundExternalId) {
          const newStatus = event === "payment_refunded" ? "refunded" : "chargeback";
          const { data: payment } = await supabase
            .from("payments")
            .update({ status: newStatus, canceled_at: new Date().toISOString() })
            .eq("external_payment_id", refundExternalId)
            .select("student_id, course_id")
            .maybeSingle();

          // Check settings for auto-block
          const settingKey = event === "payment_refunded" ? "block_on_refund" : "block_on_chargeback";
          const { data: blockSetting } = await supabase
            .from("platform_settings")
            .select("value")
            .eq("key", settingKey)
            .single();

          if (blockSetting?.value === "true" && payment?.student_id && payment?.course_id) {
            await supabase.from("enrollments")
              .update({ status: "blocked" })
              .eq("student_id", payment.student_id)
              .eq("course_id", payment.course_id);
          }
        }
        await updateLog(supabase, logId, "processed", null);
        break;
      }

      default:
        await updateLog(supabase, logId, "ignored", `Evento não suportado: ${event}`);
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    await updateLog(supabase, logId, "failed", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateLog(
  supabase: ReturnType<typeof createClient>,
  logId: string | undefined,
  status: string,
  errorMessage: string | null
) {
  if (!logId) return;
  await supabase.from("webhook_logs").update({
    status,
    error_message: errorMessage,
    processed_at: new Date().toISOString(),
  }).eq("id", logId);
}
