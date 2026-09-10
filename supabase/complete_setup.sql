-- ==============================================================================
-- COMPLETE IT ASSETS MANAGEMENT SETUP FOR SUPABASE
-- Run this entire file in Supabase SQL Editor
-- ==============================================================================

-- 1. Create ENUM types for asset categories and statuses
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category') THEN
        CREATE TYPE asset_category AS ENUM (
          'computer', 'laptop', 'server', 'monitor', 'printer', 'scanner',
          'networking', 'cctv', 'phone', 'tablet', 'projector', 'ups',
          'storage', 'accessory', 'software', 'other'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE asset_status AS ENUM (
          'in_stock', 'allocated', 'deployed', 'maintenance', 
          'retired', 'disposed', 'lost', 'stolen'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition') THEN
        CREATE TYPE asset_condition AS ENUM (
          'excellent', 'good', 'fair', 'poor', 'damaged'
        );
    END IF;
END $$;

-- 2. Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.asset_history CASCADE;
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;

-- 3. Main Assets Table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Asset Information
  asset_tag VARCHAR(50) UNIQUE NOT NULL, -- e.g., ITAMS-AST-0001
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category asset_category NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100) UNIQUE,
  
  -- Financial Information
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  
  -- Warranty Information
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_provider VARCHAR(255),
  warranty_type VARCHAR(100),
  
  -- Location and Status
  location VARCHAR(255),
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
  network_domain VARCHAR(100),
  
  -- CCTV-Specific Fields
  camera_resolution VARCHAR(50),
  camera_type VARCHAR(50),
  recording_capacity_tb DECIMAL(5,2),
  
  -- Network Equipment Fields
  port_count INTEGER,
  management_ip INET,
  firmware_version VARCHAR(100),
  
  -- General Technical Specifications
  power_consumption_watts INTEGER,
  dimensions VARCHAR(100),
  weight_kg DECIMAL(5,2),
  
  -- Tracking Information
  assigned_to UUID REFERENCES public.users(id),
  assigned_date TIMESTAMPTZ,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  
  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional Notes
  notes TEXT,
  qr_code TEXT,
  barcode TEXT,
  photo_url TEXT
);

-- 4. Asset History Table
CREATE TABLE public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Change Information
  action VARCHAR(50) NOT NULL,
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  -- Context
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  notes TEXT
);

-- 5. Asset Assignments Table
CREATE TABLE public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.users(id),
  
  -- Assignment Details
  assigned_by UUID REFERENCES public.users(id),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  expected_return_date DATE,
  actual_return_date TIMESTAMPTZ,
  
  -- Status and Condition
  assignment_status VARCHAR(50) DEFAULT 'active',
  condition_on_assignment asset_condition,
  condition_on_return asset_condition,
  
  -- Location and Purpose
  deployment_location VARCHAR(255),
  purpose TEXT,
  special_instructions TEXT,
  
  -- Return Information
  returned_by UUID REFERENCES public.users(id),
  return_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (simplified for quick setup)
DROP POLICY IF EXISTS "Assets viewable by inventory and ITSD" ON public.assets;
DROP POLICY IF EXISTS "Assets manageable by inventory and ITSD" ON public.assets;
DROP POLICY IF EXISTS "Asset history viewable by inventory and ITSD" ON public.asset_history;
DROP POLICY IF EXISTS "Asset history manageable by inventory and ITSD" ON public.asset_history;
DROP POLICY IF EXISTS "Asset assignments viewable by authorized users" ON public.asset_assignments;
DROP POLICY IF EXISTS "Asset assignments manageable by inventory and ITSD" ON public.asset_assignments;

