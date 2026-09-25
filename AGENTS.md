# Project Architecture Rules

- The Hub owns Supabase migrations, Edge Functions, shared secrets, and administrative workflows; the separate Members app only consumes student-facing contracts, preventing conflicting backend ownership.
- New commerce webhooks must use the protected, idempotent `webhook-receiver`; do not recreate provider-specific public handlers, preventing unauthenticated writes and duplicated sensitive payloads.
- Product presentation uses distinct `courses` cover assets (16:9, 4:3, 1:1, 3:4, 9:16) and hero assets (16:9, 4:3); `cover_url` and `banner_url` remain transition fallbacks and `login_cover_url` remains legacy-only, allowing the Members app to choose artwork by context without breaking existing products.
- Product presentation previews live in a reusable admin component fed by unsaved form state, keeping Course and Pack editing visually consistent without duplicating business rules.
- Administrative overlays use shared size variants, fixed headers and footers, scrollable bodies, and a promise-based confirmation provider, keeping popup UX consistent without changing business flows.
