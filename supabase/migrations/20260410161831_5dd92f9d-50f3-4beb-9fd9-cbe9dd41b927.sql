UPDATE auth.users 
SET 
  raw_user_meta_data = raw_user_meta_data || '{"display_name": "Gabriel", "phone": "+5533987116164"}'::jsonb,
  phone = '+5533987116164',
  updated_at = now()
WHERE id = '28f029e8-eb52-4397-8d94-524c5f3290b5';
