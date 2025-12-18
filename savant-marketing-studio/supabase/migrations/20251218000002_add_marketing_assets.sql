-- Create marketing_assets table for AI Assets Library
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('framework', 'brand_guideline', 'template', 'strategy', 'example_copy')),
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_marketing_assets_user_id ON marketing_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_category ON marketing_assets(category);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_is_active ON marketing_assets(is_active);

-- Enable Row Level Security
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only manage their own assets
CREATE POLICY "Users can manage own assets" 
  ON marketing_assets
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketing_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_marketing_assets_updated_at
  BEFORE UPDATE ON marketing_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_assets_updated_at();

