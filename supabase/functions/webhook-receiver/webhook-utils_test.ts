import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { makeEventKey, normalizeWebhook, sanitizePayload } from "../_shared/webhook-utils.ts";

Deno.test("normalizes a standard approved purchase", () => {
  const event = normalizeWebhook({
    event: "payment_approved",
    transaction_id: "tx_123",
    product_id: "prod_9",
    customer_email: "BUYER@EXAMPLE.COM",
    customer_name: "Buyer",
    amount: "99.90",
  }, {});
  assertEquals(event.eventType, "approved");
  assertEquals(event.transactionId, "tx_123");
  assertEquals(event.productId, "prod_9");
  assertEquals(event.buyerEmail, "buyer@example.com");
  assertEquals(event.amount, 99.9);
});

Deno.test("supports nested fields and custom event aliases", () => {
  const event = normalizeWebhook({
    topic: "SALE_OK",
    sale: { code: "abc", item: "course-1", email: "a@example.com" },
  }, {
    fields: {
      event: "topic",
      transactionId: "sale.code",
      productId: "sale.item",
      buyerEmail: "sale.email",
    },
    events: { approved: ["SALE_OK"] },
  });
  assertEquals(event.eventType, "approved");
  assertEquals(event.transactionId, "abc");
  assertEquals(event.productId, "course-1");
});

Deno.test("redacts private fields from stored payloads", () => {
  assertEquals(sanitizePayload({
    email: "a@example.com",
    nested: { card_number: "4111111111111111", product_id: "prod_1" },
  }), {
    email: "[REDACTED]",
    nested: { card_number: "[REDACTED]", product_id: "prod_1" },
  });
});

Deno.test("creates stable keys for repeated events", async () => {
  const event = normalizeWebhook({ event: "approved", transaction_id: "tx_1" }, {});
  const first = await makeEventKey("endpoint", event, { event: "approved", transaction_id: "tx_1" });
  const second = await makeEventKey("endpoint", event, { event: "approved", transaction_id: "tx_1", ignored: true });
  assertEquals(first, second);
});