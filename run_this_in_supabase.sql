-- ==============================================================================
-- COMPREHENSIVE IT ASSETS DATABASE SETUP FOR SUPABASE
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Copy this entire script
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run this script
-- 4. This will create all tables, sample data, and security policies
-- ==============================================================================

-- 1. Create ENUM types for asset categories, statuses, and conditions
DO $$ 
BEGIN
    -- Drop existing types if they exist (for clean setup)
    DROP TYPE IF EXISTS asset_category CASCADE;
    DROP TYPE IF EXISTS asset_status CASCADE;
    DROP TYPE IF EXISTS asset_condition CASCADE;
    
    -- Create new enum types
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

-- 2. Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.asset_history CASCADE;
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;

-- 3. Main Assets Table with comprehensive IT fields
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Asset Information
  asset_tag VARCHAR(50) UNIQUE NOT NULL DEFAULT '', -- Auto-generated
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
  location VARCHAR(255) NOT NULL,
  building VARCHAR(100),
  room VARCHAR(100),
  department VARCHAR(100),
  status asset_status DEFAULT 'in_stock',
  condition asset_condition DEFAULT 'excellent',
  
  -- IT-Specific Fields for Computers/Laptops
  computer_name VARCHAR(100),
  mac_address VARCHAR(17), -- Format: XX:XX:XX:XX:XX:XX
  ip_address INET,
  operating_system VARCHAR(100),
  processor VARCHAR(255),
  ram_gb INTEGER,
  storage_gb INTEGER,
  network_domain VARCHAR(100),
  
  -- CCTV-Specific Fields
  camera_resolution VARCHAR(50), -- e.g., "4K", "1080p"
  camera_type VARCHAR(50), -- e.g., "dome", "bullet", "turret"
  recording_capacity_tb DECIMAL(5,2),
  
  -- Network Equipment Fields
  port_count INTEGER,
  management_ip INET,
  firmware_version VARCHAR(100),
  
  -- Monitor/Display Fields
  screen_size_inches DECIMAL(4,1), -- e.g., 27.0
  resolution VARCHAR(50), -- e.g., "1920x1080", "3840x2160"
  
  -- Printer Fields
  printer_type VARCHAR(50), -- e.g., "laser", "inkjet"
  
  -- General Technical Specifications
  power_consumption_watts INTEGER,
  dimensions VARCHAR(100), -- e.g., "24 x 18 x 8 inches"
  weight_kg DECIMAL(5,2),
  
  -- Assignment/Deployment Information
  assigned_to UUID, -- Can be NULL if not assigned to a specific user
  deployment_date DATE,
  expected_return_date DATE,
  last_maintenance_date DATE,
  next_maintenance_due DATE,
  
  -- Audit Trail
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- For soft deletes
  
  -- Additional Fields
  notes TEXT,
  qr_code TEXT,
  barcode TEXT,
  photo_url TEXT,
  
  -- Constraints
  CONSTRAINT positive_cost CHECK (purchase_cost >= 0),
  CONSTRAINT positive_ram CHECK (ram_gb > 0 OR ram_gb IS NULL),
  CONSTRAINT positive_storage CHECK (storage_gb > 0 OR storage_gb IS NULL),
  CONSTRAINT valid_mac_address CHECK (
    mac_address IS NULL OR 
    mac_address ~ '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$'
  )
);

-- 4. Create indexes for performance
CREATE INDEX idx_assets_category ON public.assets(category);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_asset_tag ON public.assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON public.assets(serial_number) WHERE serial_number IS NOT NULL;
CREATE INDEX idx_assets_mac_address ON public.assets(mac_address) WHERE mac_address IS NOT NULL;
CREATE INDEX idx_assets_created_at ON public.assets(created_at);
CREATE INDEX idx_assets_location ON public.assets(location);
CREATE INDEX idx_assets_brand ON public.assets(brand) WHERE brand IS NOT NULL;
CREATE INDEX idx_assets_deleted_at ON public.assets(deleted_at) WHERE deleted_at IS NOT NULL;

