DROP INDEX public.pack_items_drive_file_unique_idx;
CREATE UNIQUE INDEX pack_items_drive_file_unique_idx
  ON public.pack_items(course_id, drive_file_id);