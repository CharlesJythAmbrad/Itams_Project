-- ==============================================================================
-- COMPREHENSIVE IT ASSETS SAMPLE DATA
-- This file adds realistic IT assets including computers, laptops, CCTV systems,
-- networking equipment, and other IT properties with proper specifications
-- ==============================================================================

-- First, ensure the assets table exists (run assets_schema.sql first)
-- This file assumes the assets schema is already created

-- Get the inventory staff user ID for created_by field
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

  -- Desktop Computers
  INSERT INTO public.assets (
    asset_tag, name, description, category, brand, model, serial_number,
    purchase_date, purchase_cost, vendor, warranty_start_date, warranty_end_date, warranty_provider,
    location, status, condition, computer_name, mac_address, ip_address, operating_system,
    processor, ram_gb, storage_gb, network_domain, created_by, updated_by
  ) VALUES
  ('ITAMS-AST-1001', 'Dell OptiPlex 7090 Desktop - Faculty Office', 'High-performance desktop for faculty research', 'computer', 
   'Dell', 'OptiPlex 7090 MT', 'DL7090-FAC001', '2024-01-15', 1299.00, 'Dell Technologies Inc.',
   '2024-01-15', '2027-01-15', 'Dell ProSupport Plus', 'Faculty Office 201A', 'deployed', 'excellent',
   'FACULTY-PC-001', '00:1B:44:11:3A:B7', '192.168.10.101', 'Windows 11 Pro 23H2',
   'Intel Core i7-11700 @ 2.5GHz', 16, 512, 'itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-1002', 'HP EliteDesk 800 G9 Desktop', 'Standard desktop computer for administrative staff', 'computer',
   'HP', 'EliteDesk 800 G9 SFF', 'HP800G9-ADM001', '2024-02-10', 899.00, 'HP Inc.',
   '2024-02-10', '2027-02-10', 'HP Care Pack', 'Admin Building - Room 105', 'deployed', 'excellent',
   'ADMIN-PC-001', '2C:44:FD:78:E2:A1', '192.168.10.105', 'Windows 11 Pro 23H2',
   'Intel Core i5-12500 @ 3.0GHz', 8, 256, 'itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-1003', 'Apple iMac 24-inch M3', 'All-in-one computer for design department', 'computer',
   'Apple', 'iMac 24" M3 2024', 'IMAC24-DSN001', '2024-03-05', 1699.00, 'Apple Inc.',
   '2024-03-05', '2025-03-05', 'AppleCare+', 'Design Studio - Workstation 3', 'deployed', 'excellent',
   'DESIGN-MAC-001', 'A4:83:E7:12:5F:C3', '192.168.20.103', 'macOS Sonoma 14.4',
   'Apple M3 8-core CPU', 16, 512, 'design.itams.edu', inventory_user_id, inventory_user_id),

  -- Laptops
  ('ITAMS-AST-2001', 'Dell Latitude 7440 Laptop', 'Business laptop for mobile faculty', 'laptop',
   'Dell', 'Latitude 7440', 'LAT7440-MOB001', '2024-01-20', 1499.00, 'Dell Technologies Inc.',
   '2024-01-20', '2027-01-20', 'Dell ProSupport Plus', 'Mobile Asset Pool', 'in_stock', 'excellent',
   'MOBILE-LAT-001', '54:48:10:C7:8A:2D', NULL, 'Windows 11 Pro 23H2',
   'Intel Core i7-1365U @ 1.3GHz', 16, 512, 'itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-2002', 'Apple MacBook Air M3 15-inch', '15-inch MacBook Air for creative work', 'laptop',
   'Apple', 'MacBook Air 15" M3 2024', 'MBA15M3-CRE001', '2024-02-15', 1799.00, 'Apple Inc.',
   '2024-02-15', '2025-02-15', 'AppleCare+', 'Creative Lab - Bay 4 Rack A1', 'in_stock', 'excellent',
   'CREATIVE-MBA-001', 'BC:D0:74:A8:9F:E1', NULL, 'macOS Sonoma 14.4',
   'Apple M3 8-core CPU', 16, 512, 'creative.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-2003', 'Lenovo ThinkPad P16 Gen 2', 'High-performance workstation laptop', 'laptop',
   'Lenovo', 'ThinkPad P16 Gen 2', 'TP16G2-ENG001', '2024-03-01', 3299.00, 'Lenovo Group Ltd.',
   '2024-03-01', '2027-03-01', 'Lenovo Premier Support', 'Engineering Lab - Currently Borrowed', 'allocated', 'excellent',
   'ENGINEERING-TP-001', '50:EB:F6:04:2A:C8', NULL, 'Windows 11 Pro for Workstations',
   'Intel Core i9-13950HX @ 2.2GHz', 64, 2048, 'engineering.itams.edu', inventory_user_id, inventory_user_id),

  -- Servers
  ('ITAMS-AST-3001', 'Dell PowerEdge R750 Server', 'Primary application server for campus systems', 'server',
   'Dell', 'PowerEdge R750', 'R750-SRV001', '2023-11-15', 4999.00, 'Dell Technologies Inc.',
   '2023-11-15', '2028-11-15', 'Dell ProSupport Mission Critical', 'Server Room - Rack 1U-2U', 'deployed', 'excellent',
   'APP-SERVER-01', '24:6E:96:A1:B3:45', '192.168.1.10', 'Windows Server 2022 Datacenter',
   '2x Intel Xeon Silver 4310 @ 2.1GHz', 128, 4096, 'srv.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-3002', 'HPE ProLiant DL380 Gen11', 'Database server for student information system', 'server',
   'HPE', 'ProLiant DL380 Gen11', 'HPE380G11-DB001', '2024-01-10', 6299.00, 'Hewlett Packard Enterprise',
   '2024-01-10', '2029-01-10', 'HPE Foundation Care', 'Server Room - Rack 2U-4U', 'deployed', 'excellent',
   'DB-SERVER-01', '98:F2:B3:C4:D5:67', '192.168.1.11', 'Red Hat Enterprise Linux 9.3',
   '2x Intel Xeon Gold 5418Y @ 2.0GHz', 256, 8192, 'srv.itams.edu', inventory_user_id, inventory_user_id),

  -- CCTV Cameras
  ('ITAMS-AST-4001', 'Hikvision DS-2CD2387G2-LU ColorVu Turret', '8MP 4K ColorVu IP camera with night vision', 'cctv',
   'Hikvision', 'DS-2CD2387G2-LU', 'HIK-CAM-001', '2024-01-25', 399.00, 'Security Systems International',
   '2024-01-25', '2026-01-25', 'Hikvision Standard Warranty', 'Main Entrance - Ceiling Mount East', 'deployed', 'excellent',
   NULL, '64:32:A8:B1:C4:12', '192.168.100.10', 'Embedded Linux',
   NULL, NULL, NULL, 'security.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-4002', 'Axis P3248-LVE Network Camera', 'Professional PTZ dome camera for parking surveillance', 'cctv',
   'Axis', 'P3248-LVE', 'AXIS-PTZ-001', '2024-02-28', 1299.00, 'Axis Communications Inc.',
   '2024-02-28', '2027-02-28', 'Axis Extended Warranty', 'Parking Lot C - Pole Mount', 'deployed', 'excellent',
   NULL, '00:40:8C:E2:F7:89', '192.168.100.15', 'AXIS OS',
   NULL, NULL, NULL, 'security.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-4003', 'Dahua IPC-HFW2831S-S-S2 Bullet Camera', '8MP IP bullet camera for perimeter security', 'cctv',
   'Dahua', 'IPC-HFW2831S-S-S2', 'DAHUA-BUL-001', '2024-03-10', 189.00, 'Dahua Technology USA',
   '2024-03-10', '2026-03-10', 'Dahua Standard Warranty', 'South Perimeter - Building Wall Mount', 'deployed', 'good',
   NULL, '00:12:16:F4:A8:C7', '192.168.100.20', 'Embedded Linux',
   NULL, NULL, NULL, 'security.itams.edu', inventory_user_id, inventory_user_id),

  -- Network Equipment
  ('ITAMS-AST-5001', 'Cisco Catalyst 9300-48P Switch', '48-port Gigabit managed switch for core network', 'networking',
   'Cisco', 'Catalyst 9300-48P', 'C9300-CORE-001', '2023-12-05', 4200.00, 'Cisco Systems Inc.',
   '2023-12-05', '2028-12-05', 'Cisco SmartNet Total Care', 'Server Room - Network Rack Position 10', 'deployed', 'excellent',
   'CORE-SW-001', '70:B3:17:F4:2A:80', '192.168.1.2', 'Cisco IOS XE 17.12.02',
   NULL, NULL, NULL, 'network.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-5002', 'Ubiquiti Dream Machine Pro', 'Enterprise gateway and firewall appliance', 'networking',
   'Ubiquiti', 'UniFi Dream Machine Pro', 'UDM-PRO-001', '2024-01-18', 899.00, 'Ubiquiti Inc.',
   '2024-01-18', '2025-01-18', 'Ubiquiti Limited Warranty', 'Server Room - Network Rack Position 1', 'deployed', 'excellent',
   'GATEWAY-UDM-001', '78:8A:20:C5:E1:42', '192.168.1.1', 'UniFi OS 3.2.9',
   NULL, NULL, NULL, 'network.itams.edu', inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-5003', 'Aruba AP-635 Wi-Fi 6E Access Point', 'High-performance wireless access point', 'networking',
   'Aruba', 'AP-635', 'ARUBA-AP-635-001', '2024-02-22', 649.00, 'HPE Aruba Networking',
   '2024-02-22', '2027-02-22', 'Aruba Foundation Care', 'Library - 2nd Floor Ceiling Mount', 'deployed', 'excellent',
   'WIFI-AP-LIB-2F-001', 'B4:5D:50:A8:F2:C1', '192.168.50.101', 'ArubaOS 8.11.2.1',
   NULL, NULL, NULL, 'wireless.itams.edu', inventory_user_id, inventory_user_id),

  -- Monitors and Displays
  ('ITAMS-AST-6001', 'Dell UltraSharp U2723QE 27-inch 4K Monitor', '27-inch 4K USB-C hub monitor', 'monitor',
   'Dell', 'UltraSharp U2723QE', 'U2723QE-FAC001', '2024-02-12', 729.00, 'Dell Technologies Inc.',
   '2024-02-12', '2027-02-12', 'Dell Advanced Exchange Service', 'Faculty Office 201A', 'deployed', 'excellent',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-6002', 'LG 27UP850-W 27-inch 4K Monitor', '27-inch 4K monitor with USB-C connectivity', 'monitor',
   'LG', '27UP850-W', 'LG27UP850-DSN001', '2024-03-08', 399.00, 'LG Electronics USA',
   '2024-03-08', '2027-03-08', 'LG Standard Warranty', 'Design Studio - Workstation 3', 'deployed', 'excellent',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id),

  -- Printers and Scanners
  ('ITAMS-AST-7001', 'HP LaserJet Enterprise M507dn', 'Monochrome laser printer for office use', 'printer',
   'HP', 'LaserJet Enterprise M507dn', 'HPM507-ADM001', '2024-01-30', 449.00, 'HP Inc.',
   '2024-01-30', '2025-01-30', 'HP Standard Warranty', 'Admin Building - Print Station 1', 'deployed', 'good',
   'PRINTER-ADM-001', 'A0:B3:CC:D8:E2:F4', '192.168.30.201', NULL,
   NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-7002', 'Canon imageCLASS MF445dw', 'All-in-one laser printer with wireless', 'printer',
   'Canon', 'imageCLASS MF445dw', 'CANON-MF445-FAC001', '2024-02-18', 299.00, 'Canon USA Inc.',
   '2024-02-18', '2025-02-18', 'Canon Standard Warranty', 'Faculty Lounge - Print Corner', 'deployed', 'excellent',
   'PRINTER-FAC-001', 'B8:C7:5A:12:3F:89', '192.168.30.202', NULL,
   NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id),

  -- Tablets and Mobile Devices
  ('ITAMS-AST-8001', 'Apple iPad Pro 12.9-inch (6th Gen)', 'Tablet for faculty presentations and field work', 'tablet',
   'Apple', 'iPad Pro 12.9" M2 2022', 'IPAD-PRO-FAC001', '2024-01-12', 1099.00, 'Apple Inc.',
   '2024-01-12', '2025-01-12', 'AppleCare+', 'Mobile Device Pool', 'allocated', 'excellent',
   NULL, 'C8:89:F3:A1:B4:E7', NULL, 'iPadOS 17.4',
   'Apple M2 8-core CPU', 8, 256, NULL, inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-8002', 'Microsoft Surface Pro 9', 'Convertible tablet for administrative tasks', 'tablet',
   'Microsoft', 'Surface Pro 9', 'SURFACE-PRO9-ADM001', '2024-02-05', 999.00, 'Microsoft Corporation',
   '2024-02-05', '2026-02-05', 'Microsoft Complete', 'Admin Building - Mobile Pool', 'in_stock', 'excellent',
   'SURFACE-ADM-001', 'AC:81:12:F8:2A:C9', NULL, 'Windows 11 Pro 23H2',
   'Intel Core i5-1245U @ 1.6GHz', 8, 256, 'itams.edu', inventory_user_id, inventory_user_id),

  -- UPS and Power Equipment
  ('ITAMS-AST-9001', 'APC Smart-UPS SMT3000RM2U', '3000VA rack-mount UPS for server protection', 'ups',
   'APC', 'Smart-UPS SMT3000RM2U', 'APC-UPS-SRV001', '2023-11-20', 1299.00, 'Schneider Electric',
   '2023-11-20', '2026-11-20', 'APC Service Pack', 'Server Room - UPS Rack Position A', 'deployed', 'excellent',
   NULL, NULL, '192.168.1.100', NULL, NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id),
   
  ('ITAMS-AST-9002', 'CyberPower CP1500PFCLCD', '1500VA desktop UPS for workstation protection', 'ups',
   'CyberPower', 'CP1500PFCLCD', 'CP-UPS-FAC001', '2024-01-22', 189.00, 'CyberPower Systems USA',
   '2024-01-22', '2027-01-22', 'CyberPower Standard Warranty', 'Faculty Office 201A - Under Desk', 'deployed', 'excellent',
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, inventory_user_id, inventory_user_id);

  -- Update sample data with specific technical fields
  UPDATE public.assets SET
    camera_resolution = '4K',
    camera_type = 'turret',
    recording_capacity_tb = 2.0
  WHERE asset_tag IN ('ITAMS-AST-4001', 'ITAMS-AST-4002', 'ITAMS-AST-4003');

  UPDATE public.assets SET
    port_count = 48,
    management_ip = '192.168.1.2',
    firmware_version = '17.12.02'
  WHERE asset_tag = 'ITAMS-AST-5001';

  UPDATE public.assets SET
    port_count = 8,
    management_ip = '192.168.1.1',
    firmware_version = '3.2.9'
  WHERE asset_tag = 'ITAMS-AST-5002';

  -- Add some maintenance and power consumption data
  UPDATE public.assets SET
    power_consumption_watts = 65,
    dimensions = '11.02 x 3.78 x 12.09 inches',
    weight_kg = 4.2
  WHERE category = 'computer';

  UPDATE public.assets SET
    power_consumption_watts = 45,
    dimensions = 'Varies by model',
    weight_kg = 1.8
  WHERE category = 'laptop';

  UPDATE public.assets SET
    power_consumption_watts = 600,
    dimensions = '19 x 1.75 x 28.5 inches',
    weight_kg = 15.8
  WHERE category = 'server';

  RAISE NOTICE 'Successfully inserted comprehensive IT assets sample data with % total assets.', 
    (SELECT COUNT(*) FROM public.assets);

END $$;