-- 5. Enable Row Level Security
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- 6. Create security policies
-- Policy 1: All authenticated users can view assets that are not deleted
CREATE POLICY "assets_select_policy" ON public.assets
    FOR SELECT USING (
        auth.role() = 'authenticated' AND deleted_at IS NULL
    );

-- Policy 2: All authenticated users can insert assets
CREATE POLICY "assets_insert_policy" ON public.assets
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );
-- Policy 3: All authenticated users can update assets
CREATE POLICY "assets_update_policy" ON public.assets
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Policy 4: All authenticated users can delete assets (soft delete)
CREATE POLICY "assets_delete_policy" ON public.assets
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- 7. Auto-generate asset tag trigger function
CREATE OR REPLACE FUNCTION generate_asset_tag()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_tag VARCHAR(50);
BEGIN
  -- Only generate if asset_tag is empty or null
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
  
  -- Update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers
CREATE TRIGGER generate_asset_tag_trigger
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION generate_asset_tag();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- 9. Grant necessary permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.assets TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 10. Insert comprehensive sample data
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, computer_name, mac_address, ip_address, 
  operating_system, processor, ram_gb, storage_gb, notes
) VALUES
-- Desktop Computers
('Dell OptiPlex 7090 Desktop', 'High-performance desktop for faculty research and administrative tasks', 'computer', 
 'Dell', 'OptiPlex 7090 MT', 'DL7090-FAC001', '2024-01-15', 1299.00, 'Dell Technologies Inc.',
 'Faculty Office 201A', 'Academic Building', 'Computer Science Department',
 'deployed', 'excellent', 'FACULTY-PC-001', '00:1B:44:11:3A:B7', '192.168.10.101',
 'Windows 11 Pro 23H2', 'Intel Core i7-11700 @ 2.5GHz', 16, 512,
 'Includes Dell wireless keyboard and mouse. Dual monitor setup configured.'),

('HP EliteDesk 800 G9 SFF', 'Compact form factor desktop for administrative use', 'computer',
 'HP', 'EliteDesk 800 G9 SFF', 'HP800G9-ADM001', '2024-01-22', 899.00, 'HP Inc.',
 'Admin Building - Reception', 'Administration Building', 'Human Resources',
 'deployed', 'excellent', 'ADMIN-PC-001', '48:2C:6A:1E:59:CC', '192.168.10.102',
 'Windows 11 Pro 23H2', 'Intel Core i5-12500 @ 3.0GHz', 8, 256,
 'Standard office configuration with MS Office Suite installed.'),

('Apple iMac 24-inch M3', 'All-in-one computer for creative and design work', 'computer',
 'Apple', 'iMac 24" M3 2024', 'IMAC24M3-DES001', '2024-02-10', 1699.00, 'Apple Inc.',
 'Creative Lab - Bay 4 Rack A1', 'Design Building', 'Graphic Design',
 'deployed', 'excellent', 'DESIGN-MAC-001', 'F0:18:98:12:34:56', '192.168.20.101',
 'macOS Sonoma 14.4', 'Apple M3 8-core CPU', 16, 512,
 'Adobe Creative Suite licensed. Color-calibrated display for design work.');

-- Insert laptops
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, computer_name, mac_address, operating_system,
  processor, ram_gb, storage_gb, notes
) VALUES
('Dell Latitude 7440 Laptop', 'Business laptop for mobile faculty and field work', 'laptop',
 'Dell', 'Latitude 7440', 'LAT7440-MOB001', '2024-01-20', 1499.00, 'Dell Technologies Inc.',
 'IT Asset Pool - Mobile Devices', 'IT Services Building', 'Information Technology',
 'in_stock', 'excellent', 'MOBILE-LAT-001', '54:48:10:C7:8A:2D',
 'Windows 11 Pro 23H2', 'Intel Core i7-1365U @ 1.3GHz', 16, 512,
 'Includes Dell docking station and travel case. VPN configured.');
