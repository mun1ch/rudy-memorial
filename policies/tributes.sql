-- Enable RLS on tributes table
ALTER TABLE tributes ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert tributes (for memory submissions)
CREATE POLICY "Public can insert tributes" ON tributes
  FOR INSERT
  WITH CHECK (true);

-- Policy: Public can view approved tributes
CREATE POLICY "Public can view approved tributes" ON tributes
  FOR SELECT
  USING (approved = true AND soft_deleted = false);

-- Policy: Users can view their own tributes (approved or pending)
CREATE POLICY "Users can view own tributes" ON tributes
  FOR SELECT
  USING (
    contributor_id::text = auth.uid()::text
  );

-- Policy: Users can update their own tributes (only if not approved)
CREATE POLICY "Users can update own pending tributes" ON tributes
  FOR UPDATE
  USING (
    contributor_id::text = auth.uid()::text
    AND approved = false
  );

-- Policy: Users can delete their own tributes (only if not approved)
CREATE POLICY "Users can delete own pending tributes" ON tributes
  FOR DELETE
  USING (
    contributor_id::text = auth.uid()::text
    AND approved = false
  );

-- Policy: Admins can view all tributes
CREATE POLICY "Admins can view all tributes" ON tributes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Policy: Admins can update all tributes
CREATE POLICY "Admins can update all tributes" ON tributes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Policy: Admins can delete all tributes (soft delete)
CREATE POLICY "Admins can delete all tributes" ON tributes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );
