-- ==============================================================================
-- ITAMS MASTER INVENTORY DATABASE SETUP
-- ==============================================================================
-- Centralized SQL script for ITAMS inventory and asset tracking.
-- Copy and run this ENTIRE script in your Supabase SQL Editor.
-- 
-- Tables Managed:
--   1. public.assets              -> Main inventory (preserves existing assets)
--   2. public.asset_assignments   -> Long-term / permanent asset assignments
--   3. public.asset_borrowing     -> Short-term equipment borrowing
--   4. public.asset_repairs       -> Maintenance and repair tracking
-- ==============================================================================


-- ==============================================================================
-- SECTION 1: CUSTOM ENUM TYPES
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category') THEN
        CREATE TYPE asset_category AS ENUM (
          'computer', 'laptop', 'server', 'monitor', 'printer', 'scanner',
          'networking', 'cctv', 'phone', 'tablet', 'projector', 'ups',
          'storage', 'accessory', 'software', 'other'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status') THEN
        CREATE TYPE asset_status AS ENUM (
          'in_stock', 'allocated', 'deployed', 'maintenance', 
          'retired', 'disposed', 'lost', 'stolen'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_condition') THEN
        CREATE TYPE asset_condition AS ENUM (
          'excellent', 'good', 'fair', 'poor', 'damaged'
        );
    END IF;
END $$;


-- ==============================================================================
-- SECTION 2: MAIN ASSETS TABLE (Preserves Existing Inventory Data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category asset_category NOT NULL DEFAULT 'computer',
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_provider VARCHAR(255),
    warranty_type VARCHAR(100),
    location VARCHAR(255),
    status asset_status DEFAULT 'in_stock',
    condition asset_condition DEFAULT 'excellent',
    computer_name VARCHAR(100),
    mac_address VARCHAR(17),
    ip_address INET,
    operating_system VARCHAR(100),
    processor VARCHAR(255),
    ram_gb INTEGER,
    storage_gb INTEGER,
    network_domain VARCHAR(100),
    camera_resolution VARCHAR(50),
    camera_type VARCHAR(50),
    recording_capacity_tb DECIMAL(5,2),
    port_count INTEGER,
    management_ip INET,
    firmware_version VARCHAR(100),
    power_consumption_watts INTEGER,
    dimensions VARCHAR(100),
    weight_kg DECIMAL(5,2),
    assigned_to UUID,
    assigned_date TIMESTAMPTZ,
    last_maintenance_date DATE,
    next_maintenance_due DATE,
    notes TEXT,
    qr_code TEXT,
    barcode TEXT,
    photo_url TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crucial: Ensure existing assets table has 'status', 'category', and 'condition' columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN status asset_status DEFAULT 'in_stock';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN category asset_category DEFAULT 'computer';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'condition'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN condition asset_condition DEFAULT 'excellent';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'assets' AND column_name = 'qr_code'
    ) THEN
        ALTER TABLE public.assets ADD COLUMN qr_code TEXT;
    END IF;
END $$;


-- ==============================================================================
-- SECTION 3: ASSET ASSIGNMENTS & BORROWING (Re-created cleanly to fix columns)
-- ==============================================================================
-- Drop existing assignment & borrowing tables so outdated/incompatible schemas are replaced
DROP TABLE IF EXISTS public.asset_borrowing CASCADE;
DROP TABLE IF EXISTS public.asset_assignments CASCADE;

-- 3A. ASSET ASSIGNMENTS TABLE (Permanent / Long-Term)
CREATE TABLE public.asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Assignee Details
    assignee_name TEXT NOT NULL,
    assignee_email TEXT NOT NULL,
    assignee_department TEXT NOT NULL,
    assignee_employee_id TEXT,
    assignee_phone TEXT,
    
    -- Assignment Details
    assignment_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    assignment_reason TEXT,
    
    -- Tracking & Workflow
    supervisor_name TEXT,
    supervisor_email TEXT,
    special_instructions TEXT,
    notes TEXT,
    assigned_by UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'returned', 'terminated')),
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    effective_start_date DATE DEFAULT CURRENT_DATE,
    expected_end_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3B. ASSET BORROWING TABLE (Temporary / Short-Term)
CREATE TABLE public.asset_borrowing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Borrower Details
    borrower_name TEXT NOT NULL,
    borrower_email TEXT NOT NULL,
    borrower_department TEXT NOT NULL,
    borrower_employee_id TEXT,
    borrower_phone TEXT,
    
    -- Borrowing Details
    borrow_location TEXT NOT NULL,
    purpose TEXT NOT NULL,
    project_name TEXT,
    expected_return_date DATE NOT NULL,
    actual_return_date TIMESTAMPTZ,
    
    -- Tracking & Workflow
    supervisor_name TEXT,
    supervisor_email TEXT,
    special_instructions TEXT,
    borrowed_by UUID,
    returned_by UUID,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue', 'lost', 'damaged')),
    borrowed_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Condition & Extension Tracking
    condition_on_borrow TEXT DEFAULT 'good' CHECK (condition_on_borrow IN ('excellent', 'good', 'fair', 'poor')),
    condition_on_return TEXT CHECK (condition_on_return IN ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost')),
    condition_notes TEXT,
    extension_requests JSONB DEFAULT '[]',
    late_return_fees DECIMAL(10,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- SECTION 4: ASSET REPAIRS TABLE (Maintenance & Service)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.asset_repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    
    -- Ticket Details
    repair_ticket TEXT UNIQUE NOT NULL,
    issue_description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'quote_pending', 'completed', 'cancelled')),
    
    -- Reporter Details
    reported_by_name TEXT NOT NULL,
    reported_by_email TEXT,
    reported_by_department TEXT,
    reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Technician / Service Provider
    assigned_technician TEXT,
    technician_contact TEXT,
    service_provider TEXT,
    
    -- Dates (No cost tracking - repairs are free)
    estimated_completion_date DATE,
    actual_completion_date DATE,
    
    -- Details
    repair_location TEXT,
    notes TEXT,
    work_order_number TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure status exists on asset_repairs if table was already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'asset_repairs' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.asset_repairs ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;


