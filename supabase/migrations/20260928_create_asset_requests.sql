-- ============================================================
-- asset_requests table
-- Stores requests submitted via QR code form by faculty/staff
-- ============================================================

create table if not exists public.asset_requests (
  id              uuid primary key default gen_random_uuid(),

  -- Request classification
  request_type    text not null check (request_type in ('asset_request', 'repair', 'replacement', 'pullout')),
  status          text not null default 'pending'
                  check (status in ('pending', 'approved', 'in_progress', 'completed', 'rejected')),

  -- Requester information
  full_name       text not null,
  email           text not null,
  contact_number  text,

  -- Request details
  location        text not null,
  preferred_date  date,
  asset_details   text,
  description     text not null,

  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Enable RLS
alter table public.asset_requests enable row level security;

-- Allow anyone (public / scanned QR) to INSERT a request
create policy "Public can submit requests"
  on public.asset_requests
  for insert
  to anon, authenticated
  with check (true);

-- Only authenticated users (inventory staff / itsd) can view and update
create policy "Authenticated users can view requests"
  on public.asset_requests
  for select
  to authenticated
  using (true);

create policy "Authenticated users can update requests"
  on public.asset_requests
  for update
  to authenticated
  using (true)
  with check (true);

-- Auto-update updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists asset_requests_updated_at on public.asset_requests;
create trigger asset_requests_updated_at
  before update on public.asset_requests
  for each row execute function public.set_updated_at();

-- Index for common queries
create index if not exists asset_requests_status_idx      on public.asset_requests (status);
create index if not exists asset_requests_request_type_idx on public.asset_requests (request_type);
create index if not exists asset_requests_created_at_idx  on public.asset_requests (created_at desc);
