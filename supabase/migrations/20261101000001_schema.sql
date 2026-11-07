-- =====================================================================
-- دفء | منصة التبرع بالملابس — Schema
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------- Enums ----------
create type public.donation_status as enum (
  'new',              -- جديد
  'reviewed',         -- تمت المراجعة
  'contacting',       -- جاري التواصل
  'scheduled',        -- تم تحديد موعد الاستلام
  'awaiting_pickup',  -- في انتظار الاستلام
  'received',         -- تم الاستلام
  'completed',        -- مكتمل
  'cancelled'         -- ملغي
);

create type public.clothing_category as enum ('men', 'women', 'children', 'mixed');

create type public.quantity_option as enum ('one_bag', 'two_bags', 'three_bags', 'four_five_bags', 'more_than_five', 'other');

create type public.clothing_condition as enum ('excellent', 'good', 'needs_sorting');

create type public.collection_period as enum ('morning', 'evening', 'any');

create type public.appointment_status as enum ('scheduled', 'completed', 'cancelled');

-- ---------- Shared trigger: updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- Roles & profiles ----------
create table public.roles (
  key         text primary key check (key in ('super_admin', 'admin', 'coordinator')),
  label_ar    text not null,
  description text
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 120),
  email       text not null,
  phone       text,
  role        text not null references public.roles (key) default 'coordinator',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role) where is_active;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Donations ----------
create sequence public.donation_ref_seq start 1;

create table public.donations (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,
  idempotency_key   uuid not null unique,
  donor_name        text check (donor_name is null or char_length(donor_name) between 2 and 120),
  phone             text check (phone is null or phone ~ '^\+968[279][0-9]{7}$'),
  whatsapp          text check (whatsapp is null or whatsapp ~ '^\+968[79][0-9]{7}$'),
  governorate       text not null,
  wilayat           text not null,
  address           text check (address is null or char_length(address) <= 500),
  address_details   text check (address_details is null or char_length(address_details) <= 500),
  latitude          numeric(9, 6) check (latitude is null or latitude between -90 and 90),
  longitude         numeric(9, 6) check (longitude is null or longitude between -180 and 180),
  quantity_option   public.quantity_option not null,
  quantity_other    text check (quantity_other is null or char_length(quantity_other) <= 100),
  estimated_pieces  integer check (estimated_pieces is null or estimated_pieces between 1 and 10000),
  condition         public.clothing_condition not null,
  preferred_period  public.collection_period not null default 'any',
  preferred_date    date,
  notes             text check (notes is null or char_length(notes) <= 1000),
  consent_at        timestamptz not null,
  status            public.donation_status not null default 'new',
  assigned_to       uuid references public.profiles (id) on delete set null,
  received_bags     integer check (received_bags is null or received_bags between 0 and 1000),
  received_pieces   integer check (received_pieces is null or received_pieces between 0 and 100000),
  ip_hash           text,
  anonymized_at     timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Personal data is required until a retention job anonymizes the record.
  constraint donations_pii_present check (
    anonymized_at is not null or (donor_name is not null and phone is not null and address is not null)
  ),
  constraint donations_other_quantity check (
    quantity_option <> 'other' or anonymized_at is not null or char_length(coalesce(quantity_other, '')) > 0
  )
);
create index donations_status_idx      on public.donations (status);
create index donations_created_at_idx  on public.donations (created_at desc);
create index donations_governorate_idx on public.donations (governorate);
create index donations_assigned_idx    on public.donations (assigned_to);
create index donations_phone_idx       on public.donations (phone);
create trigger donations_updated_at before update on public.donations
  for each row execute function public.set_updated_at();

create table public.donation_items (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references public.donations (id) on delete cascade,
  category     public.clothing_category not null,
  unique (donation_id, category)
);
create index donation_items_donation_idx on public.donation_items (donation_id);

create table public.donation_images (
  id            uuid primary key default gen_random_uuid(),
  donation_id   uuid not null references public.donations (id) on delete cascade,
  storage_path  text not null unique,
  mime_type     text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes    integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  created_at    timestamptz not null default now()
);
create index donation_images_donation_idx on public.donation_images (donation_id);

