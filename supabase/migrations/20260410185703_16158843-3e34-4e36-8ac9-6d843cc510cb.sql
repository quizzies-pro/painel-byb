
ALTER TABLE public.user_roles
ADD COLUMN permissions jsonb NOT NULL DEFAULT '{
  "courses": {"view": true, "manage": true},
  "modules": {"view": true, "manage": true},
  "lessons": {"view": true, "manage": true},
  "students": {"view": true, "manage": true},
  "enrollments": {"view": true, "manage": true},
  "payments": {"view": true},
  "webhooks": {"view": true, "manage": true},
  "settings": {"view": true},
  "logs": {"view": true},
  "dashboard": {"revenue": true, "students": true, "enrollments": true, "payments": true}
}'::jsonb;
