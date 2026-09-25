# Project Architecture Rules

- The Hub owns Supabase migrations, Edge Functions, shared secrets, and administrative workflows; the separate Members app only consumes student-facing contracts, preventing conflicting backend ownership.
- New commerce webhooks must use the protected, idempotent `webhook-receiver`; do not recreate provider-specific public handlers, preventing unauthenticated writes and duplicated sensitive payloads.
