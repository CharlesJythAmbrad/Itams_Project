-- ==============================================================================
-- COMPREHENSIVE ASSETS TABLE FOR SUPABASE - COMPLETE SETUP
-- This creates a full assets management system with detailed IT asset information
-- ==============================================================================

-- 1. Create ENUM types for asset management
DO $$ 
BEGIN
    -- Asset Categories
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category') THEN
        CREATE TYPE asset_category AS ENUM (
          'computer', 'laptop', 'server', 'monitor', 'printer', 'scanner',
          'networking', 'cctv', 'phone', 'tablet', 'projector', 'ups',
          'storage', 'accessory', 'software', 'other'
        );
    END IF;
    
    -- Asset Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE asset_status AS ENUM (
          'in_stock', 'allocated', 'deployed', 'maintenance', 
          'retired', 'disposed', 'lost', 'stolen'
        );
    END IF;
    
    -- Asset Condition
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

-- 3. Create the main ASSETS table with comprehensive fields
CREATE TABLE public.assets (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Asset Identification
  asset_tag VARCHAR(50) UNIQUE NOT NULL DEFAULT '',
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category asset_category NOT NULL,
  
  -- Manufacturer Information
  brand VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  part_number VARCHAR(100),
  
  -- Financial Information
  purchase_date DATE,
  purchase_cost DECIMAL(12,2),
  vendor VARCHAR(255),
  invoice_number VARCHAR(100),
  po_number VARCHAR(100),
  
  -- Warranty Information
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_provider VARCHAR(255),
  warranty_type VARCHAR(100),
  warranty_terms TEXT,
  
  -- Location and Status
  location VARCHAR(255) NOT NULL,
  building VARCHAR(100),
  room VARCHAR(50),
  floor VARCHAR(20),
  department VARCHAR(100),
  status asset_status DEFAULT 'in_stock',
  condition asset_condition DEFAULT 'excellent',
  
  -- IT-Specific Fields (Computers, Laptops, Servers)
  computer_name VARCHAR(100),
  mac_address VARCHAR(17),
  ip_address INET,
  operating_system VARCHAR(100),
  os_version VARCHAR(50),
  processor VARCHAR(255),
  processor_cores INTEGER,
  processor_speed_ghz DECIMAL(4,2),
  ram_gb INTEGER,
  storage_gb INTEGER,
  storage_type VARCHAR(50), -- SSD, HDD, NVMe
  network_domain VARCHAR(100),
  hostname VARCHAR(100),
  
  -- CCTV-Specific Fields
  camera_resolution VARCHAR(50),
  camera_type VARCHAR(50),
  recording_capacity_tb DECIMAL(8,2),
  camera_features TEXT,
  viewing_angle VARCHAR(50),
  night_vision BOOLEAN DEFAULT FALSE,
  
  -- Network Equipment Fields
  port_count INTEGER,
  management_ip INET,
  firmware_version VARCHAR(100),
  switch_type VARCHAR(50),
  vlan_support BOOLEAN DEFAULT FALSE,
  poe_support BOOLEAN DEFAULT FALSE,
  
  -- Monitor/Display Fields
  screen_size_inches DECIMAL(4,1),
  resolution VARCHAR(50),
  panel_type VARCHAR(50),
  refresh_rate_hz INTEGER,
  
  -- Printer Fields
  printer_type VARCHAR(50), -- laser, inkjet, thermal
  print_speed_ppm INTEGER,
  max_paper_size VARCHAR(20),
  duplex_printing BOOLEAN DEFAULT FALSE,
  color_printing BOOLEAN DEFAULT FALSE,
  
  -- General Technical Specifications
  power_consumption_watts INTEGER,
  power_requirements VARCHAR(50),
  dimensions VARCHAR(100),
  weight_kg DECIMAL(8,2),
  operating_temperature VARCHAR(50),
  
  -- Compliance and Certifications
  certifications TEXT,
  compliance_standards TEXT,
  energy_rating VARCHAR(20),
  
  -- Tracking Information
  assigned_to UUID REFERENCES public.users(id),
  assigned_date TIMESTAMPTZ,
  assigned_by UUID REFERENCES public.users(id),
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  maintenance_schedule VARCHAR(50),
  
  -- Asset Lifecycle
  deployment_date DATE,
  retirement_date DATE,
  end_of_life_date DATE,
  replacement_asset_id UUID REFERENCES public.assets(id),
  
  -- Documentation
  manual_url TEXT,
  support_url TEXT,
  driver_url TEXT,
  notes TEXT,
  internal_notes TEXT,
  
  -- Digital Assets
  qr_code TEXT,
  barcode TEXT,
  photo_url TEXT,
  documentation_urls TEXT[],
  
  -- Audit Trail
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft Delete
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id)
);

