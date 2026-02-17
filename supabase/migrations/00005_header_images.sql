-- Add header_image column to process_models
ALTER TABLE process_models ADD COLUMN IF NOT EXISTS header_image TEXT;

-- Create storage bucket for header images (public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('header-images', 'header-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view header images" ON storage.objects
  FOR SELECT USING (bucket_id = 'header-images');

CREATE POLICY "Authenticated users can upload header images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'header-images');

CREATE POLICY "Authenticated users can update header images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'header-images');

CREATE POLICY "Authenticated users can delete header images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'header-images');
