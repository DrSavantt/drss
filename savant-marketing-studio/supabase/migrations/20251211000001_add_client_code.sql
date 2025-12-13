-- ============================================
-- ADD CLIENT_CODE COLUMN TO CLIENTS TABLE
-- ============================================
-- This migration adds a client_code column to the clients table
-- and populates it with sequential codes (CLIENT-001, CLIENT-002, etc.)
-- for existing clients.

-- Add the client_code column if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS client_code TEXT;

-- Create a unique index on client_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code) WHERE client_code IS NOT NULL;

-- Function to generate the next client code
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  new_code TEXT;
BEGIN
  -- Get the highest number from existing client codes
  SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM 'CLIENT-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM clients
  WHERE client_code ~ '^CLIENT-\d+$';
  
  -- Format as CLIENT-XXX with zero padding
  new_code := 'CLIENT-' || LPAD(next_num::TEXT, 3, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Populate client_code for existing clients that don't have one
DO $$
DECLARE
  client_record RECORD;
  new_code TEXT;
BEGIN
  FOR client_record IN 
    SELECT id FROM clients WHERE client_code IS NULL ORDER BY created_at
  LOOP
    new_code := generate_client_code();
    UPDATE clients SET client_code = new_code WHERE id = client_record.id;
  END LOOP;
END $$;

-- Create a trigger to auto-generate client_code for new clients
CREATE OR REPLACE FUNCTION set_client_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.client_code IS NULL THEN
    NEW.client_code := generate_client_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_client_code ON clients;
CREATE TRIGGER trigger_set_client_code
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION set_client_code();

