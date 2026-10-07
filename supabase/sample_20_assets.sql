-- Sample 20 Assets for ITAMS Testing
-- Run this in Supabase SQL Editor to populate the assets table

INSERT INTO public.assets (
  asset_tag, 
  name, 
  description, 
  category, 
  brand, 
  model, 
  serial_number, 
  purchase_date, 
  purchase_cost, 
  warranty_expiry, 
  location, 
  status,
  created_at,
  updated_at
) VALUES 

-- LAPTOPS (5)
('ITAMS-LT-001', 'Dell Latitude 5530 Laptop', 'Business laptop for faculty use', 'laptop', 'Dell', 'Latitude 5530', 'DL5530-2024-001', '2024-01-15', 45000.00, '2027-01-15', 'CITE Faculty', 'in_stock', NOW(), NOW()),
('ITAMS-LT-002', 'Lenovo ThinkPad E15 Laptop', 'Student laboratory laptop', 'laptop', 'Lenovo', 'ThinkPad E15', 'TP-E15-2024-002', '2024-02-20', 38000.00, '2027-02-20', 'CITE Laboratory 1', 'in_stock', NOW(), NOW()),
('ITAMS-LT-003', 'HP ProBook 450 G10 Laptop', 'Administrative office laptop', 'laptop', 'HP', 'ProBook 450 G10', 'HP-PB450-2024-003', '2024-03-10', 42000.00, '2027-03-10', 'Registrar Office', 'allocated', NOW(), NOW()),
('ITAMS-LT-004', 'ASUS VivoBook 15 Laptop', 'Library research laptop', 'laptop', 'ASUS', 'VivoBook 15', 'AS-VB15-2024-004', '2024-01-25', 35000.00, '2027-01-25', 'Library', 'in_stock', NOW(), NOW()),
('ITAMS-LT-005', 'Acer Aspire 5 Laptop', 'General purpose laptop', 'laptop', 'Acer', 'Aspire 5', 'AC-ASP5-2024-005', '2024-04-05', 32000.00, '2027-04-05', 'Student Affairs Office', 'deployed', NOW(), NOW()),

-- DESKTOP COMPUTERS (4)
('ITAMS-PC-001', 'Dell OptiPlex 3090 Desktop', 'Office desktop computer', 'computer', 'Dell', 'OptiPlex 3090', 'DL-OPT3090-001', '2024-01-20', 35000.00, '2027-01-20', 'CITE Dean Office', 'deployed', NOW(), NOW()),
('ITAMS-PC-002', 'HP EliteDesk 800 G9 Desktop', 'Laboratory workstation', 'computer', 'HP', 'EliteDesk 800 G9', 'HP-ED800-002', '2024-02-15', 40000.00, '2027-02-15', 'CITE Laboratory 2', 'in_stock', NOW(), NOW()),
('ITAMS-PC-003', 'Lenovo ThinkCentre M90a Desktop', 'Faculty workstation', 'computer', 'Lenovo', 'ThinkCentre M90a', 'LN-TC90A-003', '2024-03-01', 38000.00, '2027-03-01', 'Medical Faculty', 'in_stock', NOW(), NOW()),
('ITAMS-PC-004', 'ASUS ExpertCenter D7 Desktop', 'Administrative computer', 'computer', 'ASUS', 'ExpertCenter D7', 'AS-ECD7-004', '2024-01-30', 36000.00, '2027-01-30', 'Finance Office', 'deployed', NOW(), NOW()),

-- MONITORS (3)
('ITAMS-MON-001', 'Dell 24" LED Monitor', 'Standard office monitor', 'monitor', 'Dell', 'P2423D', 'DL-P2423D-001', '2024-02-10', 12000.00, '2027-02-10', 'HR Department', 'in_stock', NOW(), NOW()),
('ITAMS-MON-002', 'LG 27" UltraWide Monitor', 'Design and development monitor', 'monitor', 'LG', '27WL500-B', 'LG-27WL500-002', '2024-03-15', 18000.00, '2027-03-15', 'CITE Laboratory 3', 'allocated', NOW(), NOW()),
('ITAMS-MON-003', 'Samsung 32" Curved Monitor', 'Premium workstation monitor', 'monitor', 'Samsung', 'C32F391', 'SM-C32F391-003', '2024-01-10', 22000.00, '2027-01-10', 'CITE Faculty', 'in_stock', NOW(), NOW()),

-- PRINTERS (2)
('ITAMS-PR-001', 'HP LaserJet Pro M404dn', 'Office laser printer', 'printer', 'HP', 'LaserJet Pro M404dn', 'HP-M404DN-001', '2024-02-01', 15000.00, '2025-02-01', 'Registrar Office', 'deployed', NOW(), NOW()),
('ITAMS-PR-002', 'Canon PIXMA G3020 Printer', 'Color inkjet printer', 'printer', 'Canon', 'PIXMA G3020', 'CN-G3020-002', '2024-03-20', 8500.00, '2025-03-20', 'Student Affairs Office', 'in_stock', NOW(), NOW()),

-- NETWORK EQUIPMENT (2)
('ITAMS-NET-001', 'TP-Link 24-Port Gigabit Switch', 'Network switch for laboratory', 'networking', 'TP-Link', 'TL-SG1024D', 'TPL-SG1024-001', '2024-01-05', 5500.00, '2026-01-05', 'CITE Laboratory 1', 'deployed', NOW(), NOW()),
('ITAMS-NET-002', 'ASUS AX6000 WiFi Router', 'High-performance wireless router', 'networking', 'ASUS', 'RT-AX88U', 'AS-AX88U-002', '2024-02-25', 12000.00, '2026-02-25', 'Library', 'deployed', NOW(), NOW()),

-- PROJECTOR (1)
('ITAMS-PROJ-001', 'Epson PowerLite 2247U Projector', 'Classroom presentation projector', 'projector', 'Epson', 'PowerLite 2247U', 'EP-2247U-001', '2024-03-05', 35000.00, '2026-03-05', 'CITE Laboratory 2', 'in_stock', NOW(), NOW()),

-- TABLETS (2)
('ITAMS-TAB-001', 'Apple iPad Air 5th Gen', 'Faculty presentation tablet', 'tablet', 'Apple', 'iPad Air 5', 'APL-IPA5-001', '2024-04-01', 32000.00, '2025-04-01', 'Medical Faculty', 'allocated', NOW(), NOW()),
('ITAMS-TAB-002', 'Samsung Galaxy Tab A8', 'Student research tablet', 'tablet', 'Samsung', 'Galaxy Tab A8', 'SM-GTA8-002', '2024-03-25', 15000.00, '2025-03-25', 'Library', 'in_stock', NOW(), NOW()),

-- UPS POWER EQUIPMENT (1)
('ITAMS-UPS-001', 'APC Smart-UPS 1500VA', 'Server room backup power', 'ups', 'APC', 'SMT1500', 'APC-SMT1500-001', '2024-01-12', 18000.00, '2026-01-12', 'CITE Laboratory 3', 'deployed', NOW(), NOW());

-- Update the assets count for dashboard
-- This query shows the summary of what was inserted
SELECT 
  category,
  status,
  COUNT(*) as count,
  SUM(purchase_cost) as total_value
FROM public.assets 
WHERE asset_tag LIKE 'ITAMS-%'
GROUP BY category, status
ORDER BY category, status;