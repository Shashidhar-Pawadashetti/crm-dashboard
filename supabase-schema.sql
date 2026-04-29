-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL CHECK (status IN ('Lead', 'Active', 'Inactive', 'Churned')) DEFAULT 'Lead',
  deal_value NUMERIC DEFAULT 0,
  last_contacted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo purposes)
-- In production, you should restrict this based on authentication
CREATE POLICY "Enable all access for demo" ON contacts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert sample data for testing
INSERT INTO contacts (name, email, phone, company, status, deal_value, last_contacted) VALUES
  ('John Smith', 'john.smith@example.com', '+91 98765 43210', 'Tech Corp', 'Active', 150000, '2024-04-15'),
  ('Sarah Johnson', 'sarah.j@example.com', '+91 87654 32109', 'Innovate Ltd', 'Lead', 75000, '2024-04-10'),
  ('Michael Brown', 'm.brown@example.com', '+91 76543 21098', 'Global Solutions', 'Inactive', 45000, '2024-03-20'),
  ('Emily Davis', 'emily.d@example.com', '+91 65432 10987', 'StartUp Inc', 'Active', 200000, '2024-04-18'),
  ('David Wilson', 'd.wilson@example.com', '+91 54321 09876', 'Enterprise Co', 'Churned', 30000, '2024-02-15'),
  ('Jessica Lee', 'j.lee@example.com', '+91 43210 98765', 'Digital Agency', 'Lead', 120000, '2024-04-20'),
  ('Robert Taylor', 'r.taylor@example.com', '+91 32109 87654', 'Cloud Systems', 'Active', 180000, '2024-04-12'),
  ('Amanda Martinez', 'a.martinez@example.com', '+91 21098 76543', 'Data Solutions', 'Lead', 95000, '2024-04-08');

-- Create a function to handle realtime updates
CREATE OR REPLACE FUNCTION handle_contact_changes()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for realtime updates
CREATE TRIGGER contact_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION handle_contact_changes();
