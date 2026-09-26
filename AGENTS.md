# Project Architecture Rules

- The Hub owns Supabase migrations, Edge Functions, shared secrets, and administrative workflows; the separate Members app only consumes student-facing contracts, preventing conflicting backend ownership.
- New commerce webhooks must use the protected, idempotent `webhook-receiver`; do not recreate provider-specific public handlers, preventing unauthenticated writes and duplicated sensitive payloads.
- Product presentation uses distinct `courses` cover assets (16:9, 4:3, 1:1, 3:4, 9:16) and hero assets (16:9, 4:3); `cover_url` and `banner_url` remain transition fallbacks and `login_cover_url` remains legacy-only, allowing the Members app to choose artwork by context without breaking existing products.
- Product presentation previews live in a reusable admin component fed by unsaved form state, keeping Course and Pack editing visually consistent without duplicating business rules.
- Administrative overlays use shared size variants, fixed headers and footers, scrollable bodies, and a promise-based confirmation provider, keeping popup UX consistent without changing business flows.
- Admin forms stay in context after saves; student profiles own inline product enrollment management, avoiding duplicate records and navigation interruptions.
- Administrative back arrows use browser history with a safe section fallback, preserving the user's actual editing path instead of forcing fixed destinations.
- Authentication uses the full-page loading state only during initial session resolution; later auth refreshes update permissions without unmounting active admin forms, preserving unsaved work.
- Pack item and collection covers store an explicit ratio (`1:1`, `16:9`, `4:3`, `3:4`, or `9:16`); Hub and Members independently preserve each asset without a forced crop.
- Packs use the same publication, storefront, and sale controls as Courses; delivery format remains immutable and sale still requires a checkout URL.
