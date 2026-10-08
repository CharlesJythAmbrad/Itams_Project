-- Sample Assets for Testing Asset Management System
-- This creates 20 diverse assets with various statuses, conditions, and categories
-- Run this in your Supabase SQL editor to populate test data

INSERT INTO assets (
  name,
  asset_tag,
  category,
  brand,
  model,
  serial_number,
  status,
  condition,
  location,
  purchase_cost,
  purchase_date,
  notes,
  created_at,
  updated_at
) VALUES

-- LAPTOPS (5 assets)
(
  'Dell Latitude 5520 - Marketing',
  'LAP-001',
  'laptop',
  'Dell',
  'Latitude 5520',
  'DL5520-MK001',
  'in_stock',
  'excellent',
  'Warehouse - Shelf A1',
  65000.00,
  '2023-08-15',
  'New laptop for marketing department. Intel i7, 16GB RAM, 512GB SSD',
  '2023-08-15 09:30:00',
  '2023-08-15 09:30:00'
),

(
  'MacBook Pro 14" - Design Team',
  'LAP-002',
  'laptop',
  'Apple',
  'MacBook Pro 14-inch',
  'MP14-DT002',
  'deployed',
  'good',
  'Design Department - Desk 12',
  120000.00,
  '2023-09-20',
  'Assigned to Senior Designer John Smith. M1 Pro chip, 32GB RAM',
  '2023-09-20 14:15:00',
  '2023-11-10 16:45:00'
),

(
  'HP EliteBook 840 G8',
  'LAP-003',
  'laptop',
  'HP',
  'EliteBook 840 G8',
  'HP840G8-003',
  'maintenance',
  'fair',
  'IT Service Center',
  75000.00,
  '2022-12-10',
  'Screen replacement needed. Intel i5, 8GB RAM. Under maintenance since Dec 2023',
  '2022-12-10 11:20:00',
  '2023-12-15 08:30:00'
),

(
  'Lenovo ThinkPad X1 Carbon',
  'LAP-004',
  'laptop',
  'Lenovo',
  'ThinkPad X1 Carbon Gen 9',
  'TP-X1C9-004',
  'broken',
  'damaged',
  'Warehouse - Repair Section',
  95000.00,
  '2022-05-18',
  'Motherboard failure. Not economically repairable. Ready for disposal',
  '2022-05-18 13:45:00',
  '2023-12-20 10:15:00'
),

(
  'Asus ZenBook Pro 15',
  'LAP-005',
  'laptop',
  'Asus',
  'ZenBook Pro 15 UX535',
  'ZB-PRO15-005',
  'allocated',
  'good',
  'Finance Department - Temp Desk',
  85000.00,
  '2023-03-22',
  'Temporarily allocated to Finance for audit project. Due back Jan 2024',
  '2023-03-22 10:00:00',
  '2023-12-01 14:30:00'
),

-- MONITORS (4 assets)
(
  'Dell UltraSharp 27" 4K',
  'MON-001',
  'monitor',
  'Dell',
  'U2723QE',
  'DU2723-001',
  'in_stock',
  'excellent',
  'Warehouse - Electronics Section',
  32000.00,
  '2023-11-05',
  'Brand new 27-inch 4K monitor. USB-C connectivity, height adjustable',
  '2023-11-05 16:20:00',
  '2023-11-05 16:20:00'
),

(
  'LG UltraWide 34"',
  'MON-002',
  'monitor',
  'LG',
  '34WN80C-B',
  'LG34WN-002',
  'deployed',
  'excellent',
  'Development Team - Station 8',
  45000.00,
  '2023-07-12',
  'Assigned to Lead Developer. 34-inch ultrawide, perfect for coding',
  '2023-07-12 09:15:00',
  '2023-08-01 11:00:00'
),

(
  'Samsung Odyssey G7 32"',
  'MON-003',
  'monitor',
  'Samsung',
  'C32G75TQSU',
  'SAM-G7-003',
  'retired',
  'fair',
  'Storage Room B',
  55000.00,
  '2021-06-30',
  'Gaming monitor - retired from active use. Some backlight bleeding',
  '2021-06-30 14:30:00',
  '2023-12-18 09:45:00'
),

(
  'BenQ PD3200U 32" 4K',
  'MON-004',
  'monitor',
  'BenQ',
  'PD3200U',
  'BQ-PD32-004',
  'in_stock',
  'good',
  'Warehouse - Shelf B3',
  48000.00,
  '2022-10-15',
  'Professional 4K monitor for design work. Color calibrated',
  '2022-10-15 12:45:00',
  '2022-10-15 12:45:00'
),

-- PRINTERS (3 assets)
(
  'Canon ImageRunner C3226',
  'PRT-001',
  'printer',
  'Canon',
  'ImageRunner C3226',
  'CN-IRC3226-001',
  'deployed',
  'good',
  'Main Office - Copy Center',
  180000.00,
  '2023-01-20',
  'Main office multifunction printer. Color printing, scanning, copying',
  '2023-01-20 08:30:00',
  '2023-02-01 10:15:00'
),

(
  'HP LaserJet Pro M404dn',
  'PRT-002',
  'printer',
  'HP',
  'LaserJet Pro M404dn',
  'HP-LJ404-002',
  'in_stock',
  'excellent',
  'Warehouse - Office Equipment',
  25000.00,
  '2023-09-10',
  'Monochrome laser printer. Duplex printing, network ready',
  '2023-09-10 15:20:00',
  '2023-09-10 15:20:00'
),

