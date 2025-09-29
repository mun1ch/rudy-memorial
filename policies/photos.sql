-- Enable RLS on photos table
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert photos (for uploads)
CREATE POLICY "Public can insert photos" ON photos
  FOR INSERT
  WITH CHECK (true);

-- Policy: Public can view approved photos
CREATE POLICY "Public can view approved photos" ON photos
  FOR SELECT
  USING (approved = true AND soft_deleted = false);

-- Policy: Users can view their own photos (approved or pending)
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT
  USING (
    contributor_id::text = auth.uid()::text
  );

-- Policy: Users can update their own photos (only if not approved)
CREATE POLICY "Users can update own pending photos" ON photos
  FOR UPDATE
  USING (
    contributor_id::text = auth.uid()::text
    AND approved = false
  );

-- Policy: Users can delete their own photos (only if not approved)
CREATE POLICY "Users can delete own pending photos" ON photos
  FOR DELETE
  USING (
    contributor_id::text = auth.uid()::text
    AND approved = false
  );

-- Policy: Admins can view all photos
CREATE POLICY "Admins can view all photos" ON photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Policy: Admins can update all photos
CREATE POLICY "Admins can update all photos" ON photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Policy: Admins can delete all photos (soft delete)
CREATE POLICY "Admins can delete all photos" ON photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );
