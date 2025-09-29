-- Enable RLS on contributors table
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert contributors (for new signups)
CREATE POLICY "Public can insert contributors" ON contributors
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can view their own contributor record
CREATE POLICY "Users can view own contributor record" ON contributors
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Policy: Users can update their own contributor record
CREATE POLICY "Users can update own contributor record" ON contributors
  FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Policy: Admins can view all contributors
CREATE POLICY "Admins can view all contributors" ON contributors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );

-- Policy: Admins can update all contributors
CREATE POLICY "Admins can update all contributors" ON contributors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contributors 
      WHERE id::text = auth.uid()::text 
      AND is_admin = true
    )
  );
