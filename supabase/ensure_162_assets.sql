-- Safely make the assets table contain exactly 162 records.
-- This script only INSERTS missing sample assets. It never deletes existing assets.
-- If there are already more than 162 assets, it stops with an error so no data is removed.

DO $$
DECLARE
  existing_count INTEGER;
  rows_to_add INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER
  INTO existing_count
  FROM public.assets;

  IF existing_count > 162 THEN
    RAISE EXCEPTION
      'The assets table already contains % records. No rows were deleted; manual cleanup is required to reach 162.',
      existing_count;
  END IF;

  rows_to_add := 162 - existing_count;

  IF rows_to_add > 0 THEN
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
      format('Sample Asset %s', sequence_number),
      'Generated sample asset for inventory testing and dashboard reporting.',
      (
        CASE (sequence_number % 10)
          WHEN 0 THEN 'computer'
          WHEN 1 THEN 'laptop'
          WHEN 2 THEN 'monitor'
          WHEN 3 THEN 'printer'
          WHEN 4 THEN 'projector'
          WHEN 5 THEN 'server'
          WHEN 6 THEN 'networking'
          WHEN 7 THEN 'scanner'
          WHEN 8 THEN 'ups'
          ELSE 'other'
        END
      )::asset_category,
      CASE (sequence_number % 4)
        WHEN 0 THEN 'Dell'
        WHEN 1 THEN 'HP'
        WHEN 2 THEN 'Lenovo'
        ELSE 'Acer'
      END,
      format('Sample Model %s', sequence_number),
      format('SAMPLE-SN-%s', lpad(sequence_number::TEXT, 5, '0')),
      format('SAMPLE-INV-%s', lpad(sequence_number::TEXT, 5, '0')),
      DATE '2018-01-01' + (((sequence_number * 17) % 2500)::INTEGER),
      (25000 + (sequence_number * 125))::NUMERIC(12, 2),
      'Sample Technology Vendor',
      DATE '2018-01-01' + (((sequence_number * 17) % 2500)::INTEGER),
      DATE '2018-01-01' + (((sequence_number * 17) % 2500)::INTEGER) + 1095,
      'Sample Warranty Provider',
      'Standard 3-Year Warranty',
      CASE (sequence_number % 2)
        WHEN 0 THEN 'ITSD Office'
        ELSE 'Inventory Office'
      END,
      CASE (sequence_number % 4)
        WHEN 0 THEN 'in_stock'
        WHEN 1 THEN 'deployed'
        WHEN 2 THEN 'allocated'
        ELSE 'maintenance'
      END,
      CASE (sequence_number % 5)
        WHEN 0 THEN 'excellent'
        WHEN 1 THEN 'good'
        WHEN 2 THEN 'fair'
        WHEN 3 THEN 'poor'
        ELSE 'damaged'
      END,
      'Generated sample record; replace or remove only if it is test data.',
      format('https://sample.invalid/assets?sample=SAMPLE-%s', lpad(sequence_number::TEXT, 5, '0'))
    FROM generate_series(1, rows_to_add) AS generated(sequence_number);
  END IF;

  RAISE NOTICE 'Assets before insert: %. Sample assets inserted: %. Final total: 162.', existing_count, rows_to_add;
END $$;

-- Verify the final total.
SELECT COUNT(*) AS total_assets
FROM public.assets;
