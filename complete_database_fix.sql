-- ==============================================================================
-- COMPLETE DATABASE FIX
-- This will ensure both assets and asset_assignments tables exist with correct structure
-- ==============================================================================

-- First, ensure assets table exists (from SIMPLE_SETUP.sql)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  vendor TEXT,
  warranty_end_date DATE,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'in_stock',
  condition TEXT DEFAULT 'excellent',
  -- Computer/Laptop specific fields
  computer_name TEXT,
  mac_address TEXT,
  ip_address TEXT,
  operating_system TEXT,
  processor TEXT,
  ram_gb INTEGER,
  storage_gb INTEGER,
  -- CCTV specific fields
  camera_resolution TEXT,
  camera_type TEXT,
  -- Network equipment fields
  port_count INTEGER,
  management_ip TEXT,
  firmware_version TEXT,
  -- General specifications
  power_consumption_watts INTEGER,
  dimensions TEXT,
  weight_kg DECIMAL(5,2),
  -- Metadata
  notes TEXT,
  assigned_to UUID,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop and recreate asset_assignments table with correct structure
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

CREATE TABLE public.asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_email TEXT NOT NULL,
  borrower_department TEXT NOT NULL,
  borrower_employee_id TEXT,
  borrower_phone TEXT,
  assignment_location TEXT NOT NULL,
  purpose TEXT NOT NULL,
  assignment_type TEXT NOT NULL,
  expected_return_date DATE,
  project_name TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'active',
  assigned_by UUID,
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE public.asset_assignments
ADD CONSTRAINT fk_asset_assignments_asset_id
FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE CASCADE;

-- Enable RLS on both tables
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.assets;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.asset_assignments;
DROP POLICY IF EXISTS "assets_policy" ON public.assets;
DROP POLICY IF EXISTS "asset_assignments_policy" ON public.asset_assignments;

-- Create more permissive policies for assets table
CREATE POLICY "Enable all access for authenticated users" ON public.assets
    FOR ALL 
    USING (true);

CREATE POLICY "Enable all access for anon users" ON public.assets
    FOR ALL 
    USING (true);

-- Create more permissive policies for asset_assignments table  
CREATE POLICY "Enable all access for authenticated users" ON public.asset_assignments
    FOR ALL 
    USING (true);

CREATE POLICY "Enable all access for anon users" ON public.asset_assignments
    FOR ALL 
    USING (true);

-- Grant permissions
GRANT ALL ON public.assets TO authenticated;
GRANT ALL ON public.assets TO anon;
GRANT ALL ON public.asset_assignments TO authenticated;
GRANT ALL ON public.asset_assignments TO anon;

-- Reset all assets to in_stock status to make them available
UPDATE public.assets 
SET status = 'in_stock'
WHERE status != 'in_stock';

-- Show results
SELECT 'ASSETS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'ASSET_ASSIGNMENTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'asset_assignments' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'ASSET STATUS SUMMARY:' as info;
SELECT status, COUNT(*) as count
FROM public.assets
GROUP BY status
ORDER BY status;