(
  'Epson EcoTank L3250',
  'PRT-003',
  'printer',
  'Epson',
  'EcoTank L3250',
  'EP-L3250-003',
  'broken',
  'poor',
  'Warehouse - Defective Items',
  15000.00,
  '2022-03-08',
  'Ink system clogged. Print head damaged. Beyond repair',
  '2022-03-08 11:30:00',
  '2023-10-12 14:20:00'
),

-- NETWORKING EQUIPMENT (3 assets)
(
  'Cisco Catalyst 2960-X Switch',
  'NET-001',
  'networking',
  'Cisco',
  'WS-C2960X-48FPD-L',
  'CS-2960X-001',
  'deployed',
  'excellent',
  'Server Room - Rack A',
  85000.00,
  '2023-05-15',
  '48-port PoE+ switch. Main network infrastructure',
  '2023-05-15 13:40:00',
  '2023-06-01 09:30:00'
),

(
  'Ubiquiti UniFi Access Point',
  'NET-002',
  'networking',
  'Ubiquiti',
  'UAP-AC-PRO',
  'UB-ACPRO-002',
  'in_stock',
  'excellent',
  'Warehouse - Network Equipment',
  8500.00,
  '2023-08-25',
  'Dual-band wireless access point. Ready for deployment',
  '2023-08-25 10:15:00',
  '2023-08-25 10:15:00'
),

(
  'TP-Link Archer AX73 Router',
  'NET-003',
  'networking',
  'TP-Link',
  'Archer AX73',
  'TPL-AX73-003',
  'maintenance',
  'good',
  'IT Workshop',
  12000.00,
  '2022-11-30',
  'WiFi 6 router. Firmware update and configuration needed',
  '2022-11-30 16:45:00',
  '2023-12-10 11:20:00'
),

-- SERVERS (2 assets)
(
  'Dell PowerEdge R740',
  'SRV-001',
  'server',
  'Dell',
  'PowerEdge R740',
  'DL-PE740-001',
  'deployed',
  'excellent',
  'Data Center - Rack 1',
  350000.00,
  '2023-04-10',
  'Main application server. Dual Xeon, 128GB RAM, RAID storage',
  '2023-04-10 14:00:00',
  '2023-05-15 16:30:00'
),

(
  'HP ProLiant DL380 Gen10',
  'SRV-002',
  'server',
  'HP',
  'ProLiant DL380 Gen10',
  'HP-DL380-002',
  'in_stock',
  'good',
  'Warehouse - Server Storage',
  280000.00,
  '2022-08-18',
  'Backup server. Ready for deployment. Intel Xeon, 64GB RAM',
  '2022-08-18 09:45:00',
  '2022-08-18 09:45:00'
),

-- MOBILE DEVICES (2 assets)
(
  'iPhone 14 Pro',
  'PHN-001',
  'phone',
  'Apple',
  'iPhone 14 Pro',
  'IP14P-001',
  'allocated',
  'excellent',
  'Sales Team - Manager Office',
  65000.00,
  '2023-10-05',
  'Company phone for Sales Manager. 256GB, Pro camera system',
  '2023-10-05 11:30:00',
  '2023-11-01 13:15:00'
),

(
  'Samsung Galaxy Tab S8',
  'TAB-001',
  'tablet',
  'Samsung',
  'Galaxy Tab S8',
  'SGT-S8-001',
  'in_stock',
  'excellent',
  'Warehouse - Mobile Devices',
  45000.00,
  '2023-06-20',
  'Android tablet for field work. S Pen included, 128GB storage',
  '2023-06-20 14:20:00',
  '2023-06-20 14:20:00'
),

-- PROJECTOR (1 asset)
(
  'Epson PowerLite 2247U',
  'PRJ-001',
  'projector',
  'Epson',
  'PowerLite 2247U',
  'EP-PL2247-001',
  'deployed',
  'good',
  'Conference Room A',
  95000.00,
  '2022-09-12',
  'Main conference room projector. 4200 lumens, wireless connectivity',
  '2022-09-12 15:50:00',
  '2023-01-15 10:30:00'
),

-- ACCESSORIES (1 asset)
(
  'Logitech MX Master 3 Mouse',
  'ACC-001',
  'accessory',
  'Logitech',
  'MX Master 3',
  'LG-MX3-001',
  'in_stock',
  'excellent',
  'Warehouse - Accessories',
  4500.00,
  '2023-07-08',
  'Wireless mouse for productivity. Ergonomic design, multiple device support',
  '2023-07-08 12:00:00',
  '2023-07-08 12:00:00'
),

-- DISPOSED ASSET (1 asset for testing disposal page)
(
  'Old Dell OptiPlex Desktop',
  'DSK-999',
  'computer',
  'Dell',
  'OptiPlex 3070',
  'DL-OP3070-999',
  'disposed',
  'poor',
  'Disposal Facility',
  35000.00,
  '2020-03-15',
  '[DISPOSED] End of lifecycle disposal. Hard drive wiped, recycled properly on 2023-12-15',
  '2020-03-15 10:00:00',
  '2023-12-15 14:30:00'
);

-- Update some assets with additional notes for testing
UPDATE assets 
SET notes = notes || '\n\nLast maintenance: 2023-11-15. Battery replacement completed.'
WHERE asset_tag = 'LAP-003';

UPDATE assets 
SET notes = notes || '\n\nRetired from active use on 2023-12-18. Considering disposal.'
WHERE asset_tag = 'MON-003';