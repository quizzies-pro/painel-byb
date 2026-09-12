export type WebhookPayload = Record<string, unknown>;

export type NormalizedEventType =
  | "pending"
  | "approved"
  | "refunded"
  | "chargeback"
  | "canceled"
  | "unknown";

export interface NormalizedWebhook {
  eventType: NormalizedEventType;
  rawEventType: string;
  transactionId: string;
  productId: string;
  productName: string | null;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string | null;
  buyerCpf: string | null;
  orderId: string | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  installments: number;
  purchasedAt: string;
}

type EventMapping = {
  fields?: Record<string, string>;
  events?: Partial<Record<Exclude<NormalizedEventType, "unknown">, string[] | string>>;
};

const DEFAULT_PATHS: Record<string, string[]> = {
  event: ["event", "event_type", "type", "action", "status"],
  transactionId: ["transaction_id", "payment_id", "transaction.id", "payment.id", "data.id", "id"],
  productId: ["product_id", "product.id", "item.product_id", "data.product.id", "data.product_id"],
  productName: ["product_name", "product.name", "item.name", "data.product.name"],
  buyerEmail: ["customer_email", "buyer_email", "email", "customer.email", "buyer.email", "data.customer.email"],
  buyerName: ["customer_name", "buyer_name", "name", "customer.name", "buyer.name", "data.customer.name"],
  buyerPhone: ["customer_phone", "phone", "customer.phone", "buyer.phone", "data.customer.phone"],
  buyerCpf: ["customer_cpf", "cpf", "document", "customer.document", "buyer.document", "data.customer.document"],
  orderId: ["order_id", "order.id", "data.order.id"],
  amount: ["amount", "value", "price", "payment.amount", "data.amount"],
  currency: ["currency", "payment.currency", "data.currency"],
  paymentMethod: ["payment_method", "payment.method", "data.payment_method"],
  installments: ["installments", "payment.installments", "data.installments"],
  purchasedAt: ["purchased_at", "paid_at", "created_at", "data.created_at"],
};

const DEFAULT_EVENTS: Record<Exclude<NormalizedEventType, "unknown">, string[]> = {
  pending: ["pending", "purchase_created", "order_created", "waiting_payment", "created"],
  approved: ["approved", "payment_approved", "purchase_approved", "paid", "completed", "complete", "success"],
  refunded: ["refunded", "payment_refunded", "refund", "purchase_refunded"],
  chargeback: ["chargeback", "payment_chargeback", "dispute", "disputed"],
  canceled: ["canceled", "cancelled", "payment_canceled", "purchase_canceled", "expired"],
};

function readPath(payload: WebhookPayload, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as Record<string, unknown>)[key];
  }, payload);
}

function firstValue(payload: WebhookPayload, paths: string[]): unknown {
  for (const path of paths) {
    const value = readPath(payload, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asString(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function pathsFor(field: string, mapping: EventMapping): string[] {
  const configured = mapping.fields?.[field];
  return configured ? [configured, ...(DEFAULT_PATHS[field] ?? [])] : (DEFAULT_PATHS[field] ?? []);
}

function normalizeEvent(rawEvent: string, mapping: EventMapping): NormalizedEventType {
  const normalized = rawEvent.trim().toLowerCase();
  for (const type of ["pending", "approved", "refunded", "chargeback", "canceled"] as const) {
    const custom = mapping.events?.[type];
    const aliases = Array.isArray(custom) ? custom : custom ? [custom] : [];
    if ([...aliases, ...DEFAULT_EVENTS[type]].map((value) => value.toLowerCase()).includes(normalized)) return type;
  }
  return "unknown";
}

export function normalizeWebhook(payload: WebhookPayload, rawMapping: unknown): NormalizedWebhook {
  const mapping = rawMapping && typeof rawMapping === "object" ? rawMapping as EventMapping : {};
  const get = (field: string) => firstValue(payload, pathsFor(field, mapping));
  const rawEventType = asString(get("event"));
  const amountValue = Number(get("amount") ?? 0);
  const installmentsValue = Number(get("installments") ?? 1);
  const dateValue = asString(get("purchasedAt"));

  return {
    eventType: normalizeEvent(rawEventType, mapping),
    rawEventType,
    transactionId: asString(get("transactionId")),
    productId: asString(get("productId")),
    productName: asString(get("productName")) || null,
    buyerEmail: asString(get("buyerEmail")).toLowerCase(),
    buyerName: asString(get("buyerName")) || "Aluno",
    buyerPhone: asString(get("buyerPhone")) || null,
    buyerCpf: asString(get("buyerCpf")) || null,
    orderId: asString(get("orderId")) || null,
    amount: Number.isFinite(amountValue) ? amountValue : 0,
    currency: asString(get("currency")).toUpperCase() || "BRL",
    paymentMethod: asString(get("paymentMethod")) || null,
    installments: Number.isInteger(installmentsValue) && installmentsValue > 0 ? installmentsValue : 1,
    purchasedAt: dateValue && !Number.isNaN(Date.parse(dateValue)) ? new Date(dateValue).toISOString() : new Date().toISOString(),
  };
}

const SENSITIVE_KEYS = /token|secret|authorization|password|senha|card|document|cpf|phone|email/i;

export function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizePayload);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, child]) => [
      key,
      SENSITIVE_KEYS.test(key) ? "[REDACTED]" : sanitizePayload(child),
    ]),
  );
}

export async function makeEventKey(endpointId: string, event: NormalizedWebhook, payload: WebhookPayload): Promise<string> {
  const stablePart = event.transactionId
    ? `${event.eventType}:${event.transactionId}`
    : JSON.stringify(payload, Object.keys(payload).sort());
  const bytes = new TextEncoder().encode(`${endpointId}:${stablePart}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}