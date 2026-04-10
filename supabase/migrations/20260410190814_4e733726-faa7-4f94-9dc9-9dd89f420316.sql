
-- Add avatar_url to user_roles
ALTER TABLE public.user_roles
ADD COLUMN avatar_url text;

-- Create storage bucket for admin avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-avatars', 'admin-avatars', true);

-- Public read access
CREATE POLICY "Anyone can view admin avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-avatars');

-- Admins can upload their own avatar
CREATE POLICY "Admins can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can update their own avatar
CREATE POLICY "Admins can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete their own avatar
CREATE POLICY "Admins can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