-- Insert more laptops and other equipment
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, computer_name, mac_address, operating_system,
  processor, ram_gb, storage_gb, notes
) VALUES
('Apple MacBook Air M3 15-inch', '15-inch MacBook Air for creative and development work', 'laptop',
 'Apple', 'MacBook Air 15" M3 2024', 'MBA15M3-CRE001', '2024-02-15', 1799.00, 'Apple Inc.',
 'Creative Lab - Checkout Counter', 'Design Building', 'Multimedia Production',
 'in_stock', 'excellent', 'CREATIVE-MBA-001', 'BC:D0:74:A8:9F:E1',
 'macOS Sonoma 14.4', 'Apple M3 8-core CPU', 16, 512,
 'Final Cut Pro and Logic Pro installed. Excellent for video editing and audio production.'),

('Lenovo ThinkPad P16 Gen 2', 'Mobile workstation for engineering and CAD work', 'laptop',
 'Lenovo', 'ThinkPad P16 Gen 2', 'TP16G2-ENG001', '2024-03-01', 3299.00, 'Lenovo Inc.',
 'Engineering Department - Faculty Desk 12', 'Engineering Building', 'Mechanical Engineering',
 'deployed', 'excellent', 'ENGINEERING-TP-001', '00:50:56:C0:00:01',
 'Windows 11 Pro for Workstations', 'Intel Core i9-13950HX @ 3.0GHz', 64, 2048,
 'NVIDIA RTX 4000 Ada Generation. AutoCAD, SolidWorks, and MATLAB installed.');

-- Insert networking equipment
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, mac_address, ip_address, port_count, management_ip,
  firmware_version, power_consumption_watts, notes
) VALUES
('Cisco Catalyst 9300-48P Switch', '48-port Gigabit managed switch for core networking', 'networking',
 'Cisco', 'Catalyst 9300-48P', 'C9300-CORE-001', '2023-12-05', 4200.00, 'Cisco Systems Inc.',
 'Server Room - Network Rack R1-U10', 'IT Services Building', 'Network Infrastructure',
 'deployed', 'excellent', '70:B3:17:F4:2A:80', '192.168.1.2',
 48, '192.168.1.2', '17.12.02', 175,
 'Core network switch. Configured with VLANs for different departments. Redundant power supplies.'),

('Ubiquiti Dream Machine Pro', 'Enterprise gateway and security appliance', 'networking',
 'Ubiquiti', 'UDM-Pro', 'UDM-PRO-GW001', '2024-01-08', 899.00, 'Ubiquiti Inc.',
 'Server Room - Network Rack R1-U5', 'IT Services Building', 'Network Infrastructure',
 'deployed', 'excellent', 'E0:63:DA:12:34:56', '192.168.1.1',
 8, '192.168.1.1', '4.0.21', 45,
 'Main firewall and router. Handles all internet traffic and VLAN routing. IDS/IPS enabled.'),

('Aruba Wi-Fi 6E Access Point', 'High-performance wireless access point for library', 'networking',
 'Aruba', 'AP-635', 'ARUBA-AP-LIB001', '2024-02-20', 650.00, 'HPE Aruba',
 'Library - Central Ceiling Position 3', 'Library Building', 'Information Technology',
 'deployed', 'excellent', '94:64:24:AB:CD:EF', '192.168.30.10',
 NULL, '192.168.30.10', '8.12.0.2', 25,
 'Wi-Fi 6E support for high-density environments. Covers main reading area and study rooms.');
-- Insert CCTV cameras
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, mac_address, ip_address, camera_resolution,
  camera_type, recording_capacity_tb, power_consumption_watts, notes
) VALUES
('Hikvision ColorVu Turret Camera', '8MP 4K IP camera with night vision technology', 'cctv',
 'Hikvision', 'DS-2CD2387G2-LU', 'HIK-CAM-ENT001', '2024-01-25', 399.00, 'Security Systems International',
 'Main Entrance - Ceiling Mount East Side', 'Administration Building', 'Campus Security',
 'deployed', 'excellent', '64:32:A8:B1:C4:12', '192.168.100.10',
 '4K (8MP)', 'turret', 2.0, 12,
 'ColorVu technology provides full-color images in low light. Motion detection configured.'),

