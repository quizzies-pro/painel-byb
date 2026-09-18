import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import {
  makeEventKey,
  normalizeWebhook,
  sanitizePayload,
  type NormalizedWebhook,
  type WebhookPayload,
} from "../_shared/webhook-utils.ts";

const PayloadSchema = z.record(z.unknown());
const MEMBER_APP_URL = (Deno.env.get("MEMBER_APP_URL") ?? "https://membros.diveclube.com.br").replace(/\/$/, "");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bearerToken(req: Request, payload: WebhookPayload): string {
  const authorization = req.headers.get("authorization") ?? "";
  const fromHeader = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : authorization.trim();
  const fromPayload = typeof payload.token === "string" ? payload.token : "";
  return req.headers.get("x-webhook-token")?.trim() || fromHeader || fromPayload;
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Limite de usuários atingido ao localizar o comprador");
}

async function ensureStudent(supabase: SupabaseClient, event: NormalizedWebhook, source: string) {
  const { data: existingStudent, error: studentLookupError } = await supabase
    .from("students")
    .select("id, auth_user_id")
    .ilike("email", event.buyerEmail)
    .maybeSingle();
  if (studentLookupError) throw studentLookupError;

  let authUserId = existingStudent?.auth_user_id ?? null;
  if (!authUserId) {
    const existingAuthUser = await findAuthUserByEmail(supabase, event.buyerEmail);
    if (existingAuthUser) {
      authUserId = existingAuthUser.id;
    } else {
      const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        event.buyerEmail,
        { redirectTo: `${MEMBER_APP_URL}/reset-password`, data: { name: event.buyerName } },
      );
      if (inviteError || !invited.user) throw inviteError ?? new Error("Não foi possível enviar o acesso ao aluno");
      authUserId = invited.user.id;
    }
  }

  const studentValues = {
    name: event.buyerName,
    email: event.buyerEmail,
    phone: event.buyerPhone,
    cpf: event.buyerCpf,
    status: "active",
    origin: source,
    auth_user_id: authUserId,
  };

  if (existingStudent) {
    const { data, error } = await supabase
      .from("students")
      .update(studentValues)
      .eq("id", existingStudent.id)
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  const { data, error } = await supabase.from("students").insert(studentValues).select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function processApproval(
  supabase: SupabaseClient,
  endpoint: Record<string, unknown>,
  webhookEventId: string,
  event: NormalizedWebhook,
  payload: WebhookPayload,
) {
  if (!event.transactionId || !event.productId || !event.buyerEmail || !z.string().email().safeParse(event.buyerEmail).success) {
    throw new Error("Evento aprovado sem transação, produto ou e-mail válido");
  }

  const { data: mapping, error: mappingError } = await supabase
    .from("webhook_product_mappings")
    .select("course_id")
    .eq("webhook_endpoint_id", endpoint.id)
    .eq("external_product_id", event.productId)
    .eq("is_active", true)
    .maybeSingle();
  if (mappingError) throw mappingError;
  if (!mapping) throw new Error(`Produto externo não mapeado: ${event.productId}`);

  const studentId = await ensureStudent(supabase, event, String(endpoint.source));
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("access_type, access_days")
    .eq("id", mapping.course_id)
    .single();
  if (courseError) throw courseError;

  const approvedAt = new Date().toISOString();
  const paymentValues = {
    external_order_id: event.orderId,
    student_id: studentId,
    course_id: mapping.course_id,
    product_name: event.productName,
    product_id: event.productId,
    amount: event.amount,
    currency: event.currency,
    payment_method: event.paymentMethod,
    installments: event.installments,
    status: "approved",
    purchased_at: event.purchasedAt,
    approved_at: approvedAt,
    canceled_at: null,
    raw_payload: sanitizePayload(payload),
    origin: String(endpoint.source),
    webhook_event_id: webhookEventId,
  };
  const { data: existingPayment, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id")
    .eq("webhook_endpoint_id", endpoint.id)
    .eq("external_payment_id", event.transactionId)
    .maybeSingle();
  if (paymentLookupError) throw paymentLookupError;
  const paymentQuery = existingPayment
    ? supabase.from("payments").update(paymentValues).eq("id", existingPayment.id)
    : supabase.from("payments").insert({
        ...paymentValues,
        webhook_endpoint_id: endpoint.id,
        external_payment_id: event.transactionId,
      });
  const { error: paymentError } = await paymentQuery;
  if (paymentError) throw paymentError;

  const expiresAt = course.access_type === "limited" && course.access_days
    ? new Date(Date.now() + Number(course.access_days) * 86_400_000).toISOString()
    : null;
  const { error: enrollmentError } = await supabase.from("enrollments").upsert(
    {
      student_id: studentId,
      course_id: mapping.course_id,
      origin: "purchase",
      status: "active",
      started_at: approvedAt,
      expires_at: expiresAt,
      notes: `Liberado automaticamente pelo webhook ${String(endpoint.name)}`,
    },
    { onConflict: "student_id,course_id" },
  );
  if (enrollmentError) throw enrollmentError;
}

async function processReversal(
  supabase: SupabaseClient,
  endpointId: string,
  webhookEventId: string,
  event: NormalizedWebhook,
) {
  if (!event.transactionId) throw new Error("Evento de estorno sem identificação da transação");
  const status = event.eventType === "refunded" ? "refunded" : event.eventType === "chargeback" ? "chargeback" : "canceled";
  const { data: payment, error } = await supabase
    .from("payments")
    .update({ status, canceled_at: new Date().toISOString(), webhook_event_id: webhookEventId })
    .eq("webhook_endpoint_id", endpointId)
    .eq("external_payment_id", event.transactionId)
    .select("student_id, course_id, product_id")
    .maybeSingle();
  if (error) throw error;
  if (!payment?.course_id) throw new Error(`Pagamento não encontrado: ${event.transactionId}`);

  const { data: mapping, error: mappingError } = await supabase
    .from("webhook_product_mappings")
    .select("revoke_on_refund, revoke_on_chargeback")
    .eq("webhook_endpoint_id", endpointId)
    .eq("external_product_id", payment.product_id)
    .maybeSingle();
  if (mappingError) throw mappingError;
  const shouldRevoke = event.eventType === "refunded"
    ? mapping?.revoke_on_refund !== false
    : event.eventType === "chargeback"
      ? mapping?.revoke_on_chargeback !== false
      : true;
  if (!shouldRevoke) return;

  const { count, error: countError } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("student_id", payment.student_id)
    .eq("course_id", payment.course_id)
    .eq("status", "approved");
  if (countError) throw countError;
  if ((count ?? 0) === 0) {
    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .update({ status: "blocked", notes: `Acesso bloqueado automaticamente: ${status}` })
      .eq("student_id", payment.student_id)
      .eq("course_id", payment.course_id);
    if (enrollmentError) throw enrollmentError;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server configuration error" }, 500);
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const slug = new URL(req.url).pathname.split("/").filter(Boolean).at(-1);
  if (!slug || slug === "webhook-receiver") return json({ error: "Missing webhook slug" }, 400);
  const { data: endpoint, error: endpointError } = await supabase
    .from("webhook_endpoints")
    .select("id, name, source, slug, is_active, event_mapping")
    .eq("slug", slug)
    .maybeSingle();
  if (endpointError || !endpoint) return json({ error: "Webhook endpoint not found" }, 404);
  if (!endpoint.is_active) return json({ error: "Webhook endpoint is disabled" }, 403);

  let rawPayload: unknown;
  try {
    rawPayload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsedPayload = PayloadSchema.safeParse(rawPayload);
  if (!parsedPayload.success) return json({ error: "Payload must be a JSON object" }, 400);
  const payload = parsedPayload.data;

  const token = bearerToken(req, payload);
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: validSecret, error: secretError } = await supabase.rpc("verify_webhook_secret", {
    _endpoint_id: endpoint.id,
    _provided_secret: token,
  });
  if (secretError || validSecret !== true) return json({ error: "Unauthorized" }, 401);

  const normalized = normalizeWebhook(payload, endpoint.event_mapping);
  const eventKey = await makeEventKey(endpoint.id, normalized, payload);
  const safePayload = sanitizePayload(payload) as Record<string, unknown>;
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id, status")
    .eq("webhook_endpoint_id", endpoint.id)
    .eq("event_key", eventKey)
    .maybeSingle();
  if (existingEvent?.status === "processed" || existingEvent?.status === "ignored") {
    return json({ status: "duplicate", event_id: existingEvent.id });
  }

  let webhookEventId = existingEvent?.id as string | undefined;
  if (webhookEventId) {
    const { error } = await supabase.from("webhook_events").update({ status: "processing", error_message: null }).eq("id", webhookEventId);
    if (error) return json({ error: "Could not prepare event" }, 500);
  } else {
    const { data, error } = await supabase.from("webhook_events").insert({
      webhook_endpoint_id: endpoint.id,
      event_key: eventKey,
      event_type: normalized.rawEventType || normalized.eventType,
      external_transaction_id: normalized.transactionId || null,
      external_product_id: normalized.productId || null,
      buyer_email: normalized.buyerEmail || null,
      status: "processing",
      sanitized_payload: safePayload,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") return json({ status: "duplicate" });
      return json({ error: "Could not register event" }, 500);
    }
    webhookEventId = data.id;
  }

  const { data: log } = await supabase.from("webhook_logs").insert({
    source: endpoint.source,
    event_type: normalized.rawEventType || normalized.eventType,
    payload: safePayload,
    status: "received",
    webhook_endpoint_id: endpoint.id,
  }).select("id").single();

  try {
    if (normalized.eventType === "approved") {
      await processApproval(supabase, endpoint, webhookEventId, normalized, payload);
    } else if (["refunded", "chargeback", "canceled"].includes(normalized.eventType)) {
      await processReversal(supabase, endpoint.id, webhookEventId, normalized);
    } else if (normalized.eventType === "pending") {
      // Pending events remain recorded, but access is granted only after approval.
    } else {
      await supabase.from("webhook_events").update({
        status: "ignored",
        error_message: `Evento não suportado: ${normalized.rawEventType || "sem tipo"}`,
        processed_at: new Date().toISOString(),
      }).eq("id", webhookEventId);
      if (log?.id) await supabase.from("webhook_logs").update({ status: "ignored", processed_at: new Date().toISOString() }).eq("id", log.id);
      return json({ status: "ignored", event_id: webhookEventId });
    }

    const processedAt = new Date().toISOString();
    await Promise.all([
      supabase.from("webhook_events").update({ status: "processed", processed_at: processedAt }).eq("id", webhookEventId),
      log?.id ? supabase.from("webhook_logs").update({ status: "processed", processed_at: processedAt }).eq("id", log.id) : Promise.resolve(),
      supabase.from("webhook_endpoints").update({ last_received_at: processedAt }).eq("id", endpoint.id),
    ]);
    return json({ status: "ok", event_id: webhookEventId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    const processedAt = new Date().toISOString();
    await Promise.all([
      supabase.from("webhook_events").update({ status: "failed", error_message: message, processed_at: processedAt }).eq("id", webhookEventId),
      log?.id ? supabase.from("webhook_logs").update({ status: "failed", error_message: message, processed_at: processedAt }).eq("id", log.id) : Promise.resolve(),
    ]);
    return json({ error: message, event_id: webhookEventId }, 422);
  }
});