-- 4. Create Asset History table for tracking changes
CREATE TABLE public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  
  -- Change Information
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'assigned', 'returned', 'maintenance', etc.
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  -- Context
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  notes TEXT,
  
  -- Additional metadata
  ip_address INET,
  user_agent TEXT
);

-- 5. Create Asset Assignments table for tracking who has what
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
  assignment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'returned', 'overdue', 'lost'
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

-- 6. Create indexes for better performance
CREATE INDEX idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX idx_assets_category ON public.assets(category);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_brand_model ON public.assets(brand, model);
CREATE INDEX idx_assets_location ON public.assets(location);
CREATE INDEX idx_assets_assigned_to ON public.assets(assigned_to);
CREATE INDEX idx_assets_created_at ON public.assets(created_at);
CREATE INDEX idx_assets_serial_number ON public.assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_assets_mac_address ON public.assets(mac_address) WHERE mac_address IS NOT NULL;
CREATE INDEX idx_assets_computer_name ON public.assets(computer_name) WHERE computer_name IS NOT NULL;

-- History table indexes
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);
CREATE INDEX idx_asset_history_performed_at ON public.asset_history(performed_at);
CREATE INDEX idx_asset_history_action ON public.asset_history(action);

-- Assignments table indexes
CREATE INDEX idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_assigned_to ON public.asset_assignments(assigned_to);
CREATE INDEX idx_asset_assignments_status ON public.asset_assignments(assignment_status);

-- 7. Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies (simplified for authenticated users)
DROP POLICY IF EXISTS "Assets readable by authenticated users" ON public.assets;
DROP POLICY IF EXISTS "Assets writable by authenticated users" ON public.assets;

CREATE POLICY "Assets readable by authenticated users" 
  ON public.assets FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Assets writable by authenticated users" 
  ON public.assets FOR ALL 
  USING (auth.role() = 'authenticated');

-- History policies
CREATE POLICY "Asset history readable by authenticated users" 
  ON public.asset_history FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Asset history writable by authenticated users" 
  ON public.asset_history FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Assignment policies
CREATE POLICY "Asset assignments readable by authenticated users" 
  ON public.asset_assignments FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Asset assignments writable by authenticated users" 
  ON public.asset_assignments FOR ALL 
  USING (auth.role() = 'authenticated');

-- 9. Create Functions and Triggers

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-generate asset tag function
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

