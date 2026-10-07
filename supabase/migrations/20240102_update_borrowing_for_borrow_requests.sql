-- Update asset_borrowing table to support borrow request integration
-- Links borrowing records to original borrow requests

-- Add foreign key to link borrowing records to borrow requests
alter table public.asset_borrowing
add column if not exists borrow_request_id uuid references public.asset_requests(id);

-- Add fields to match borrow request form structure
alter table public.asset_borrowing
add column if not exists usage_location text,
add column if not exists borrowing_date date,
add column if not exists return_date date,
add column if not exists additional_instructions text;

-- Add indexes for better performance
create index if not exists asset_borrowing_request_id_idx on public.asset_borrowing (borrow_request_id);
create index if not exists asset_borrowing_borrowing_date_idx on public.asset_borrowing (borrowing_date);
create index if not exists asset_borrowing_return_date_idx on public.asset_borrowing (return_date);

-- Update the check constraint to allow new fields
alter table public.asset_borrowing
drop constraint if exists asset_borrowing_required_fields;

alter table public.asset_borrowing
add constraint asset_borrowing_required_fields 
check (
  borrower_name is not null and
  borrower_email is not null and
  borrower_department is not null and
  purpose is not null and
  (borrow_location is not null or usage_location is not null) and
  (expected_return_date is not null or return_date is not null)
);

-- Comment on new fields
comment on column public.asset_borrowing.borrow_request_id is 'Links to the original borrow request that generated this borrowing record';
comment on column public.asset_borrowing.usage_location is 'Location where the asset will be used (from borrow request)';
comment on column public.asset_borrowing.borrowing_date is 'Actual borrowing start date';
comment on column public.asset_borrowing.return_date is 'Expected return date (from borrow request)';
comment on column public.asset_borrowing.additional_instructions is 'Additional instructions from the borrow request';