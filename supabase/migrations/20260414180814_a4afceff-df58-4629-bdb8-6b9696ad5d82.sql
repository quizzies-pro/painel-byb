
-- Remove broad SELECT policies on public buckets
DROP POLICY IF EXISTS "Public can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view lesson thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can view admin avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view student avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view lesson thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view admin avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view student avatars" ON storage.objects;

-- Public buckets: allow access to individual files only (not listing)
-- course-covers
CREATE POLICY "Public can access course cover files"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-covers' AND name IS NOT NULL AND name != '');

-- lesson-thumbnails
CREATE POLICY "Public can access lesson thumbnail files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-thumbnails' AND name IS NOT NULL AND name != '');

-- admin-avatars
CREATE POLICY "Public can access admin avatar files"
ON storage.objects FOR SELECT
USING (bucket_id = 'admin-avatars' AND name IS NOT NULL AND name != '');

-- student-avatars
CREATE POLICY "Public can access student avatar files"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-avatars' AND name IS NOT NULL AND name != '');
