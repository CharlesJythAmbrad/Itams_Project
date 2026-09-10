-- ==============================================================================
-- IT ASSETS MANAGEMENT SCHEMA FOR SUPABASE
-- This schema supports comprehensive IT asset tracking including computers,
-- laptops, CCTV systems, networking equipment, and other IT properties
-- ==============================================================================

-- 1. Create ENUM types for asset categories and statuses
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

-- 2. Main Assets Table
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
  warranty_type VARCHAR(100), -- e.g., 'manufacturer', 'extended', 'service_contract'
  
  -- Location and Status
  location VARCHAR(255), -- e.g., 'Bay 4 - Rack A1', 'Faculty Office 204'
  status asset_status DEFAULT 'in_stock',
  condition asset_condition DEFAULT 'excellent',
  
  -- IT-Specific Fields (nullable for non-IT assets)
  computer_name VARCHAR(100), -- For computers/laptops
  mac_address VARCHAR(17), -- Format: XX:XX:XX:XX:XX:XX
  ip_address INET,
  operating_system VARCHAR(100),
  processor VARCHAR(255),
  ram_gb INTEGER,
  storage_gb INTEGER,
  network_domain VARCHAR(100),
  
  -- CCTV-Specific Fields
  camera_resolution VARCHAR(50), -- e.g., '4K', '1080p'
  camera_type VARCHAR(50), -- e.g., 'dome', 'bullet', 'ptz'
  recording_capacity_tb DECIMAL(5,2),
  
  -- Network Equipment Fields
  port_count INTEGER,
  management_ip INET,
  firmware_version VARCHAR(100),
  
  -- General Technical Specifications
  power_consumption_watts INTEGER,
  dimensions VARCHAR(100), -- e.g., '15.6 x 10.2 x 0.7 inches'
  weight_kg DECIMAL(5,2),
  
  -- Tracking Information
  assigned_to UUID REFERENCES public.users(id), -- Who is currently using this asset
  assigned_date TIMESTAMPTZ,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  
  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional Notes and Documentation
  notes TEXT,
  qr_code TEXT, -- QR code data for scanning
  barcode TEXT,
  photo_url TEXT -- URL to asset photo
);

-- 3. Asset History Table (for tracking changes and movements)
CREATE TABLE public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Change Information
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'assigned', 'returned', 'maintenance', etc.
  field_changed VARCHAR(100), -- Which field was changed
  old_value TEXT,
  new_value TEXT,
  
  -- Context
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  notes TEXT
);

-- 4. Asset Assignments Table (for borrowing/allocation tracking)
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
  assignment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'returned', 'overdue'
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

-- 5. Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- Assets table policies
DROP POLICY IF EXISTS "Assets viewable by inventory staff and ITSD" ON public.assets;
DROP POLICY IF EXISTS "Assets manageable by inventory staff and ITSD" ON public.assets;
DROP POLICY IF EXISTS "End users can view their assigned assets" ON public.assets;

CREATE POLICY "Assets viewable by inventory staff and ITSD"
  ON public.assets FOR SELECT
  USING (
    public.get_auth_user_role() IN ('itsd', 'inventory_staff')
    OR assigned_to = auth.uid()
  );

CREATE POLICY "Assets manageable by inventory staff and ITSD"
  ON public.assets FOR ALL
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

-- Asset history policies
CREATE POLICY "Asset history viewable by inventory staff and ITSD"
  ON public.asset_history FOR SELECT
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

CREATE POLICY "Asset history manageable by inventory staff and ITSD"
  ON public.asset_history FOR INSERT
  WITH CHECK (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

-- Asset assignments policies
CREATE POLICY "Asset assignments viewable by authorized users"
  ON public.asset_assignments FOR SELECT
  USING (
    public.get_auth_user_role() IN ('itsd', 'inventory_staff')
    OR assigned_to = auth.uid()
    OR assigned_by = auth.uid()
  );

CREATE POLICY "Asset assignments manageable by inventory staff and ITSD"
  ON public.asset_assignments FOR ALL
  USING (public.get_auth_user_role() IN ('itsd', 'inventory_staff'));

-- 7. Indexes for Performance
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

-- 8. Triggers for automated functionality

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

-- 9. Sample Data Insert
INSERT INTO public.assets (
  asset_tag, name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, warranty_start_date, warranty_end_date, warranty_provider,
  location, status, condition, computer_name, mac_address, ip_address, operating_system,
  processor, ram_gb, storage_gb, created_by
) VALUES
-- Computers
('ITAMS-AST-0001', 'Dell OptiPlex 7090 Desktop', 'High-performance desktop computer for faculty use', 'computer', 
 'Dell', 'OptiPlex 7090', 'DL7090-001234', '2024-01-15', 1299.00, 'Dell Technologies Inc.',
 '2024-01-15', '2027-01-15', 'Dell ProSupport', 'Faculty Office 201', 'deployed', 'excellent',
 'FACULTY-PC-001', '00:1B:44:11:3A:B7', '192.168.1.101', 'Windows 11 Pro',
 'Intel Core i7-11700', 16, 512, 'a0000000-0000-0000-0000-000000000001'),

-- Laptops  
('ITAMS-AST-0002', 'Apple MacBook Air M3', '15-inch MacBook Air for mobile computing', 'laptop',
 'Apple', 'MacBook Air M3 15"', 'MBA15-567890', '2024-02-01', 1499.00, 'Apple Inc.',
 '2024-02-01', '2027-02-01', 'AppleCare+', 'Bay 4 - Rack A1', 'in_stock', 'excellent',
 'MOBILE-MBA-002', 'A4:83:E7:45:2F:C1', NULL, 'macOS Sonoma 14.3',
 'Apple M3 8-core', 16, 512, 'a0000000-0000-0000-0000-000000000001'),

-- CCTV Camera
('ITAMS-AST-0003', 'Hikvision DS-2CD2385G1 Turret', '8MP 4K IP Security Camera', 'cctv',
 'Hikvision', 'DS-2CD2385G1-I', 'HIK-CAM-789012', '2024-01-20', 299.00, 'Security Systems Ltd',
 '2024-01-20', '2026-01-20', 'Hikvision Warranty', 'Main Entrance - Ceiling Mount', 'deployed', 'excellent',
 NULL, '00:C0:F0:12:34:56', '192.168.100.10', 'Embedded Linux',
 NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000001'),

-- Network Switch
('ITAMS-AST-0004', 'Cisco Catalyst 9200-48P Switch', '48-port Gigabit managed switch', 'networking',
 'Cisco', 'Catalyst 9200-48P', 'CSC-SW-345678', '2023-12-05', 2800.00, 'Cisco Systems',
 '2023-12-05', '2028-12-05', 'Cisco SmartNet', 'Server Room - Rack 1', 'deployed', 'good',
 'CORE-SW-001', '00:1E:14:A2:B3:C4', '192.168.1.1', 'Cisco IOS XE',
 NULL, NULL, NULL, 'a0000000-0000-0000-0000-000000000001');

-- Update the sample data with proper references
UPDATE public.assets 
SET created_by = (SELECT id FROM public.users WHERE role = 'inventory_staff' LIMIT 1)
WHERE created_by = 'a0000000-0000-0000-0000-000000000001';

-- Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.asset_history TO authenticated;
GRANT ALL ON public.asset_assignments TO authenticated;