-- Asset history logging function
CREATE OR REPLACE FUNCTION log_asset_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the creation of new assets
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.asset_history (
      asset_id, action, performed_by, notes
    ) VALUES (
      NEW.id, 'created', NEW.created_by, 'Asset created in system'
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
    
    -- Log location changes
    IF OLD.location != NEW.location THEN
      INSERT INTO public.asset_history (
        asset_id, action, field_changed, old_value, new_value, performed_by
      ) VALUES (
        NEW.id, 'location_changed', 'location', OLD.location, NEW.location, NEW.updated_by
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ language 'plpgsql';

-- 10. Create triggers
CREATE TRIGGER update_assets_updated_at 
  BEFORE UPDATE ON public.assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_assignments_updated_at 
  BEFORE UPDATE ON public.asset_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER generate_asset_tag_trigger
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION generate_asset_tag();

CREATE TRIGGER log_asset_changes_trigger
  AFTER INSERT OR UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION log_asset_changes();

-- 11. Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.asset_history TO authenticated;
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12. Insert comprehensive sample data
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Try to get an existing user ID, or create a placeholder
  SELECT id INTO sample_user_id FROM public.users LIMIT 1;
  IF sample_user_id IS NULL THEN
    sample_user_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Insert detailed IT assets
  INSERT INTO public.assets (
    name, description, category, brand, model, serial_number,
    purchase_date, purchase_cost, vendor, invoice_number,
    warranty_start_date, warranty_end_date, warranty_provider,
    location, building, room, department, status, condition,
    computer_name, mac_address, ip_address, operating_system, os_version,
    processor, processor_cores, processor_speed_ghz, ram_gb, storage_gb, storage_type,
    network_domain, hostname, power_consumption_watts, dimensions, weight_kg,
    deployment_date, created_by, updated_by, notes
  ) VALUES
  -- High-End Desktop Computer
  (
    'Dell OptiPlex 7090 Tower - Faculty Workstation',
    'High-performance desktop computer for research faculty with advanced computational needs',
    'computer',
    'Dell',
    'OptiPlex 7090 MT',
    'DL7090-2024-001',
    '2024-01-15',
    1899.00,
    'Dell Technologies Inc.',
    'INV-2024-001',
    '2024-01-15',
    '2027-01-15',
    'Dell ProSupport Plus',
    'Faculty Research Building - Office 315A',
    'Faculty Research Building',
    '315A',
    'Computer Science Department',
    'deployed',
    'excellent',
    'FACULTY-WS-001',
    '00:1B:44:11:3A:B7',
    '192.168.10.101',
    'Windows 11 Pro',
    '23H2',
    'Intel Core i7-11700K @ 3.6GHz',
    8,
    3.60,
    32,
    1024,
    'NVMe SSD',
    'cs.itams.edu',
    'faculty-ws-001.cs.itams.edu',
    125,
    '18.3 x 7.5 x 17.1 inches',
    8.5,
    '2024-01-20',
    sample_user_id,
    sample_user_id,
    'Primary workstation for Dr. Sarah Johnson - Machine Learning Research Lab'
  ),
  
  -- Business Laptop
  (
    'Dell Latitude 7440 Business Laptop',
    'Premium business laptop with enterprise security features for mobile professionals',
    'laptop',
    'Dell',
    'Latitude 7440',
    'LAT7440-2024-008',
    '2024-02-01',
    2199.00,
    'Dell Technologies Inc.',
    'INV-2024-008',
    '2024-02-01',
    '2027-02-01',
    'Dell ProSupport Plus with NBD',
    'Mobile Asset Pool - IT Services',
    'IT Services Building',
    'Asset Storage',
    'Information Technology',
    'in_stock',
    'excellent',
    'MOBILE-LT-008',
    '54:48:10:C7:8A:2D',
    NULL,
    'Windows 11 Pro',
    '23H2',
    'Intel Core i7-1365U @ 1.3GHz',
    10,
    1.30,
    16,
    512,
    'NVMe SSD',
    'mobile.itams.edu',
    'mobile-lt-008.itams.edu',
    65,
    '12.6 x 8.3 x 0.7 inches',
    1.4,
    NULL,
    sample_user_id,
    sample_user_id,
    'Available for checkout by authorized faculty and staff'
  ),
  
  -- MacBook Pro for Creative Work
  (
    'Apple MacBook Pro 16-inch M3 Max',
    'High-performance laptop for video editing, 3D modeling, and creative professional work',
    'laptop',
    'Apple',
    'MacBook Pro 16" M3 Max 2024',
    'MBP16M3-2024-003',
    '2024-03-05',
    3999.00,
    'Apple Inc.',
    'INV-2024-015',
    '2024-03-05',
    '2025-03-05',
    'AppleCare+ for Business',
    'Media Production Lab - Studio 2',
    'Creative Arts Center',
    'Studio 2',
    'Media & Communications',
    'deployed',
    'excellent',
    'MEDIA-MBP-003',
    'BC:D0:74:A8:9F:E1',
    '192.168.20.103',
    'macOS Sonoma',
    '14.4.1',
    'Apple M3 Max 16-core CPU',
    16,
    NULL,
    64,
    2048,
    'Unified Memory + SSD',
    'media.itams.edu',
    'media-mbp-003.media.itams.edu',
    100,
    '14.0 x 9.8 x 0.7 inches',
    2.1,
    '2024-03-10',
    sample_user_id,
    sample_user_id,
    'Assigned to Video Production Team for 4K editing and motion graphics'
  ),
  
  -- Enterprise Network Switch
  (
    'Cisco Catalyst 9300-48P Core Switch',
    'Enterprise-grade 48-port Gigabit managed switch with PoE+ for network infrastructure',
    'networking',
    'Cisco',
    'Catalyst 9300-48P-E',
    'C9300-CORE-2024-001',
    '2023-11-15',
    5200.00,
    'Cisco Systems Inc.',
    'INV-2023-089',
    '2023-11-15',
    '2028-11-15',
    'Cisco SmartNet Total Care 24x7x4',
    'Server Room - Network Rack 1',
    'IT Data Center',
    'Server Room Alpha',
    'Information Technology',
    'deployed',
    'excellent',
    'CORE-SW-001',
    '70:B3:17:F4:2A:80',
    '192.168.1.2',
    'Cisco IOS XE',
    '17.12.02',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'network.itams.edu',
    'core-sw-001.network.itams.edu',
    370,
    '17.5 x 1.75 x 17.5 inches (1U)',
    11.5,
    '2023-11-20',
    sample_user_id,
    sample_user_id,
    'Primary core switch for main campus network - handles all inter-VLAN routing'
  ),
  
  -- 4K Security Camera
  (
    'Hikvision ColorVu 4K Turret Camera',
    'Professional 8MP 4K IP security camera with ColorVu night vision technology',
    'cctv',
    'Hikvision',
    'DS-2CD2387G2-LU',
    'HIK-CAM-2024-012',
    '2024-01-25',
    449.00,
    'Security Systems International',
    'INV-2024-005',
    '2024-01-25',
    '2026-01-25',
    'Hikvision Standard Warranty',
    'Main Campus Entrance - East Side',
    'Main Academic Building',
    'Exterior - East Entrance',
    'Campus Security',
    'deployed',
    'excellent',
    NULL,
    '64:32:A8:B1:C4:12',
    '192.168.100.10',
    'Embedded Linux',
    '5.7.3',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'security.itams.edu',
    'cam-east-entrance-01.security.itams.edu',
    12,
    '4.7 x 4.7 x 3.9 inches',
    0.6,
    '2024-02-01',
    sample_user_id,
    sample_user_id,
    'Monitors main entrance 24/7 with motion detection and license plate recognition'
  ),
  
  -- Professional 4K Monitor
  (
    'Dell UltraSharp 32" 4K USB-C Monitor',
    'Professional 32-inch 4K monitor with USB-C hub and color calibration for design work',
    'monitor',
    'Dell',
    'UltraSharp U3223QE',
    'U3223QE-2024-007',
    '2024-02-12',
    899.00,
    'Dell Technologies Inc.',
    'INV-2024-012',
    '2024-02-12',
    '2027-02-12',
    'Dell Advanced Exchange Service',
    'Design Lab - Workstation 5',
    'Creative Arts Center',
    'Design Lab',
    'Media & Communications',
    'deployed',
    'excellent',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    85,
    '28.1 x 8.2 x 20.5 inches',
    6.8,
    '2024-02-15',
    sample_user_id,
    sample_user_id,
    'Color-critical work monitor with 99% sRGB and 95% DCI-P3 color coverage'
  ),
  
  -- Enterprise Laser Printer
  (
    'HP LaserJet Enterprise M507dn',
    'High-speed monochrome laser printer for office document printing with network connectivity',
    'printer',
    'HP',
    'LaserJet Enterprise M507dn',
    'HPM507-2024-003',
    '2024-01-30',
    449.00,
    'HP Inc.',
    'INV-2024-007',
    '2024-01-30',
    '2025-01-30',
    'HP Standard Warranty',
    'Administration Building - Print Station 1',
    'Administration Building',
    'Copy Center',
    'Administration',
    'deployed',
    'good',
    'PRINT-ADM-001',
    'A0:B3:CC:D8:E2:F4',
    '192.168.30.201',
    'HP Embedded Web Server',
    '2.4.1',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'print.itams.edu',
    'printer-adm-001.print.itams.edu',
    550,
    '15.4 x 15.7 x 10.2 inches',
    12.2,
    '2024-02-05',
    sample_user_id,
    sample_user_id,
    'High-volume printing for administrative documents - 8,000 pages monthly average'
  ),
  
  -- Rack-Mount UPS
  (
    'APC Smart-UPS SMT3000RM2U',
    'Enterprise 3000VA rack-mount UPS with network management for server protection',
    'ups',
    'APC by Schneider Electric',
    'Smart-UPS SMT3000RM2U',
    'APC-UPS-2023-001',
    '2023-10-15',
    1599.00,
    'Schneider Electric',
    'INV-2023-078',
    '2023-10-15',
    '2026-10-15',
    'APC Service Pack 3-Year',
    'Server Room - UPS Rack A',
    'IT Data Center',
    'Server Room Alpha',
    'Information Technology',
    'deployed',
    'excellent',
    'UPS-RACK-A-001',
    '00:C0:B7:88:E2:45',
    '192.168.1.100',
    'AOS (APC OS)',
    '6.8.2',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'network.itams.edu',
    'ups-rack-a-001.network.itams.edu',
    3000,
    '17.0 x 3.4 x 22.8 inches (2U)',
    29.0,
    '2023-10-20',
    sample_user_id,
    sample_user_id,
    'Provides backup power for critical server infrastructure - 15 minute runtime at full load'
  );

  -- Update category-specific fields
  UPDATE public.assets SET
    port_count = 48,
    management_ip = '192.168.1.2',
    firmware_version = '17.12.02',
    switch_type = 'Layer 3 Managed',
    vlan_support = TRUE,
    poe_support = TRUE
  WHERE model LIKE 'Catalyst 9300%';

  UPDATE public.assets SET
    camera_resolution = '4K (3840x2160)',
    camera_type = 'Fixed Turret',
    recording_capacity_tb = 2.0,
    night_vision = TRUE,
    viewing_angle = '104° horizontal',
    camera_features = 'ColorVu Night Vision, Smart Motion Detection, Line Crossing Detection, Intrusion Detection'
  WHERE category = 'cctv';

  UPDATE public.assets SET
    screen_size_inches = 32.0,
    resolution = '3840x2160 (4K UHD)',
    panel_type = 'IPS Black',
    refresh_rate_hz = 60
  WHERE model LIKE 'UltraSharp U3223QE';

  UPDATE public.assets SET
    printer_type = 'Laser Monochrome',
    print_speed_ppm = 45,
    max_paper_size = 'Legal (8.5x14")',
    duplex_printing = TRUE,
    color_printing = FALSE
  WHERE model LIKE 'LaserJet Enterprise M507dn';

  RAISE NOTICE 'Successfully created comprehensive assets table with % detailed IT assets', 
    (SELECT COUNT(*) FROM public.assets);

END $$;

-- 13. Create a view for easy asset reporting
CREATE VIEW public.assets_summary AS
SELECT 
  a.id,
  a.asset_tag,
  a.name,
  a.category,
  a.brand,
  a.model,
  a.serial_number,
  a.location,
  a.building,
  a.department,
  a.status,
  a.condition,
  a.purchase_cost,
  a.purchase_date,
  a.warranty_end_date,
  CASE 
    WHEN a.warranty_end_date < CURRENT_DATE THEN 'Expired'
    WHEN a.warranty_end_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
    ELSE 'Active'
  END as warranty_status,
  assigned_user.full_name as assigned_to_name,
  assigned_user.email as assigned_to_email,
  a.created_at,
  creator.full_name as created_by_name
FROM public.assets a
LEFT JOIN public.users assigned_user ON a.assigned_to = assigned_user.id
LEFT JOIN public.users creator ON a.created_by = creator.id
WHERE a.deleted_at IS NULL;

-- Grant permissions on the view
GRANT SELECT ON public.assets_summary TO authenticated;

-- Final verification query
SELECT 
  'Assets Table Setup Complete!' as message,
  COUNT(*) as total_assets,
  COUNT(*) FILTER (WHERE category = 'computer') as computers,
  COUNT(*) FILTER (WHERE category = 'laptop') as laptops,
  COUNT(*) FILTER (WHERE category = 'networking') as networking,
  COUNT(*) FILTER (WHERE category = 'cctv') as cameras,
  COUNT(*) FILTER (WHERE category = 'monitor') as monitors,
  COUNT(*) FILTER (WHERE status = 'deployed') as deployed_assets,
  COUNT(*) FILTER (WHERE status = 'in_stock') as available_assets
FROM public.assets;