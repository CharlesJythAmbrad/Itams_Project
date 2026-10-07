-- ============================================================
-- Add borrow_request fields to asset_requests table
-- Supports the new BorrowRequestPage functionality
-- ============================================================

-- Update request_type constraint to include 'borrow_request'
alter table public.asset_requests 
drop constraint if exists asset_requests_request_type_check;

alter table public.asset_requests
add constraint asset_requests_request_type_check 
check (request_type in ('asset_request', 'borrow_request', 'repair', 'replacement', 'pullout'));

-- Add new fields for borrow requests
alter table public.asset_requests
add column if not exists department text,
add column if not exists asset_type text,
add column if not exists preferred_brand text,
add column if not exists quantity integer,
add column if not exists purpose text,
add column if not exists usage_location text,
add column if not exists borrowing_date date,
add column if not exists return_date date,
add column if not exists additional_instructions text,
add column if not exists selected_assets jsonb default '[]'::jsonb;

-- Add indexes for the new fields
create index if not exists asset_requests_department_idx on public.asset_requests (department);
create index if not exists asset_requests_asset_type_idx on public.asset_requests (asset_type);
create index if not exists asset_requests_borrowing_date_idx on public.asset_requests (borrowing_date);
create index if not exists asset_requests_return_date_idx on public.asset_requests (return_date);

-- Add check constraint for borrow request fields (drop if exists first)
alter table public.asset_requests
drop constraint if exists borrow_request_fields_check;

alter table public.asset_requests
add constraint borrow_request_fields_check 
check (
  (request_type != 'borrow_request') or 
  (request_type = 'borrow_request' and 
   department is not null and 
   asset_type is not null and 
   quantity is not null and 
   quantity > 0 and 
   purpose is not null and 
   usage_location is not null and 
   borrowing_date is not null and 
   return_date is not null and 
   return_date > borrowing_date)
);

-- Update description field to be nullable for borrow requests
alter table public.asset_requests 
alter column description drop not null;

-- Update location field to be nullable for borrow requests (they use usage_location instead)
alter table public.asset_requests 
alter column location drop not null;

-- Comment on new fields
comment on column public.asset_requests.department is 'Department/Office for borrow requests';
comment on column public.asset_requests.asset_type is 'Type of asset needed for borrow requests';
comment on column public.asset_requests.preferred_brand is 'Optional preferred brand/model';
comment on column public.asset_requests.quantity is 'Number of assets requested';
comment on column public.asset_requests.purpose is 'Purpose/reason for borrowing';
comment on column public.asset_requests.usage_location is 'Location where asset will be used';
comment on column public.asset_requests.borrowing_date is 'Requested borrowing date';
comment on column public.asset_requests.return_date is 'Expected return date';
comment on column public.asset_requests.additional_instructions is 'Optional additional instructions';
comment on column public.asset_requests.selected_assets is 'JSON array of selected asset IDs for IT specialists';