-- ==============================================================================
-- SECTION 5: PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_tag ON public.assets(asset_tag);

CREATE INDEX IF NOT EXISTS idx_asset_assignments_asset_id ON public.asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_status ON public.asset_assignments(status);
CREATE INDEX IF NOT EXISTS idx_asset_assignments_email ON public.asset_assignments(assignee_email);

CREATE INDEX IF NOT EXISTS idx_asset_borrowing_asset_id ON public.asset_borrowing(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_borrowing_status ON public.asset_borrowing(status);
CREATE INDEX IF NOT EXISTS idx_asset_borrowing_email ON public.asset_borrowing(borrower_email);
CREATE INDEX IF NOT EXISTS idx_asset_borrowing_expected_return ON public.asset_borrowing(expected_return_date);

CREATE INDEX IF NOT EXISTS idx_asset_repairs_asset_id ON public.asset_repairs(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_repairs_status ON public.asset_repairs(status);


-- ==============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) & ACCESS PERMISSIONS
-- ==============================================================================
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_borrowing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_repairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_full_access" ON public.assets;
DROP POLICY IF EXISTS "asset_assignments_full_access" ON public.asset_assignments;
DROP POLICY IF EXISTS "asset_borrowing_full_access" ON public.asset_borrowing;
DROP POLICY IF EXISTS "asset_repairs_full_access" ON public.asset_repairs;

CREATE POLICY "assets_full_access" ON public.assets
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "asset_assignments_full_access" ON public.asset_assignments
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "asset_borrowing_full_access" ON public.asset_borrowing
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

CREATE POLICY "asset_repairs_full_access" ON public.asset_repairs
    FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

GRANT ALL ON public.assets TO authenticated, anon;
GRANT ALL ON public.asset_assignments TO authenticated, anon;
GRANT ALL ON public.asset_borrowing TO authenticated, anon;
GRANT ALL ON public.asset_repairs TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;


-- ==============================================================================
-- SECTION 7: UPDATED_AT TRIGGERS & TICKET GENERATOR
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_updated_at ON public.assets;
CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_asset_assignments_updated_at ON public.asset_assignments;
CREATE TRIGGER trg_asset_assignments_updated_at
    BEFORE UPDATE ON public.asset_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_asset_borrowing_updated_at ON public.asset_borrowing;
CREATE TRIGGER trg_asset_borrowing_updated_at
    BEFORE UPDATE ON public.asset_borrowing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_asset_repairs_updated_at ON public.asset_repairs;
CREATE TRIGGER trg_asset_repairs_updated_at
    BEFORE UPDATE ON public.asset_repairs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_repair_ticket()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    SELECT COALESCE(MAX(CAST(SUBSTRING(repair_ticket FROM 'RPR-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.asset_repairs
    WHERE repair_ticket LIKE 'RPR-' || year_part || '-%';
    
    RETURN 'RPR-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- SECTION 8: SCHEMA CACHE RELOAD
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.assets IS 'Main IT assets inventory table';
COMMENT ON TABLE public.asset_assignments IS 'Asset assignments tracking table';
COMMENT ON TABLE public.asset_borrowing IS 'Asset borrowing tracking table';
COMMENT ON TABLE public.asset_repairs IS 'Asset maintenance and repairs table';


-- ==============================================================================
-- SECTION 9: VERIFICATION
-- ==============================================================================
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('assets', 'asset_assignments', 'asset_borrowing', 'asset_repairs')
GROUP BY table_name;


-- ==============================================================================
-- OPTIONAL CLEANUP / RESET QUERIES (RUN ONLY WHEN NEEDED)
-- ==============================================================================
-- To use any of the snippets below, copy and run the specific query block:

/*
-- 1. Reset all assets to 'in_stock' status:
UPDATE public.assets 
SET status = 'in_stock', assigned_to = NULL, assigned_date = NULL;

-- 2. Clear all borrowing records:
DELETE FROM public.asset_borrowing;

-- 3. Clear all assignment records:
DELETE FROM public.asset_assignments;

-- 4. Clear all repair records:
DELETE FROM public.asset_repairs;

-- 5. Complete Wipe (CAUTION: Removes all inventory tables and data):
DROP TABLE IF EXISTS public.asset_repairs CASCADE;
DROP TABLE IF EXISTS public.asset_borrowing CASCADE;
DROP TABLE IF EXISTS public.asset_assignments CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
*/
