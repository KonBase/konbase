-- Migration: Add QR/Barcode Support
-- Description: Adds support for QR codes and barcodes in inventory management

-- Create code_prefixes table for managing QR/barcode prefixes
CREATE TABLE IF NOT EXISTS public.code_prefixes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) > 0),
  prefix text NOT NULL CHECK (char_length(prefix) >= 2 AND char_length(prefix) <= 10),
  description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true NOT NULL,
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure unique prefixes per association
  UNIQUE(prefix, association_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_code_prefixes_association_id ON public.code_prefixes(association_id);
CREATE INDEX IF NOT EXISTS idx_code_prefixes_prefix ON public.code_prefixes(prefix);
CREATE INDEX IF NOT EXISTS idx_code_prefixes_active ON public.code_prefixes(is_active);

-- Add comments
COMMENT ON TABLE public.code_prefixes IS 'Stores configuration for QR/barcode code prefixes used in inventory management';
COMMENT ON COLUMN public.code_prefixes.prefix IS 'The prefix used for generating unique codes (2-10 characters, uppercase)';
COMMENT ON COLUMN public.code_prefixes.name IS 'Human-readable name for the prefix';
COMMENT ON COLUMN public.code_prefixes.description IS 'Optional description of the prefix purpose';
COMMENT ON COLUMN public.code_prefixes.category_id IS 'Optional link to a category for automatic prefix assignment';

-- Add item_code column to items table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'item_code'
  ) THEN
    ALTER TABLE public.items ADD COLUMN item_code text;
    CREATE INDEX IF NOT EXISTS idx_items_item_code ON public.items(item_code);
    COMMENT ON COLUMN public.items.item_code IS 'Auto-generated unique code for QR/barcode identification';
  END IF;
END $$;

-- Create RLS policies for code_prefixes
ALTER TABLE public.code_prefixes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view prefixes for their association
CREATE POLICY "Users can view prefixes for their association" ON public.code_prefixes
  FOR SELECT USING (
    association_id IN (
      SELECT association_id FROM public.association_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert prefixes for their association
CREATE POLICY "Users can insert prefixes for their association" ON public.code_prefixes
  FOR INSERT WITH CHECK (
    association_id IN (
      SELECT association_id FROM public.association_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update prefixes for their association
CREATE POLICY "Users can update prefixes for their association" ON public.code_prefixes
  FOR UPDATE USING (
    association_id IN (
      SELECT association_id FROM public.association_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete prefixes for their association
CREATE POLICY "Users can delete prefixes for their association" ON public.code_prefixes
  FOR DELETE USING (
    association_id IN (
      SELECT association_id FROM public.association_members 
      WHERE user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for code_prefixes updated_at
CREATE TRIGGER update_code_prefixes_updated_at 
  BEFORE UPDATE ON public.code_prefixes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
