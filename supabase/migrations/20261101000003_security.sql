-- =====================================================================
-- دفء — Row Level Security, Storage and Realtime
-- Principle: the browser (anon key) can only read public content.
-- Donor submissions go through a validated server endpoint using the
-- service role. Staff access is limited by role and by assignment.
-- =====================================================================

alter table public.roles                    enable row level security;
alter table public.profiles                 enable row level security;
alter table public.donations                enable row level security;
alter table public.donation_items           enable row level security;
alter table public.donation_images          enable row level security;
alter table public.donation_status_history  enable row level security;
alter table public.donation_notes           enable row level security;
alter table public.collection_appointments  enable row level security;
alter table public.volunteer_assignments    enable row level security;
alter table public.notifications            enable row level security;
alter table public.motivational_quotes      enable row level security;
alter table public.site_settings            enable row level security;
alter table public.audit_logs               enable row level security;
alter table public.rate_limits              enable row level security;
alter table public.tracking_otps            enable row level security;

-- Defense in depth: anonymous visitors get no table privileges on private data at all.
revoke all on public.profiles, public.donations, public.donation_items, public.donation_images,
  public.donation_status_history, public.donation_notes, public.collection_appointments,
  public.volunteer_assignments, public.notifications, public.audit_logs, public.rate_limits,
  public.tracking_otps
from anon;
-- Server-only tables: no client access for signed-in users either.
revoke all on public.rate_limits, public.tracking_otps from authenticated;
-- Writes to workflow tables happen only through SECURITY DEFINER functions.
revoke insert, update, delete on public.donations, public.donation_items, public.donation_images,
  public.donation_status_history, public.donation_notes, public.collection_appointments,
  public.volunteer_assignments, public.notifications, public.audit_logs, public.profiles, public.roles
from authenticated;
revoke all on sequence public.donation_ref_seq from anon, authenticated;

-- ---------- roles ----------
create policy "roles readable by staff" on public.roles
  for select to authenticated using (public.is_staff());

-- ---------- profiles ----------
create policy "profiles: own row" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles: staff can see team" on public.profiles
  for select to authenticated using (public.is_staff());

-- ---------- donations & children ----------
create policy "donations: admins or assigned volunteer" on public.donations
  for select to authenticated using (public.can_access_donation(id));

create policy "donation_items: via donation" on public.donation_items
  for select to authenticated using (public.can_access_donation(donation_id));

create policy "donation_images: via donation" on public.donation_images
  for select to authenticated using (public.can_access_donation(donation_id));

create policy "status_history: via donation" on public.donation_status_history
  for select to authenticated using (public.can_access_donation(donation_id));

create policy "donation_notes: admins only" on public.donation_notes
  for select to authenticated using (public.is_admin());

create policy "appointments: admins or own" on public.collection_appointments
  for select to authenticated using (public.is_admin() or (public.is_staff() and volunteer_id = auth.uid()));

create policy "assignments: admins or own" on public.volunteer_assignments
  for select to authenticated using (public.is_admin() or (public.is_staff() and volunteer_id = auth.uid()));

-- ---------- notifications ----------
create policy "notifications: own" on public.notifications
  for select to authenticated using (recipient_id = auth.uid() and public.is_staff());

-- ---------- motivational quotes ----------
create policy "quotes: public reads active" on public.motivational_quotes
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "quotes: admins insert" on public.motivational_quotes
  for insert to authenticated with check (public.is_admin());
create policy "quotes: admins update" on public.motivational_quotes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "quotes: admins delete" on public.motivational_quotes
  for delete to authenticated using (public.is_admin());

-- ---------- site settings ----------
create policy "settings: public reads public keys" on public.site_settings
  for select to anon, authenticated using (is_public or public.is_admin());
create policy "settings: super admin insert" on public.site_settings
  for insert to authenticated with check (public.is_super_admin());
create policy "settings: super admin update" on public.site_settings
  for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- audit logs ----------
create policy "audit: super admins read" on public.audit_logs
  for select to authenticated using (public.is_super_admin());
create policy "audit: admins read donation activity" on public.audit_logs
  for select to authenticated using (public.is_admin() and entity = 'donation');

-- rate_limits, tracking_otps: RLS enabled with no policies => service role only.

-- =====================================================================
-- Storage: private bucket for donation photos.
-- Objects are stored as "<donation_id>/<random>.<ext>" and uploaded by the
-- server with the service role. Staff read them through short-lived signed URLs.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('donation-images', 'donation-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.can_access_donation_object(p_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare v_folder text := split_part(p_name, '/', 1);
begin
  if v_folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.can_access_donation(v_folder::uuid);
end $$;
revoke execute on function public.can_access_donation_object(text) from public, anon;
grant execute on function public.can_access_donation_object(text) to authenticated;

create policy "donation images: staff with access can read"
  on storage.objects for select to authenticated
  using (bucket_id = 'donation-images' and public.can_access_donation_object(name));
-- No insert/update/delete policies: only the service role writes to this bucket.

-- =====================================================================
-- Realtime: staff receive their own notifications live (RLS applies).
-- =====================================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