-- Simplified policies for quick setup
CREATE POLICY "Assets viewable by inventory and ITSD"
  ON public.assets FOR SELECT
  USING (
    public.get_auth_user_role() IN ('itsd', 'inventory_staff')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Assets manageable by inventory and ITSD"
  ON public.assets FOR ALL
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

CREATE POLICY "Asset history viewable by inventory and ITSD"
  ON public.asset_history FOR SELECT
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

CREATE POLICY "Asset history manageable by inventory and ITSD"
  ON public.asset_history FOR INSERT
  WITH CHECK (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

CREATE POLICY "Asset assignments viewable by authorized users"
  ON public.asset_assignments FOR SELECT
  USING (
    public.get_auth_user_role() IN ('itsd', 'inventory_staff')
    OR assigned_to = auth.uid()
    OR assigned_by = auth.uid()
  );

CREATE POLICY "Asset assignments manageable by inventory and ITSD"
  ON public.asset_assignments FOR ALL
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

-- 8. Indexes for Performance
CREATE INDEX idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON public.assets(serial_number);
CREATE INDEX idx_assets_category ON public.assets(category);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_assigned_to ON public.assets(assigned_to);
CREATE INDEX idx_assets_mac_address ON public.assets(mac_address);
CREATE INDEX idx_assets_computer_name ON public.assets(computer_name);
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);
CREATE INDEX idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_assigned_to ON public.asset_assignments(assigned_to);

-- 9. Triggers for automated functionality

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON public.assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_assignments_updated_at 
  BEFORE UPDATE ON public.asset_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Asset history logging trigger
CREATE OR REPLACE FUNCTION log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the creation of new assets
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.asset_history (
      asset_id, action, performed_by, notes
    ) VALUES (
      NEW.id, 'created', NEW.created_by, 'Asset created'
    );
    RETURN NEW;
  END IF;
  
  -- Log updates to existing assets
  IF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO public.asset_history (
        asset_id, action, field_changed, old_value, new_value, performed_by
      ) VALUES (
        NEW.id, 'status_changed', 'status', OLD.status::TEXT, NEW.status::TEXT, NEW.updated_by
      );
    END IF;
    
    -- Log assignment changes
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.asset_history (
        asset_id, action, field_changed, old_value, new_value, performed_by
      ) VALUES (
        NEW.id, 'assignment_changed', 'assigned_to', 
        COALESCE(OLD.assigned_to::TEXT, 'unassigned'), 
        COALESCE(NEW.assigned_to::TEXT, 'unassigned'), 
        NEW.updated_by
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_asset_changes_trigger
  AFTER INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION log_asset_changes();

-- 10. Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.asset_history TO authenticated;
GRANT ALL ON public.asset_assignments TO authenticated;

-- 11. Insert sample data
DO $$
DECLARE
  inventory_user_id UUID;
BEGIN
  -- Get the inventory staff user ID
  SELECT id INTO inventory_user_id 
  FROM public.users 
  WHERE role = 'inventory_staff' 
  LIMIT 1;
  
  -- If no inventory staff user exists, use the first ITSD user
  IF inventory_user_id IS NULL THEN
    SELECT id INTO inventory_user_id 
    FROM public.users 
    WHERE role = 'itsd' 
    LIMIT 1;
  END IF;

  -- Insert sample assets
  INSERT INTO public.assets (
    name, description, category, brand, model, serial_number,
    purchase_date, purchase_cost, vendor, warranty_start_date, warranty_end_date, warranty_provider,
    location, status, condition, computer_name, mac_address, ip_address, operating_system,
    processor, ram_gb, storage_gb, network_domain, created_by, updated_by
  ) VALUES
  -- Desktop Computers
  ('Dell OptiPlex 7090 Desktop', 'High-performance desktop for faculty research', 'computer', 
   'Dell', 'OptiPlex 7090 MT', 'DL7090-FAC001', '2024-01-15', 1299.00, 'Dell Technologies Inc.',
   '2024-01-15', '2027-01-15', 'Dell ProSupport Plus', 'Faculty Office 201A', 'deployed', 'excellent',
   'FACULTY-PC-001', '00:1B:44:11:3A:B7', '192.168.10.101', 'Windows 11 Pro 23H2',
   'Intel Core i7-11700 @ 2.5GHz', 16, 512, 'itams.edu', inventory_user_id, inventory_user_id),
   
  ('HP EliteDesk 800 G9 Desktop', 'Standard desktop computer for administrative staff', 'computer',
   'HP', 'EliteDesk 800 G9 SFF', 'HP800G9-ADM001', '2024-02-10', 899.00, 'HP Inc.',
   '2024-02-10', '2027-02-10', 'HP Care Pack', 'Admin Building - Room 105', 'deployed', 'excellent',
   'ADMIN-PC-001', '2C:44:FD:78:E2:A1', '192.168.10.105', 'Windows 11 Pro 23H2',
   'Intel Core i5-12500 @ 3.0GHz', 8, 256, 'itams.edu', inventory_user_id, inventory_user_id),

  -- Laptops
  ('Dell Latitude 7440 Laptop', 'Business laptop for mobile faculty', 'laptop',
   'Dell', 'Latitude 7440', 'LAT7440-MOB001', '2024-01-20', 1499.00, 'Dell Technologies Inc.',
   '2024-01-20', '2027-01-20', 'Dell ProSupport Plus', 'Mobile Asset Pool', 'in_stock', 'excellent',
   'MOBILE-LAT-001', '54:48:10:C7:8A:2D', NULL, 'Windows 11 Pro 23H2',
   'Intel Core i7-1365U @ 1.3GHz', 16, 512, 'itams.edu', inventory_user_id, inventory_user_id),
   
  ('Apple MacBook Air M3 15-inch', '15-inch MacBook Air for creative work', 'laptop',
   'Apple', 'MacBook Air 15" M3 2024', 'MBA15M3-CRE001', '2024-02-15', 1799.00, 'Apple Inc.',
   '2024-02-15', '2025-02-15', 'AppleCare+', 'Creative Lab - Bay 4 Rack A1', 'in_stock', 'excellent',
   'CREATIVE-MBA-001', 'BC:D0:74:A8:9F:E1', NULL, 'macOS Sonoma 14.4',
   'Apple M3 8-core CPU', 16, 512, 'creative.itams.edu', inventory_user_id, inventory_user_id),

  -- Networking Equipment
  ('Cisco Catalyst 9300-48P Switch', '48-port Gigabit managed switch for core network', 'networking',
   'Cisco', 'Catalyst 9300-48P', 'C9300-CORE-001', '2023-12-05', 4200.00, 'Cisco Systems Inc.',
   '2023-12-05', '2028-12-05', 'Cisco SmartNet Total Care', 'Server Room - Network Rack Position 10', 'deployed', 'excellent',
   'CORE-SW-001', '70:B3:17:F4:2A:80', '192.168.1.2', 'Cisco IOS XE 17.12.02',
   NULL, NULL, NULL, 'network.itams.edu', inventory_user_id, inventory_user_id),

  -- CCTV Camera
  ('Hikvision DS-2CD2387G2-LU ColorVu Turret', '8MP 4K ColorVu IP camera with night vision', 'cctv',
   'Hikvision', 'DS-2CD2387G2-LU', 'HIK-CAM-001', '2024-01-25', 399.00, 'Security Systems International',
   '2024-01-25', '2026-01-25', 'Hikvision Standard Warranty', 'Main Entrance - Ceiling Mount East', 'deployed', 'excellent',
   NULL, '64:32:A8:B1:C4:12', '192.168.100.10', 'Embedded Linux',
   NULL, NULL, NULL, 'security.itams.edu', inventory_user_id, inventory_user_id);

  -- Update camera-specific fields
  UPDATE public.assets SET
    camera_resolution = '4K',
    camera_type = 'turret',
    recording_capacity_tb = 2.0
  WHERE category = 'cctv';

  -- Update network equipment specific fields
  UPDATE public.assets SET
    port_count = 48,
    management_ip = '192.168.1.2',
    firmware_version = '17.12.02'
  WHERE model = 'Catalyst 9300-48P';

  RAISE NOTICE 'Successfully created assets table and inserted % sample assets.', 
    (SELECT COUNT(*) FROM public.assets);

END $$;