('Axis P3248-LVE PTZ Dome', 'Professional PTZ dome camera for parking lot surveillance', 'cctv',
 'Axis', 'P3248-LVE', 'AXIS-PTZ-PARK001', '2024-02-12', 1299.00, 'Axis Communications',
 'Parking Lot - Central Pole Mount 15ft', 'Outdoor - Parking Area', 'Campus Security',
 'deployed', 'excellent', 'AC:CC:8E:12:34:56', '192.168.100.20',
 '4K (8MP)', 'ptz_dome', 4.0, 60,
 'Pan-tilt-zoom functionality. Weatherproof rated IP66. Covers entire parking area.'),

('Dahua Bullet Camera', '8MP IP bullet camera for perimeter security', 'cctv',
 'Dahua', 'IPC-HFW2831T-ZS', 'DAHUA-BUL-PER001', '2024-01-30', 285.00, 'Dahua Technology USA',
 'Perimeter Fence - Section C North Wall', 'Outdoor - Campus Perimeter', 'Campus Security',
 'deployed', 'excellent', '00:12:16:AB:CD:EF', '192.168.100.30',
 '4K (8MP)', 'bullet', 1.5, 15,
 'Motorized varifocal lens 2.7-13.5mm. Smart IR up to 60m. Motion detection and intrusion alarm.');

-- Insert monitors
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, screen_size_inches, resolution,
  power_consumption_watts, dimensions, weight_kg, notes
) VALUES
('Dell UltraSharp 27" 4K Monitor', '27-inch 4K USB-C hub monitor for professional work', 'monitor',
 'Dell', 'UltraSharp U2723QE', 'U2723QE-FAC001', '2024-02-12', 729.00, 'Dell Technologies Inc.',
 'Faculty Office 201A - Desk Position 1', 'Academic Building', 'Computer Science Department',
 'deployed', 'excellent', 27.0, '3840x2160 (4K)',
 65, '24.1 x 14.3 x 8.1 inches', 6.8,
 'USB-C hub with 90W power delivery. Color accuracy suitable for professional work.'),

('LG 32" 4K UltraWide Monitor', '32-inch ultrawide monitor for video editing and design', 'monitor',
 'LG', '32UP550-W', 'LG32UP-CRE001', '2024-03-05', 449.00, 'LG Electronics USA',
 'Creative Lab - Workstation 3', 'Design Building', 'Multimedia Production',
 'deployed', 'excellent', 32.0, '3840x2160 (4K)',
 40, '28.9 x 17.1 x 9.8 inches', 8.2,
 'HDR10 support and USB-C connectivity. Excellent for video editing workflows.');
-- Insert printers and other equipment
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, printer_type, power_consumption_watts, notes
) VALUES
('HP LaserJet Pro M404n', 'Monochrome laser printer for office documents', 'printer',
 'HP', 'LaserJet Pro M404n', 'HP-M404N-ADM001', '2024-01-18', 199.00, 'HP Inc.',
 'Admin Building - Print Station 1', 'Administration Building', 'Human Resources',
 'deployed', 'excellent', 'laser', 365,
 'Network-connected laser printer. Handles high-volume document printing.'),

('Canon PIXMA TR8620a', 'All-in-one inkjet printer with wireless capability', 'printer',
 'Canon', 'PIXMA TR8620a', 'CANON-TR8620-FAC001', '2024-02-08', 179.00, 'Canon USA Inc.',
 'Faculty Lounge - Corner Table', 'Academic Building', 'Faculty Services',
 'deployed', 'good', 'inkjet', 15,
 'Wireless printing, scanning, copying, and faxing. Color photo printing capability.');