create table public.donation_status_history (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references public.donations (id) on delete cascade,
  from_status  public.donation_status,
  to_status    public.donation_status not null,
  changed_by   uuid references public.profiles (id) on delete set null,
  note         text check (note is null or char_length(note) <= 1000),
  created_at   timestamptz not null default now()
);
create index donation_status_history_donation_idx on public.donation_status_history (donation_id, created_at);

-- Internal notes: visible to admins only, never to donors or coordinators.
create table public.donation_notes (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references public.donations (id) on delete cascade,
  author_id    uuid references public.profiles (id) on delete set null,
  body         text not null check (char_length(body) between 1 and 2000),
  created_at   timestamptz not null default now()
);
create index donation_notes_donation_idx on public.donation_notes (donation_id, created_at);

-- ---------- Collection scheduling ----------
create table public.collection_appointments (
  id                uuid primary key default gen_random_uuid(),
  donation_id       uuid not null references public.donations (id) on delete cascade,
  volunteer_id      uuid references public.profiles (id) on delete set null,
  scheduled_at      timestamptz not null,
  duration_minutes  integer not null default 60 check (duration_minutes between 15 and 480),
  ends_at           timestamptz not null,
  status            public.appointment_status not null default 'scheduled',
  notes             text check (notes is null or char_length(notes) <= 1000),
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- A volunteer cannot have two overlapping active appointments.
  constraint collection_appointments_no_overlap exclude using gist (
    volunteer_id with =,
    tstzrange(scheduled_at, ends_at) with &&
  ) where (status = 'scheduled' and volunteer_id is not null)
);
create unique index collection_appointments_one_active
  on public.collection_appointments (donation_id) where status = 'scheduled';
create index collection_appointments_when_idx on public.collection_appointments (scheduled_at);
create index collection_appointments_volunteer_idx on public.collection_appointments (volunteer_id);

create or replace function public.set_appointment_end()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.ends_at := new.scheduled_at + make_interval(mins => new.duration_minutes);
  return new;
end $$;
create trigger collection_appointments_end before insert or update of scheduled_at, duration_minutes
  on public.collection_appointments for each row execute function public.set_appointment_end();
create trigger collection_appointments_updated_at before update on public.collection_appointments
  for each row execute function public.set_updated_at();

create table public.volunteer_assignments (
  id             uuid primary key default gen_random_uuid(),
  donation_id    uuid not null references public.donations (id) on delete cascade,
  volunteer_id   uuid not null references public.profiles (id) on delete cascade,
  assigned_by    uuid references public.profiles (id) on delete set null,
  assigned_at    timestamptz not null default now(),
  unassigned_at  timestamptz
);
create index volunteer_assignments_volunteer_idx on public.volunteer_assignments (volunteer_id) where unassigned_at is null;
create index volunteer_assignments_donation_idx on public.volunteer_assignments (donation_id);

-- ---------- Notifications ----------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  type          text not null check (type in ('new_donation', 'status_changed', 'appointment_updated', 'collection_completed', 'assignment')),
  title         text not null,
  body          text,
  donation_id   uuid references public.donations (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

-- ---------- Content ----------
create table public.motivational_quotes (
  id          uuid primary key default gen_random_uuid(),
  text        text not null unique check (char_length(text) between 3 and 300),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger motivational_quotes_updated_at before update on public.motivational_quotes
  for each row execute function public.set_updated_at();

create table public.site_settings (
  key         text primary key check (key ~ '^[a-z_]{2,40}$'),
  value       jsonb not null default '{}'::jsonb,
  is_public   boolean not null default true,
  updated_by  uuid references public.profiles (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------- Security & operations ----------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);

create table public.rate_limits (
  key           text not null,
  window_start  timestamptz not null,
  count         integer not null default 1,
  primary key (key, window_start)
);
create index rate_limits_window_idx on public.rate_limits (window_start);

-- One-time codes for donors checking their donation status (hashed, never stored in clear).
create table public.tracking_otps (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references public.donations (id) on delete cascade,
  code_hash    text not null,
  attempts     integer not null default 0,
  expires_at   timestamptz not null,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index tracking_otps_donation_idx on public.tracking_otps (donation_id, created_at desc);
