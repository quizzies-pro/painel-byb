# Project Architecture Rules

- The Hub owns Supabase migrations, Edge Functions, shared secrets, and administrative workflows; the separate Members app only consumes student-facing contracts, preventing conflicting backend ownership.
- New commerce webhooks must use the protected, idempotent `webhook-receiver`; do not recreate provider-specific public handlers, preventing unauthenticated writes and duplicated sensitive payloads.
- Product presentation uses `courses.cover_url` as its single responsive image; `banner_url` and `login_cover_url` are legacy-only, preventing duplicate media workflows.
- Product presentation previews live in a reusable admin component fed by unsaved form state, keeping Course and Pack editing visually consistent without duplicating business rules.