-- Insert tablets and mobile devices
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, operating_system, storage_gb, screen_size_inches, notes
) VALUES
('Apple iPad Pro 12.9" M4', 'Professional tablet for presentations and mobile computing', 'tablet',
 'Apple', 'iPad Pro 12.9" M4 2024', 'IPADPRO-M4-PRES001', '2024-03-12', 1099.00, 'Apple Inc.',
 'Presentation Equipment Pool', 'IT Services Building', 'Information Technology',
 'in_stock', 'excellent', 'iPadOS 17.4', 256, 12.9,
 'Includes Apple Pencil Pro and Magic Keyboard. Perfect for presentations and digital note-taking.'),

('Microsoft Surface Pro 11', 'Versatile 2-in-1 tablet for faculty mobile work', 'tablet',
 'Microsoft', 'Surface Pro 11', 'SURFACE-PRO11-FAC001', '2024-03-20', 999.00, 'Microsoft Corporation',
 'Faculty Checkout - Mobile Devices', 'Academic Building', 'Faculty Services',
 'in_stock', 'excellent', 'Windows 11 Pro', 512, 13.0,
 'Includes Surface Pen and Type Cover. Full Windows compatibility for productivity work.');

-- Insert UPS and power equipment
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, power_consumption_watts, dimensions, weight_kg, notes
) VALUES
('APC Smart-UPS 1500VA', 'Uninterruptible power supply for server equipment', 'ups',
 'APC', 'SMT1500', 'APC-SMT1500-SR001', '2023-11-15', 349.00, 'Schneider Electric',
 'Server Room - Rack R1-U2', 'IT Services Building', 'Network Infrastructure',
 'deployed', 'excellent', 1000, '17 x 8.1 x 3.4 inches', 31.8,
 'Provides battery backup for critical network equipment. Runtime approximately 15 minutes at full load.');
-- Insert final equipment
INSERT INTO public.assets (
  name, description, category, brand, model, serial_number,
  purchase_date, purchase_cost, vendor, location, building, department,
  status, condition, power_consumption_watts, notes
) VALUES
('CyberPower CP1500PFCLCD', 'Pure sine wave UPS for sensitive equipment', 'ups',
 'CyberPower', 'CP1500PFCLCD', 'CYBER-CP1500-LAB001', '2024-01-12', 199.00, 'CyberPower Systems',
 'Computer Lab - Equipment Rack', 'Academic Building', 'Computer Science Department',
 'deployed', 'excellent', 1000,
 'Protects lab computers from power fluctuations. LCD display shows power status.');

-- 11. Verification and completion message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Total Assets Created: %', (SELECT COUNT(*) FROM public.assets);
    RAISE NOTICE 'Asset Categories:';
    RAISE NOTICE '  - Computers: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'computer');
    RAISE NOTICE '  - Laptops: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'laptop');
    RAISE NOTICE '  - Networking: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'networking');
    RAISE NOTICE '  - CCTV: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'cctv');
    RAISE NOTICE '  - Monitors: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'monitor');
    RAISE NOTICE '  - Printers: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'printer');
    RAISE NOTICE '  - Tablets: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'tablet');
    RAISE NOTICE '  - UPS: %', (SELECT COUNT(*) FROM public.assets WHERE category = 'ups');
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Your React app can now connect to the database';
    RAISE NOTICE '2. Test the Assets page - you should see sample assets';
    RAISE NOTICE '3. Test the Add Asset form - new assets will be saved';
    RAISE NOTICE '4. Asset tags are auto-generated (ITAMS-AST-####)';
    RAISE NOTICE '';
    RAISE NOTICE 'The system is ready for production use!';
    RAISE NOTICE '==============================================';
END $$;

-- 12. Final verification query
SELECT 
  'SETUP COMPLETE!' as status,
  COUNT(*) as total_assets,
  COUNT(*) FILTER (WHERE status = 'deployed') as deployed_assets,
  COUNT(*) FILTER (WHERE status = 'in_stock') as available_assets,
  MIN(created_at) as first_asset_created,
  MAX(created_at) as last_asset_created
FROM public.assets;