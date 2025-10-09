-- ============================================
-- Migration 002: Storage Buckets & RLS
-- Smarte Dokumentenablage MVP
-- ============================================

-- 1. Create storage buckets (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('documents', 'documents', false, 2147483648, NULL),  -- 2GB max
  ('previews', 'previews', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);  -- 100MB max

-- 2. RLS Policies for storage.objects - documents bucket

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own files (needed for signed URL generation)
CREATE POLICY "Users can view own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own files
CREATE POLICY "Users can update own documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. RLS Policies for storage.objects - previews bucket

-- Allow authenticated users to upload their own previews
CREATE POLICY "Users can upload own previews"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'previews' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own previews
CREATE POLICY "Users can view own previews"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'previews' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own previews
CREATE POLICY "Users can delete own previews"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'previews' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );