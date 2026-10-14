-- Sample Borrow Request data matching the attached chart.
-- Total rows inserted: 440
--
-- Chart counts:
-- Monitor       150
-- Desktop        96
-- Laptop         80
-- Printer        29
-- Projector      27
-- UPS             18
-- Network Switch 13
-- Server          13
-- Scanner          5
-- Router           5
-- Access Point     4
--
-- Requires: 20240101_add_borrow_request_fields.sql to be applied first.

BEGIN;

-- Remove only rows created by this sample script so it can be safely rerun.
DELETE FROM public.asset_requests
WHERE email LIKE 'sample.borrower.%@example.com';

WITH chart_counts(asset_type, chart_label, total_count) AS (
  VALUES
    ('monitor',      'Monitor',        150),
    ('computer',     'Desktop',         96),
    ('laptop',       'Laptop',          80),
    ('printer',      'Printer',         29),
    ('projector',    'Projector',       27),
    ('ups',          'UPS',             18),
    ('networking',   'Network Switch',  13),
    ('server',       'Server',          13),
    ('scanner',      'Scanner',          5),
    ('router',       'Router',           5),
    ('access_point', 'Access Point',     4)
),
expanded AS (
  SELECT
    c.asset_type,
    c.chart_label,
    series.sample_number
  FROM chart_counts c
  CROSS JOIN LATERAL generate_series(1, c.total_count) AS series(sample_number)
),
numbered AS (
  SELECT
    expanded.*,
    ROW_NUMBER() OVER (ORDER BY chart_label, sample_number) AS row_number
  FROM expanded
)
INSERT INTO public.asset_requests (
  request_type,
  status,
  full_name,
  email,
  contact_number,
  department,
  asset_type,
  preferred_brand,
  quantity,
  purpose,
  usage_location,
  borrowing_date,
  return_date,
  additional_instructions,
  location,
  preferred_date,
  asset_details,
  description,
  created_at,
  updated_at
)
SELECT
  'borrow_request',
  'pending',
  format('Sample Borrower %s', row_number),
  format('sample.borrower.%s@example.com', row_number),
  '0917-' || lpad((row_number % 10000)::text, 4, '0') || '-' || lpad(((row_number * 7) % 10000)::text, 4, '0'),
  CASE (row_number % 5)
    WHEN 0 THEN 'CITE Faculty'
    WHEN 1 THEN 'IT Department'
    WHEN 2 THEN 'Finance Office'
    WHEN 3 THEN 'Library'
    ELSE 'Registrar''s Office'
  END,
  asset_type,
  CASE (row_number % 4)
    WHEN 0 THEN 'Dell'
    WHEN 1 THEN 'HP'
    WHEN 2 THEN 'Lenovo'
    ELSE 'Any available brand'
  END,
  1,
  format('Sample borrowing request for %s equipment', chart_label),
  CASE (row_number % 4)
    WHEN 0 THEN 'CITE Laboratory 1'
    WHEN 1 THEN 'CITE Laboratory 2'
    WHEN 2 THEN 'CITE Faculty'
    ELSE 'Conference Room'
  END,
  CURRENT_DATE + (((row_number % 30) + 1)::integer),
  CURRENT_DATE + (((row_number % 30) + 4)::integer),
  'Generated sample data for pagination and chart testing.',
  CASE (row_number % 4)
    WHEN 0 THEN 'CITE Laboratory 1'
    WHEN 1 THEN 'CITE Laboratory 2'
    WHEN 2 THEN 'CITE Faculty'
    ELSE 'Conference Room'
  END,
  CURRENT_DATE + (((row_number % 30) + 1)::integer),
  chart_label,
  format('Sample %s borrow request for testing.', chart_label),
  NOW() - (((row_number - 1)::double precision) * INTERVAL '1 hour'),
  NOW() - (((row_number - 1)::double precision) * INTERVAL '1 hour')
FROM numbered;

COMMIT;

-- Verify the inserted counts. The result should match the chart exactly.
SELECT
  asset_type,
  COUNT(*) AS total_requests
FROM public.asset_requests
WHERE email LIKE 'sample.borrower.%@example.com'
GROUP BY asset_type
ORDER BY total_requests DESC, asset_type;

SELECT COUNT(*) AS total_sample_requests
FROM public.asset_requests
WHERE email LIKE 'sample.borrower.%@example.com';
