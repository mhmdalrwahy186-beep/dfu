-- =====================================================================
-- دفء — Functions (authorization helpers, workflows, statistics)
-- All privileged functions are SECURITY DEFINER with an empty search_path
-- and perform their own authorization checks.
-- Error messages are stable codes that the app maps to Arabic text.
-- =====================================================================

-- ---------- Authorization helpers ----------
create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.is_active
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role in ('admin', 'super_admin')
  )
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active and p.role = 'super_admin'
  )
$$;

create or replace function public.can_access_donation(p_donation uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (
    select 1 from public.donations d
    join public.profiles p on p.id = auth.uid() and p.is_active
    where d.id = p_donation and d.assigned_to = auth.uid()
  )
$$;

-- ---------- Internal helpers ----------
create or replace function public.log_audit(p_action text, p_entity text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (auth.uid(), p_action, p_entity, p_entity_id, coalesce(p_details, '{}'::jsonb))
$$;

create or replace function public.notify_admins(p_type text, p_title text, p_body text, p_donation uuid, p_except uuid default null)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (recipient_id, type, title, body, donation_id)
  select p.id, p_type, p_title, p_body, p_donation
  from public.profiles p
  where p.is_active and p.role in ('admin', 'super_admin')
    and (p_except is null or p.id <> p_except)
$$;

create or replace function public.notify_user(p_user uuid, p_type text, p_title text, p_body text, p_donation uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (recipient_id, type, title, body, donation_id)
  select p.id, p_type, p_title, p_body, p_donation
  from public.profiles p where p.id = p_user and p.is_active
$$;

create or replace function public.status_label(p public.donation_status)
returns text language sql immutable set search_path = '' as $$
  select case p
    when 'new' then 'جديد'
    when 'reviewed' then 'تمت المراجعة'
    when 'contacting' then 'جاري التواصل'
    when 'scheduled' then 'تم تحديد موعد الاستلام'
    when 'awaiting_pickup' then 'في انتظار الاستلام'
    when 'received' then 'تم الاستلام'
    when 'completed' then 'مكتمل'
    when 'cancelled' then 'ملغي'
  end
$$;

create or replace function public.next_donation_reference()
returns text language sql volatile security definer set search_path = '' as $$
  select 'DF-' || to_char(now() at time zone 'Asia/Muscat', 'YY') || '-' ||
         lpad(nextval('public.donation_ref_seq')::text, 5, '0')
$$;

-- ---------- Rate limiting (fixed window, server-side only) ----------
create or replace function public.hit_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.rate_limits as r (key, window_start, count)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set count = r.count + 1
  returning r.count into v_count;

  if random() < 0.02 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end $$;

-- ---------- Public donation submission (called only by the server with the service role) ----------
create or replace function public.create_donation(p jsonb)
returns table (out_id uuid, out_reference text, out_created boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := coalesce((p->>'id')::uuid, gen_random_uuid());
  v_key uuid := (p->>'idempotency_key')::uuid;
  v_ref text;
  v_cat text;
  v_img jsonb;
begin
  if v_key is null then
    raise exception 'idempotency_key_required';
  end if;

  select d.id, d.reference into out_id, out_reference from public.donations d where d.idempotency_key = v_key;
  if found then
    out_created := false;
    return next;
    return;
  end if;

  if jsonb_typeof(p->'categories') <> 'array' or jsonb_array_length(p->'categories') = 0 then
    raise exception 'categories_required';
  end if;

  begin
    v_ref := public.next_donation_reference();
    insert into public.donations (
      id, reference, idempotency_key, donor_name, phone, whatsapp, governorate, wilayat,
      address, address_details, latitude, longitude, quantity_option, quantity_other,
      estimated_pieces, condition, preferred_period, preferred_date, notes, consent_at, ip_hash
    ) values (
      v_id, v_ref, v_key, p->>'donor_name', p->>'phone', nullif(p->>'whatsapp', ''), p->>'governorate', p->>'wilayat',
      p->>'address', nullif(p->>'address_details', ''), (p->>'latitude')::numeric, (p->>'longitude')::numeric,
      (p->>'quantity_option')::public.quantity_option, nullif(p->>'quantity_other', ''),
      (p->>'estimated_pieces')::integer, (p->>'condition')::public.clothing_condition,
      coalesce((p->>'preferred_period')::public.collection_period, 'any'), (p->>'preferred_date')::date,
      nullif(p->>'notes', ''), now(), p->>'ip_hash'
    );
  exception when unique_violation then
    -- Concurrent duplicate submission with the same idempotency key.
    select d.id, d.reference into out_id, out_reference from public.donations d where d.idempotency_key = v_key;
    if found then
      out_created := false;
      return next;
      return;
    end if;
    raise;
  end;

  for v_cat in select distinct jsonb_array_elements_text(p->'categories') loop
    insert into public.donation_items (donation_id, category) values (v_id, v_cat::public.clothing_category);
  end loop;

  for v_img in select * from jsonb_array_elements(coalesce(p->'images', '[]'::jsonb)) loop
    insert into public.donation_images (donation_id, storage_path, mime_type, size_bytes)
    values (v_id, v_img->>'path', v_img->>'mime_type', (v_img->>'size')::integer);
  end loop;

  insert into public.donation_status_history (donation_id, from_status, to_status)
  values (v_id, null, 'new');

  perform public.notify_admins(
    'new_donation',
    'طلب تبرع جديد ' || v_ref,
    (p->>'donor_name') || ' — ' || (p->>'wilayat') || '، ' || (p->>'governorate'),
    v_id
  );

  out_id := v_id;
  out_reference := v_ref;
  out_created := true;
  return next;
end $$;

-- ---------- Status workflow ----------
create or replace function public.change_donation_status(
  p_donation uuid,
  p_status public.donation_status,
  p_note text default null,
  p_received_bags integer default null,
  p_received_pieces integer default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_role text := public.current_staff_role();
  v_d public.donations%rowtype;
begin
  if v_role is null then raise exception 'forbidden'; end if;

  select * into v_d from public.donations where id = p_donation for update;
  if not found then raise exception 'not_found'; end if;
  if v_d.anonymized_at is not null then raise exception 'anonymized'; end if;
  if v_d.status = p_status then raise exception 'same_status'; end if;

  if v_role = 'coordinator' then
    -- Coordinators may only progress collections assigned to them.
    if v_d.assigned_to is distinct from auth.uid() then raise exception 'forbidden'; end if;
    if not (
      (v_d.status = 'scheduled' and p_status in ('awaiting_pickup', 'received')) or
      (v_d.status = 'awaiting_pickup' and p_status = 'received')
    ) then
      raise exception 'invalid_transition';
    end if;
  end if;

  if p_status in ('received', 'completed') and v_d.received_bags is null and p_received_bags is null then
    raise exception 'received_bags_required';
  end if;
  if p_note is not null and char_length(p_note) > 1000 then raise exception 'note_too_long'; end if;

  update public.donations set
    status = p_status,
    received_bags = coalesce(p_received_bags, received_bags),
    received_pieces = coalesce(p_received_pieces, received_pieces)
  where id = p_donation;

  insert into public.donation_status_history (donation_id, from_status, to_status, changed_by, note)
  values (p_donation, v_d.status, p_status, auth.uid(), nullif(trim(p_note), ''));

  if p_status = 'cancelled' then
    update public.collection_appointments set status = 'cancelled'
    where donation_id = p_donation and status = 'scheduled';
  elsif p_status in ('received', 'completed') then
    update public.collection_appointments set status = 'completed'
    where donation_id = p_donation and status = 'scheduled';
  end if;

  perform public.log_audit('donation.status_changed', 'donation', p_donation::text,
    jsonb_build_object('from', v_d.status, 'to', p_status));

  if v_role = 'coordinator' and p_status = 'received' then
    perform public.notify_admins('collection_completed',
      'تم استلام التبرع ' || v_d.reference,
      'أكد المتطوع استلام التبرع.', p_donation, auth.uid());
  else
    perform public.notify_admins('status_changed',
      'تحديث حالة ' || v_d.reference,
      public.status_label(v_d.status) || ' ← ' || public.status_label(p_status), p_donation, auth.uid());
  end if;
end $$;

-- ---------- Volunteer assignment ----------
create or replace function public.assign_volunteer(p_donation uuid, p_volunteer uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_d public.donations%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select * into v_d from public.donations where id = p_donation for update;
  if not found then raise exception 'not_found'; end if;

  if p_volunteer is not null and not exists (
    select 1 from public.profiles where id = p_volunteer and is_active
  ) then
    raise exception 'volunteer_not_found';
  end if;

  if v_d.assigned_to is not distinct from p_volunteer then return; end if;

  update public.volunteer_assignments set unassigned_at = now()
  where donation_id = p_donation and unassigned_at is null;

  update public.donations set assigned_to = p_volunteer where id = p_donation;

  if p_volunteer is not null then
    insert into public.volunteer_assignments (donation_id, volunteer_id, assigned_by)
    values (p_donation, p_volunteer, auth.uid());
    perform public.notify_user(p_volunteer, 'assignment',
      'تم إسناد تبرع إليك ' || v_d.reference, v_d.wilayat || '، ' || v_d.governorate, p_donation);
  end if;

  -- Keep any active appointment aligned with the assigned volunteer.
  update public.collection_appointments set volunteer_id = p_volunteer
  where donation_id = p_donation and status = 'scheduled';

  perform public.log_audit('donation.assigned', 'donation', p_donation::text,
    jsonb_build_object('volunteer', p_volunteer));
end $$;

-- ---------- Collection scheduling ----------
create or replace function public.schedule_collection(
  p_donation uuid,
  p_scheduled_at timestamptz,
  p_duration_minutes integer default 60,
  p_volunteer uuid default null,
  p_notes text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_d public.donations%rowtype;
  v_id uuid;
  v_had_active boolean;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select * into v_d from public.donations where id = p_donation for update;
  if not found then raise exception 'not_found'; end if;
  if v_d.status in ('received', 'completed', 'cancelled') then raise exception 'invalid_transition'; end if;
  if p_scheduled_at < now() - interval '1 hour' then raise exception 'date_in_past'; end if;

  -- Replace any active appointment (rescheduling), then (re)assign the volunteer.
  update public.collection_appointments set status = 'cancelled'
  where donation_id = p_donation and status = 'scheduled'
  returning true into v_had_active;

  if p_volunteer is not null then
    perform public.assign_volunteer(p_donation, p_volunteer);
  end if;

  insert into public.collection_appointments (donation_id, volunteer_id, scheduled_at, duration_minutes, notes, created_by)
  values (p_donation, coalesce(p_volunteer, v_d.assigned_to), p_scheduled_at,
          coalesce(p_duration_minutes, 60), nullif(trim(p_notes), ''), auth.uid())
  returning id into v_id;

  if v_d.status in ('new', 'reviewed', 'contacting') then
    update public.donations set status = 'scheduled' where id = p_donation;
    insert into public.donation_status_history (donation_id, from_status, to_status, changed_by, note)
    values (p_donation, v_d.status, 'scheduled', auth.uid(), null);
  end if;

  perform public.log_audit(case when v_had_active then 'appointment.rescheduled' else 'appointment.created' end,
    'donation', p_donation::text, jsonb_build_object('appointment', v_id, 'at', p_scheduled_at));

  perform public.notify_admins('appointment_updated',
    'موعد استلام ' || v_d.reference,
    to_char(p_scheduled_at at time zone 'Asia/Muscat', 'YYYY-MM-DD HH24:MI'), p_donation, auth.uid());

  if coalesce(p_volunteer, v_d.assigned_to) is not null then
    perform public.notify_user(coalesce(p_volunteer, v_d.assigned_to), 'appointment_updated',
      'موعد استلام ' || v_d.reference,
      to_char(p_scheduled_at at time zone 'Asia/Muscat', 'YYYY-MM-DD HH24:MI'), p_donation);
  end if;

  return v_id;
end $$;

create or replace function public.cancel_collection(p_appointment uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_a public.collection_appointments%rowtype;
  v_d public.donations%rowtype;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select * into v_a from public.collection_appointments where id = p_appointment for update;
  if not found or v_a.status <> 'scheduled' then raise exception 'not_found'; end if;
  select * into v_d from public.donations where id = v_a.donation_id for update;

  update public.collection_appointments
    set status = 'cancelled',
        notes = concat_ws(E'\n', notes, nullif('سبب الإلغاء: ' || trim(p_reason), 'سبب الإلغاء: '))
  where id = p_appointment;

  if v_d.status in ('scheduled', 'awaiting_pickup') then
    update public.donations set status = 'contacting' where id = v_d.id;
    insert into public.donation_status_history (donation_id, from_status, to_status, changed_by, note)
    values (v_d.id, v_d.status, 'contacting', auth.uid(), 'تم إلغاء موعد الاستلام');
  end if;

  perform public.log_audit('appointment.cancelled', 'donation', v_d.id::text,
    jsonb_build_object('appointment', p_appointment, 'reason', p_reason));
  perform public.notify_admins('appointment_updated', 'إلغاء موعد ' || v_d.reference, p_reason, v_d.id, auth.uid());
  if v_a.volunteer_id is not null then
    perform public.notify_user(v_a.volunteer_id, 'appointment_updated', 'إلغاء موعد ' || v_d.reference, p_reason, v_d.id);
  end if;
end $$;

-- Volunteers can update notes on their own appointments (e.g. "the donor asked to call before arriving").
create or replace function public.update_collection_notes(p_appointment uuid, p_notes text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_a public.collection_appointments%rowtype;
begin
  select * into v_a from public.collection_appointments where id = p_appointment for update;
  if not found then raise exception 'not_found'; end if;
  if not (public.is_admin() or (public.is_staff() and v_a.volunteer_id = auth.uid())) then
    raise exception 'forbidden';
  end if;
  if char_length(coalesce(p_notes, '')) > 1000 then raise exception 'note_too_long'; end if;
  update public.collection_appointments set notes = nullif(trim(p_notes), '') where id = p_appointment;
  perform public.log_audit('appointment.notes_updated', 'donation', v_a.donation_id::text, '{}'::jsonb);
end $$;

-- ---------- Internal notes ----------
create or replace function public.add_donation_note(p_donation uuid, p_body text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if char_length(trim(coalesce(p_body, ''))) = 0 then raise exception 'note_required'; end if;
  insert into public.donation_notes (donation_id, author_id, body)
  values (p_donation, auth.uid(), trim(p_body)) returning id into v_id;
  perform public.log_audit('donation.note_added', 'donation', p_donation::text, '{}'::jsonb);
  return v_id;
end $$;

-- ---------- Notifications ----------
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
  where recipient_id = auth.uid() and read_at is null and (p_ids is null or id = any (p_ids))
$$;

-- ---------- Staff management (super admin) ----------
create or replace function public.set_staff_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then raise exception 'forbidden'; end if;
  if p_user = auth.uid() then raise exception 'cannot_change_self'; end if;
  update public.profiles set role = p_role where id = p_user;
  if not found then raise exception 'not_found'; end if;
  perform public.log_audit('staff.role_changed', 'profile', p_user::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.set_staff_active(p_user uuid, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then raise exception 'forbidden'; end if;
  if p_user = auth.uid() then raise exception 'cannot_change_self'; end if;
  update public.profiles set is_active = p_active where id = p_user;
  if not found then raise exception 'not_found'; end if;
  if not p_active then
    -- Release open work so nothing is stuck with a deactivated account.
    update public.volunteer_assignments set unassigned_at = now()
      where volunteer_id = p_user and unassigned_at is null;
    update public.donations set assigned_to = null
      where assigned_to = p_user and status not in ('completed', 'cancelled');
    update public.collection_appointments set volunteer_id = null
      where volunteer_id = p_user and status = 'scheduled';
  end if;
  perform public.log_audit(case when p_active then 'staff.activated' else 'staff.deactivated' end,
    'profile', p_user::text, '{}'::jsonb);
end $$;

-- ---------- Statistics ----------
create or replace function public.admin_dashboard_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;

  select jsonb_build_object(
    'total',        count(*),
    'new',          count(*) filter (where status = 'new'),
    'in_progress',  count(*) filter (where status in ('reviewed', 'contacting', 'scheduled', 'awaiting_pickup')),
    'received',     count(*) filter (where status = 'received'),
    'completed',    count(*) filter (where status = 'completed'),
    'cancelled',    count(*) filter (where status = 'cancelled'),
    'upcoming_appointments', (
      select count(*) from public.collection_appointments a
      where a.status = 'scheduled' and a.ends_at >= now()
    ),
    'by_status', coalesce((
      select jsonb_object_agg(s.status, s.c)
      from (select status, count(*) c from public.donations group by status) s
    ), '{}'::jsonb),
    'by_governorate', coalesce((
      select jsonb_object_agg(g.governorate, g.c)
      from (select governorate, count(*) c from public.donations group by governorate) g
    ), '{}'::jsonb),
    'monthly', (
      select jsonb_agg(jsonb_build_object('month', to_char(m, 'YYYY-MM'), 'count', coalesce(c.n, 0)) order by m)
      from generate_series(
        date_trunc('month', now() at time zone 'Asia/Muscat') - interval '11 months',
        date_trunc('month', now() at time zone 'Asia/Muscat'),
        interval '1 month'
      ) m
      left join (
        select date_trunc('month', created_at at time zone 'Asia/Muscat') mm, count(*) n
        from public.donations group by 1
      ) c on c.mm = m
    )
  ) into v
  from public.donations;
  return v;
end $$;

create or replace function public.coordinator_stats()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v jsonb;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select jsonb_build_object(
    'assigned_open', count(*) filter (where status not in ('completed', 'cancelled', 'received')),
    'awaiting',      count(*) filter (where status in ('scheduled', 'awaiting_pickup')),
    'received',      count(*) filter (where status in ('received', 'completed')),
    'upcoming_appointments', (
      select count(*) from public.collection_appointments a
      where a.volunteer_id = auth.uid() and a.status = 'scheduled' and a.ends_at >= now()
    )
  ) into v
  from public.donations where assigned_to = auth.uid();
  return v;
end $$;

-- Aggregate, anonymous figures for the public "أثر دفء بالأرقام" section.
create or replace function public.public_impact_stats()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'completed_donations', count(*) filter (where status = 'completed'),
    'received_bags',       coalesce(sum(received_bags) filter (where status in ('received', 'completed')), 0),
    'received_pieces',     coalesce(sum(received_pieces) filter (where status in ('received', 'completed')), 0),
    'pieces_recorded',     count(*) filter (where status in ('received', 'completed') and received_pieces is not null),
    'received_donations',  count(*) filter (where status in ('received', 'completed'))
  )
  from public.donations
$$;

-- ---------- Data retention ----------
-- Removes personal data from a closed donation while keeping anonymous figures for statistics.
-- Returns storage paths of images so the server can delete the files from Storage.
create or replace function public.anonymize_donation(p_donation uuid)
returns text[] language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
  v_status public.donation_status;
begin
  -- auth.uid() is null when called by the service role (scheduled retention job).
  if auth.uid() is not null and not public.is_super_admin() then raise exception 'forbidden'; end if;

  select status into v_status from public.donations where id = p_donation for update;
  if not found then raise exception 'not_found'; end if;
  if v_status not in ('completed', 'cancelled') then raise exception 'not_closed'; end if;

  select coalesce(array_agg(storage_path), '{}') into v_paths from public.donation_images where donation_id = p_donation;
  delete from public.donation_images where donation_id = p_donation;
  delete from public.donation_notes where donation_id = p_donation;
  delete from public.tracking_otps where donation_id = p_donation;
  update public.donation_status_history set note = null where donation_id = p_donation;
  update public.collection_appointments set notes = null where donation_id = p_donation;

  update public.donations set
    donor_name = null, phone = null, whatsapp = null, address = null, address_details = null,
    latitude = null, longitude = null, notes = null, quantity_other = null, ip_hash = null,
    anonymized_at = now()
  where id = p_donation;

  perform public.log_audit('donation.anonymized', 'donation', p_donation::text, '{}'::jsonb);
  return v_paths;
end $$;

-- Lists closed donations whose personal data is due for removal.
create or replace function public.donations_due_for_anonymization(p_days integer default 365)
returns setof uuid language sql stable security definer set search_path = '' as $$
  select id from public.donations
  where anonymized_at is null
    and status in ('completed', 'cancelled')
    and updated_at < now() - make_interval(days => greatest(p_days, 30))
$$;

-- ---------- Execute privileges ----------
-- Supabase grants EXECUTE on new functions to anon/authenticated by default; lock everything down first.
revoke execute on all functions in schema public from public, anon, authenticated;

-- Helpers used inside RLS policies. They only answer questions about the caller
-- (always false for anonymous visitors), so anon may evaluate them inside policies.
grant execute on function public.current_staff_role(), public.is_staff(), public.is_admin(),
  public.is_super_admin(), public.can_access_donation(uuid) to anon, authenticated;

-- Staff workflows (each function checks the caller's role itself).
grant execute on function
  public.change_donation_status(uuid, public.donation_status, text, integer, integer),
  public.assign_volunteer(uuid, uuid),
  public.schedule_collection(uuid, timestamptz, integer, uuid, text),
  public.cancel_collection(uuid, text),
  public.update_collection_notes(uuid, text),
  public.add_donation_note(uuid, text),
  public.mark_notifications_read(uuid[]),
  public.set_staff_role(uuid, text),
  public.set_staff_active(uuid, boolean),
  public.admin_dashboard_stats(),
  public.coordinator_stats(),
  public.anonymize_donation(uuid)
to authenticated;

-- Public aggregate figures only.
grant execute on function public.public_impact_stats() to anon, authenticated;

-- Server-only (service role): create_donation, hit_rate_limit, next_donation_reference,
-- donations_due_for_anonymization, notify_*, log_audit.
grant execute on function
  public.create_donation(jsonb),
  public.hit_rate_limit(text, integer, integer),
  public.donations_due_for_anonymization(integer),
  public.anonymize_donation(uuid),
  public.public_impact_stats()
to service_role;
