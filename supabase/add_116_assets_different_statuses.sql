-- Add 116 sample assets as explicit manual-style rows.
-- This version does not use generate_series. Every sample asset is listed below.
-- It removes only the previous rows created by this script.
--
-- Status distribution:
-- in_stock: 30, deployed: 25, allocated: 20, maintenance: 15,
-- retired: 10, disposed: 6, lost: 4, stolen: 3, broken: 3.

BEGIN;

DELETE FROM public.assets
WHERE serial_number LIKE 'STATUS-SAMPLE-SN-%';

WITH manual_assets(sample_no, category, brand, status, asset_condition, location, purchase_date) AS (
  VALUES
    (1, 'computer', 'Dell', 'in_stock', 'excellent', 'ITSD Office', DATE '2020-01-15'),
    (2, 'laptop', 'HP', 'in_stock', 'good', 'Inventory Office', DATE '2020-02-20'),
    (3, 'monitor', 'Lenovo', 'in_stock', 'fair', 'ITSD Office', DATE '2020-03-10'),
    (4, 'printer', 'Acer', 'in_stock', 'excellent', 'Inventory Office', DATE '2020-04-05'),
    (5, 'projector', 'Epson', 'in_stock', 'good', 'ITSD Office', DATE '2020-05-12'),
    (6, 'server', 'Dell', 'in_stock', 'fair', 'Inventory Office', DATE '2020-06-18'),
    (7, 'networking', 'Cisco', 'in_stock', 'excellent', 'ITSD Office', DATE '2020-07-22'),
    (8, 'scanner', 'Canon', 'in_stock', 'good', 'Inventory Office', DATE '2020-08-14'),
    (9, 'ups', 'APC', 'in_stock', 'fair', 'ITSD Office', DATE '2020-09-09'),
    (10, 'other', 'Samsung', 'in_stock', 'excellent', 'Inventory Office', DATE '2020-10-25'),
    (11, 'computer', 'Dell', 'in_stock', 'good', 'ITSD Office', DATE '2020-11-11'),
    (12, 'laptop', 'HP', 'in_stock', 'fair', 'Inventory Office', DATE '2020-12-01'),
    (13, 'monitor', 'Lenovo', 'in_stock', 'excellent', 'ITSD Office', DATE '2021-01-16'),
    (14, 'printer', 'Acer', 'in_stock', 'good', 'Inventory Office', DATE '2021-02-21'),
    (15, 'projector', 'Epson', 'in_stock', 'fair', 'ITSD Office', DATE '2021-03-13'),
    (16, 'server', 'Dell', 'in_stock', 'excellent', 'Inventory Office', DATE '2021-04-07'),
    (17, 'networking', 'Cisco', 'in_stock', 'good', 'ITSD Office', DATE '2021-05-19'),
    (18, 'scanner', 'Canon', 'in_stock', 'fair', 'Inventory Office', DATE '2021-06-24'),
    (19, 'ups', 'APC', 'in_stock', 'excellent', 'ITSD Office', DATE '2021-07-08'),
    (20, 'other', 'Samsung', 'in_stock', 'good', 'Inventory Office', DATE '2021-08-17'),
    (21, 'computer', 'Dell', 'in_stock', 'fair', 'ITSD Office', DATE '2021-09-27'),
    (22, 'laptop', 'HP', 'in_stock', 'excellent', 'Inventory Office', DATE '2021-10-15'),
    (23, 'monitor', 'Lenovo', 'in_stock', 'good', 'ITSD Office', DATE '2021-11-03'),
    (24, 'printer', 'Acer', 'in_stock', 'fair', 'Inventory Office', DATE '2021-12-12'),
    (25, 'projector', 'Epson', 'in_stock', 'excellent', 'ITSD Office', DATE '2022-01-18'),
    (26, 'server', 'Dell', 'in_stock', 'good', 'Inventory Office', DATE '2022-02-22'),
    (27, 'networking', 'Cisco', 'in_stock', 'fair', 'ITSD Office', DATE '2022-03-11'),
    (28, 'scanner', 'Canon', 'in_stock', 'excellent', 'Inventory Office', DATE '2022-04-16'),
    (29, 'ups', 'APC', 'in_stock', 'good', 'ITSD Office', DATE '2022-05-09'),
    (30, 'other', 'Samsung', 'in_stock', 'fair', 'Inventory Office', DATE '2022-06-20'),

    (31, 'computer', 'Dell', 'deployed', 'good', 'ITSD Office', DATE '2019-01-12'),
    (32, 'laptop', 'HP', 'deployed', 'excellent', 'Inventory Office', DATE '2019-02-18'),
    (33, 'monitor', 'Lenovo', 'deployed', 'fair', 'ITSD Office', DATE '2019-03-25'),
    (34, 'printer', 'Acer', 'deployed', 'good', 'Inventory Office', DATE '2019-04-14'),
    (35, 'projector', 'Epson', 'deployed', 'excellent', 'ITSD Office', DATE '2019-05-21'),
    (36, 'server', 'Dell', 'deployed', 'fair', 'Inventory Office', DATE '2019-06-17'),
    (37, 'networking', 'Cisco', 'deployed', 'good', 'ITSD Office', DATE '2019-07-23'),
    (38, 'scanner', 'Canon', 'deployed', 'excellent', 'Inventory Office', DATE '2019-08-08'),
    (39, 'ups', 'APC', 'deployed', 'fair', 'ITSD Office', DATE '2019-09-19'),
    (40, 'other', 'Samsung', 'deployed', 'good', 'Inventory Office', DATE '2019-10-27'),
    (41, 'computer', 'Dell', 'deployed', 'excellent', 'ITSD Office', DATE '2019-11-06'),
    (42, 'laptop', 'HP', 'deployed', 'fair', 'Inventory Office', DATE '2019-12-15'),
    (43, 'monitor', 'Lenovo', 'deployed', 'good', 'ITSD Office', DATE '2020-01-24'),
    (44, 'printer', 'Acer', 'deployed', 'excellent', 'Inventory Office', DATE '2020-02-13'),
    (45, 'projector', 'Epson', 'deployed', 'fair', 'ITSD Office', DATE '2020-03-22'),
    (46, 'server', 'Dell', 'deployed', 'good', 'Inventory Office', DATE '2020-04-11'),
    (47, 'networking', 'Cisco', 'deployed', 'excellent', 'ITSD Office', DATE '2020-05-18'),
    (48, 'scanner', 'Canon', 'deployed', 'fair', 'Inventory Office', DATE '2020-06-26'),
    (49, 'ups', 'APC', 'deployed', 'good', 'ITSD Office', DATE '2020-07-14'),
    (50, 'other', 'Samsung', 'deployed', 'excellent', 'Inventory Office', DATE '2020-08-03'),
    (51, 'computer', 'Dell', 'deployed', 'fair', 'ITSD Office', DATE '2020-09-16'),
    (52, 'laptop', 'HP', 'deployed', 'good', 'Inventory Office', DATE '2020-10-29'),
    (53, 'monitor', 'Lenovo', 'deployed', 'excellent', 'ITSD Office', DATE '2020-11-20'),
    (54, 'printer', 'Acer', 'deployed', 'fair', 'Inventory Office', DATE '2020-12-08'),
    (55, 'projector', 'Epson', 'deployed', 'good', 'ITSD Office', DATE '2021-01-30'),

    (56, 'server', 'Dell', 'allocated', 'fair', 'Inventory Office', DATE '2018-01-11'),
    (57, 'networking', 'Cisco', 'allocated', 'good', 'ITSD Office', DATE '2018-02-19'),
    (58, 'scanner', 'Canon', 'allocated', 'excellent', 'Inventory Office', DATE '2018-03-24'),
    (59, 'ups', 'APC', 'allocated', 'fair', 'ITSD Office', DATE '2018-04-16'),
    (60, 'other', 'Samsung', 'allocated', 'good', 'Inventory Office', DATE '2018-05-28'),
    (61, 'computer', 'Dell', 'allocated', 'excellent', 'ITSD Office', DATE '2018-06-13'),
    (62, 'laptop', 'HP', 'allocated', 'fair', 'Inventory Office', DATE '2018-07-21'),
    (63, 'monitor', 'Lenovo', 'allocated', 'good', 'ITSD Office', DATE '2018-08-09'),
    (64, 'printer', 'Acer', 'allocated', 'excellent', 'Inventory Office', DATE '2018-09-18'),
    (65, 'projector', 'Epson', 'allocated', 'fair', 'ITSD Office', DATE '2018-10-26'),
    (66, 'server', 'Dell', 'allocated', 'good', 'Inventory Office', DATE '2018-11-14'),
    (67, 'networking', 'Cisco', 'allocated', 'excellent', 'ITSD Office', DATE '2018-12-07'),
    (68, 'scanner', 'Canon', 'allocated', 'fair', 'Inventory Office', DATE '2019-01-29'),
    (69, 'ups', 'APC', 'allocated', 'good', 'ITSD Office', DATE '2019-02-11'),
    (70, 'other', 'Samsung', 'allocated', 'excellent', 'Inventory Office', DATE '2019-03-20'),
    (71, 'computer', 'Dell', 'allocated', 'fair', 'ITSD Office', DATE '2019-04-27'),
    (72, 'laptop', 'HP', 'allocated', 'good', 'Inventory Office', DATE '2019-05-15'),
    (73, 'monitor', 'Lenovo', 'allocated', 'excellent', 'ITSD Office', DATE '2019-06-23'),
    (74, 'printer', 'Acer', 'allocated', 'fair', 'Inventory Office', DATE '2019-07-12'),
    (75, 'projector', 'Epson', 'allocated', 'good', 'ITSD Office', DATE '2019-08-22'),

    (76, 'server', 'Dell', 'maintenance', 'poor', 'Inventory Office', DATE '2017-01-12'),
    (77, 'networking', 'Cisco', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-02-20'),
    (78, 'scanner', 'Canon', 'maintenance', 'poor', 'Inventory Office', DATE '2017-03-18'),
    (79, 'ups', 'APC', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-04-26'),
    (80, 'other', 'Samsung', 'maintenance', 'poor', 'Inventory Office', DATE '2017-05-14'),
    (81, 'computer', 'Dell', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-06-22'),
    (82, 'laptop', 'HP', 'maintenance', 'poor', 'Inventory Office', DATE '2017-07-11'),
    (83, 'monitor', 'Lenovo', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-08-19'),
    (84, 'printer', 'Acer', 'maintenance', 'poor', 'Inventory Office', DATE '2017-09-27'),
    (85, 'projector', 'Epson', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-10-16'),
    (86, 'server', 'Dell', 'maintenance', 'poor', 'Inventory Office', DATE '2017-11-24'),
    (87, 'networking', 'Cisco', 'maintenance', 'damaged', 'ITSD Office', DATE '2017-12-13'),
    (88, 'scanner', 'Canon', 'maintenance', 'poor', 'Inventory Office', DATE '2018-01-21'),
    (89, 'ups', 'APC', 'maintenance', 'damaged', 'ITSD Office', DATE '2018-02-28'),
    (90, 'other', 'Samsung', 'maintenance', 'poor', 'Inventory Office', DATE '2018-03-17'),

    (91, 'computer', 'Dell', 'retired', 'poor', 'ITSD Office', DATE '2015-01-12'),
    (92, 'laptop', 'HP', 'retired', 'damaged', 'Inventory Office', DATE '2015-02-20'),
    (93, 'monitor', 'Lenovo', 'retired', 'poor', 'ITSD Office', DATE '2015-03-18'),
    (94, 'printer', 'Acer', 'retired', 'damaged', 'Inventory Office', DATE '2015-04-26'),
    (95, 'projector', 'Epson', 'retired', 'poor', 'ITSD Office', DATE '2015-05-14'),
    (96, 'server', 'Dell', 'retired', 'damaged', 'Inventory Office', DATE '2015-06-22'),
    (97, 'networking', 'Cisco', 'retired', 'poor', 'ITSD Office', DATE '2015-07-11'),
    (98, 'scanner', 'Canon', 'retired', 'damaged', 'Inventory Office', DATE '2015-08-19'),
    (99, 'ups', 'APC', 'retired', 'poor', 'ITSD Office', DATE '2015-09-27'),
    (100, 'other', 'Samsung', 'retired', 'damaged', 'Inventory Office', DATE '2015-10-16'),

    (101, 'computer', 'Dell', 'disposed', 'damaged', 'ITSD Office', DATE '2014-01-12'),
    (102, 'laptop', 'HP', 'disposed', 'poor', 'Inventory Office', DATE '2014-02-20'),
    (103, 'monitor', 'Lenovo', 'disposed', 'damaged', 'ITSD Office', DATE '2014-03-18'),
    (104, 'printer', 'Acer', 'disposed', 'poor', 'Inventory Office', DATE '2014-04-26'),
    (105, 'projector', 'Epson', 'disposed', 'damaged', 'ITSD Office', DATE '2014-05-14'),
    (106, 'server', 'Dell', 'disposed', 'poor', 'Inventory Office', DATE '2014-06-22'),

    (107, 'networking', 'Cisco', 'lost', 'poor', 'ITSD Office', DATE '2016-01-11'),
    (108, 'scanner', 'Canon', 'lost', 'fair', 'Inventory Office', DATE '2016-02-19'),
    (109, 'ups', 'APC', 'lost', 'poor', 'ITSD Office', DATE '2016-03-24'),
    (110, 'other', 'Samsung', 'lost', 'fair', 'Inventory Office', DATE '2016-04-16'),

    (111, 'computer', 'Dell', 'stolen', 'poor', 'ITSD Office', DATE '2016-05-28'),
    (112, 'laptop', 'HP', 'stolen', 'fair', 'Inventory Office', DATE '2016-06-13'),
    (113, 'monitor', 'Lenovo', 'stolen', 'poor', 'ITSD Office', DATE '2016-07-21'),

    (114, 'printer', 'Acer', 'broken', 'damaged', 'Inventory Office', DATE '2016-08-09'),
    (115, 'projector', 'Epson', 'broken', 'poor', 'ITSD Office', DATE '2016-09-18'),
    (116, 'server', 'Dell', 'broken', 'damaged', 'Inventory Office', DATE '2016-10-26')
)
INSERT INTO public.assets (
  name,
  description,
  category,
  brand,
  model,
  serial_number,
  invoice_number,
  purchase_date,
  purchase_cost,
  vendor,
  warranty_start_date,
  warranty_end_date,
  warranty_provider,
  warranty_type,
  location,
  status,
  condition,
  notes,
  qr_code
)
SELECT
  format('Manual Status Asset %s', sample_no),
  format('Manual sample asset %s for status testing.', sample_no),
  category::asset_category,
  brand,
  format('Manual Model %s', sample_no),
  format('STATUS-SAMPLE-SN-%s', lpad(sample_no::TEXT, 3, '0')),
  format('STATUS-SAMPLE-INV-%s', lpad(sample_no::TEXT, 3, '0')),
  purchase_date,
  (18000 + sample_no * 175)::NUMERIC(12, 2),
  'Manual Sample Technology Vendor',
  purchase_date,
  purchase_date + 1095,
  'Manual Sample Warranty Provider',
  'Standard 3-Year Warranty',
  location,
  status::asset_status,
  asset_condition::asset_condition,
  format('Manually listed sample asset with status: %s.', status),
  format('https://sample.invalid/assets?status-sample=%s', lpad(sample_no::TEXT, 3, '0'))
FROM manual_assets;

COMMIT;

-- Verify the 116 explicit sample rows and their status distribution.
SELECT status, COUNT(*) AS total_assets
FROM public.assets
WHERE serial_number LIKE 'STATUS-SAMPLE-SN-%'
GROUP BY status
ORDER BY status;

SELECT COUNT(*) AS total_status_sample_assets
FROM public.assets
WHERE serial_number LIKE 'STATUS-SAMPLE-SN-%';
