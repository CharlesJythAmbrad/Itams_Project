-- ==============================================================================
-- SIMPLE ASSETS TABLE SETUP - COPY AND PASTE INTO SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. First run the user creation script if you haven't already
-- (Use the create_working_users.sql file first)

-- 2. Create the assets table based on your existing schema
-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS public.assets CASCADE;

-- Create ENUM types
DO $$ 
BEGIN
    DROP TYPE IF EXISTS asset_category CASCADE;
    DROP TYPE IF EXISTS asset_status CASCADE;
    DROP TYPE IF EXISTS asset_condition CASCADE;
    
    CREATE TYPE asset_category AS ENUM (
      'computer', 'laptop', 'server', 'monitor', 'printer', 'scanner',
      'networking', 'cctv', 'phone', 'tablet', 'projector', 'ups',
      'storage', 'accessory', 'software', 'other'
    );
    
    CREATE TYPE asset_status AS ENUM (
      'in_stock', 'allocated', 'deployed', 'maintenance', 
      'retired', 'disposed', 'lost', 'stolen'
    );
    
    CREATE TYPE asset_condition AS ENUM (
      'excellent', 'good', 'fair', 'poor', 'damaged'
    );
END $$;

-- Create Assets Table (simplified version)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Asset Information
  asset_tag VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category asset_category NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  
  -- Financial Information
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  vendor VARCHAR(255),
  warranty_end_date DATE,
  
  -- Location and Status
  location VARCHAR(255) NOT NULL,
  status asset_status DEFAULT 'in_stock',
  condition asset_condition DEFAULT 'excellent',
  
  -- IT-Specific Fields
  computer_name VARCHAR(100),
  mac_address VARCHAR(17),
  ip_address INET,
  operating_system VARCHAR(100),
  processor VARCHAR(255),
  ram_gb INTEGER,
  storage_gb INTEGER,
  
  -- CCTV-Specific Fields
  camera_resolution VARCHAR(50),
  camera_type VARCHAR(50),
  
  -- Network Equipment Fields
  port_count INTEGER,
  management_ip INET,
  firmware_version VARCHAR(100),
  
  -- General Technical Specifications
  power_consumption_watts INTEGER,
  dimensions VARCHAR(100),
  weight_kg DECIMAL(5,2),
  
  -- Audit Trail
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional Notes
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow authenticated users to access assets
CREATE POLICY "Enable read access for authenticated users" ON public.assets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.assets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.assets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Auto-generate asset tag trigger
CREATE OR REPLACE FUNCTION generate_asset_tag()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_tag VARCHAR(50);
BEGIN
  IF NEW.asset_tag IS NULL OR NEW.asset_tag = '' THEN
    -- Get the next sequential number
    SELECT COALESCE(MAX(CAST(SUBSTRING(asset_tag FROM 'ITAMS-AST-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.assets
    WHERE asset_tag ~ '^ITAMS-AST-\d+$';
    
    -- Generate the new tag with zero-padding
    new_tag := 'ITAMS-AST-' || LPAD(next_number::TEXT, 4, '0');
    NEW.asset_tag := new_tag;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_asset_tag_trigger
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION generate_asset_tag();

-- Grant permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.assets TO anon;

-- Insert sample data
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, status, condition,
  computer_name, mac_address, ip_address, operating_system,
  processor, ram_gb, storage_gb, notes
) VALUES
-- Desktop Computer
('Dell OptiPlex 7090 Desktop', 'High-performance desktop for faculty research', 'computer', 
 'Dell', 'OptiPlex 7090 MT', 'DL7090-FAC001', '2024-01-15', 1299.00, 'Dell Technologies Inc.',
 'Faculty Office 201A', 'deployed', 'excellent',
 'FACULTY-PC-001', '00:1B:44:11:3A:B7', '192.168.10.101', 'Windows 11 Pro 23H2',
 'Intel Core i7-11700 @ 2.5GHz', 16, 512,
 'Includes Dell wireless keyboard and mouse. Dual monitor setup configured.'),

-- Laptop
('Dell Latitude 7440 Laptop', 'Business laptop for mobile faculty', 'laptop',
 'Dell', 'Latitude 7440', 'LAT7440-MOB001', '2024-01-20', 1499.00, 'Dell Technologies Inc.',
 'Mobile Asset Pool', 'in_stock', 'excellent',
 'MOBILE-LAT-001', '54:48:10:C7:8A:2D', NULL, 'Windows 11 Pro 23H2',
 'Intel Core i7-1365U @ 1.3GHz', 16, 512,
 'Includes Dell docking station and travel case. VPN configured.'),

-- MacBook
('Apple MacBook Air M3 15-inch', '15-inch MacBook Air for creative work', 'laptop',
 'Apple', 'MacBook Air 15" M3 2024', 'MBA15M3-CRE001', '2024-02-15', 1799.00, 'Apple Inc.',
 'Creative Lab - Bay 4 Rack A1', 'in_stock', 'excellent',
 'CREATIVE-MBA-001', 'BC:D0:74:A8:9F:E1', NULL, 'macOS Sonoma 14.4',
 'Apple M3 8-core CPU', 16, 512,
 'Final Cut Pro and Logic Pro installed. Excellent for video editing.');

-- Insert more assets with specific field updates
INSERT INTO public.assets (name, category, brand, model, location, status) VALUES
('Cisco Catalyst Switch', 'networking', 'Cisco', 'Catalyst 9300-48P', 'Server Room - Rack 1', 'deployed'),
('Hikvision Security Camera', 'cctv', 'Hikvision', 'DS-2CD2387G2-LU', 'Main Entrance - Ceiling Mount', 'deployed'),
('Dell UltraSharp Monitor', 'monitor', 'Dell', 'UltraSharp U2723QE', 'Faculty Office 201A', 'deployed');

-- Update networking equipment with specific fields
UPDATE public.assets SET
    port_count = 48,
    management_ip = '192.168.1.2',
    firmware_version = '17.12.02'
WHERE category = 'networking';

-- Update CCTV with specific fields
UPDATE public.assets SET
    camera_resolution = '4K',
    camera_type = 'turret',
    mac_address = '64:32:A8:B1:C4:12',
    ip_address = '192.168.100.10'
WHERE category = 'cctv';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ ASSETS TABLE SETUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total Assets Created: %', (SELECT COUNT(*) FROM public.assets);
  RAISE NOTICE '  - Computers: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'computer');
  RAISE NOTICE '  - Laptops: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'laptop');
  RAISE NOTICE '  - Networking: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'networking');
  RAISE NOTICE '  - CCTV: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'cctv');
  RAISE NOTICE '  - Monitors: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'monitor');
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Ready to test! Login with: inventory.staff@itams.edu / Password123!';
  RAISE NOTICE '==============================================';
END $$;