-- =====================================================================
-- دفء — Database security & workflow tests
-- Run against a disposable database that has the migrations applied:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/security.test.sql
-- Every check raises an exception on failure; the script ends with "ALL TESTS PASSED".
-- Everything runs inside a transaction that is rolled back at the end.
-- =====================================================================
begin;

-- ---------- Fixtures ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'super@test'),
  ('00000000-0000-0000-0000-00000000000b', 'admin@test'),
  ('00000000-0000-0000-0000-00000000000c', 'coord1@test'),
  ('00000000-0000-0000-0000-00000000000d', 'coord2@test'),
  ('00000000-0000-0000-0000-00000000000e', 'stranger@test');
insert into public.profiles (id, full_name, email, role) values
  ('00000000-0000-0000-0000-00000000000a', 'مشرف عام', 'super@test', 'super_admin'),
  ('00000000-0000-0000-0000-00000000000b', 'مشرف', 'admin@test', 'admin'),
  ('00000000-0000-0000-0000-00000000000c', 'منسق ١', 'coord1@test', 'coordinator'),
  ('00000000-0000-0000-0000-00000000000d', 'منسق ٢', 'coord2@test', 'coordinator');

create temp table t_ctx (k text primary key, v text);
grant all on t_ctx to anon, authenticated, service_role;

-- ---------- 1. Submission via service role + idempotency ----------
set local role service_role;
do $$
declare r record; r2 record;
begin
  select * into r from public.create_donation(jsonb_build_object(
    'idempotency_key', '11111111-1111-1111-1111-111111111111',
    'donor_name', 'أحمد', 'phone', '+96891234567', 'governorate', 'مسقط', 'wilayat', 'السيب',
    'address', 'قرب الجامع', 'quantity_option', 'two_bags', 'condition', 'good',
    'preferred_period', 'evening', 'categories', jsonb_build_array('men', 'children'),
    'images', jsonb_build_array(jsonb_build_object('path', 'p/1.jpg', 'mime_type', 'image/jpeg', 'size', 1000))));
  assert r.out_created, 'first submission should create';
  assert r.out_reference ~ '^DF-[0-9]{2}-[0-9]{5}$', 'reference format';
  select * into r2 from public.create_donation(jsonb_build_object(
    'idempotency_key', '11111111-1111-1111-1111-111111111111',
    'donor_name', 'أحمد', 'phone', '+96891234567', 'governorate', 'مسقط', 'wilayat', 'السيب',
    'address', 'x', 'quantity_option', 'two_bags', 'condition', 'good', 'categories', '["men"]'::jsonb));
  assert not r2.out_created and r2.out_id = r.out_id, 'duplicate submission must return the same donation';
  insert into t_ctx values ('d1', r.out_id::text);

  select * into r from public.create_donation(jsonb_build_object(
    'idempotency_key', '22222222-2222-2222-2222-222222222222',
    'donor_name', 'مريم', 'phone', '+96871234567', 'governorate', 'ظفار', 'wilayat', 'صلالة',
    'address', 'حي السعادة', 'quantity_option', 'other', 'quantity_other', '10 أكياس',
    'condition', 'excellent', 'categories', '["women"]'::jsonb));
  insert into t_ctx values ('d2', r.out_id::text);

  begin
    perform public.create_donation(jsonb_build_object(
      'idempotency_key', '33333333-3333-3333-3333-333333333333',
      'donor_name', 'x', 'phone', '+96812345678', 'governorate', 'مسقط', 'wilayat', 'مسقط',
      'address', 'x', 'quantity_option', 'one_bag', 'condition', 'good', 'categories', '["men"]'::jsonb));
    raise exception 'FAIL: invalid phone accepted';
  exception when check_violation then null;
  end;

  assert (select count(*) from public.notifications where type = 'new_donation') = 4,
    'two new donations should notify the two admins each';
  assert (select count(*) from public.donation_status_history) = 2, 'initial history rows';
end $$;
reset role;

-- ---------- 2. Anonymous visitors ----------
set local role anon;
do $$
begin
  begin
    perform 1 from public.donations;
    raise exception 'FAIL: anon can read donations';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.create_donation('{}'::jsonb);
    raise exception 'FAIL: anon can call create_donation';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.hit_rate_limit('x', 1, 60);
    raise exception 'FAIL: anon can call hit_rate_limit';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.tracking_otps;
    raise exception 'FAIL: anon can read OTPs';
  exception when insufficient_privilege then null;
  end;
  assert (select count(*) from public.motivational_quotes) >= 40, 'anon sees active quotes';
  assert (select count(*) from public.site_settings) >= 6, 'anon sees public settings';
  assert (public.public_impact_stats()->>'completed_donations')::int = 0, 'impact stats start at zero';
  assert (select count(*) from storage.objects) = 0, 'anon cannot see stored photos';
end $$;
reset role;

-- ---------- 3. Signed-in user without a staff profile ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
do $$
begin
  assert (select count(*) from public.donations) = 0, 'stranger must not see donations';
  assert (select count(*) from public.profiles) = 0, 'stranger must not see staff';
  begin
    perform public.admin_dashboard_stats();
    raise exception 'FAIL: stranger can read dashboard stats';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
  begin
    insert into public.donations (reference, idempotency_key, donor_name, phone, governorate, wilayat, address, quantity_option, condition, consent_at)
    values ('X', gen_random_uuid(), 'x', '+96891111111', 'a', 'b', 'c', 'one_bag', 'good', now());
    raise exception 'FAIL: direct insert allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.motivational_quotes (text) values ('اقتباس دخيل');
    raise exception 'FAIL: stranger inserted a quote';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- ---------- 4. Coordinator sees nothing until assigned ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$
begin
  assert (select count(*) from public.donations) = 0, 'unassigned coordinator sees no donations';
  begin
    perform public.assign_volunteer((select v::uuid from t_ctx where k = 'd1'), auth.uid());
    raise exception 'FAIL: coordinator can self-assign';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end $$;
reset role;

-- ---------- 5. Admin workflow ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
declare d1 uuid := (select v::uuid from t_ctx where k = 'd1');
        d2 uuid := (select v::uuid from t_ctx where k = 'd2');
        a uuid;
begin
  assert (select count(*) from public.donations) = 2, 'admin sees all donations';
  assert (public.admin_dashboard_stats()->>'new')::int = 2, 'dashboard counts new';
  assert jsonb_array_length(public.admin_dashboard_stats()->'monthly') = 12, 'monthly series has 12 months';

  perform public.change_donation_status(d1, 'reviewed', 'تمت مراجعة البيانات');
  perform public.add_donation_note(d1, 'ملاحظة داخلية سرية');

  a := public.schedule_collection(d1, now() + interval '1 day', 60, '00000000-0000-0000-0000-00000000000c', 'اتصل قبل الوصول');
  assert (select status from public.donations where id = d1) = 'scheduled', 'scheduling moves status';
  assert (select assigned_to from public.donations where id = d1) = '00000000-0000-0000-0000-00000000000c', 'assigned';
  insert into t_ctx values ('a1', a::text);

  -- Same volunteer, overlapping time on another donation => conflict.
  begin
    perform public.schedule_collection(d2, now() + interval '1 day' + interval '30 minutes', 60, '00000000-0000-0000-0000-00000000000c');
    raise exception 'FAIL: overlapping appointment accepted';
  exception when exclusion_violation then null;
  end;
  -- Non-overlapping is fine, with another volunteer.
  perform public.schedule_collection(d2, now() + interval '1 day' + interval '30 minutes', 60, '00000000-0000-0000-0000-00000000000d');

  -- Rescheduling replaces the active appointment.
  a := public.schedule_collection(d1, now() + interval '2 days', 45, null, null);
  assert (select count(*) from public.collection_appointments where donation_id = d1 and status = 'scheduled') = 1, 'one active appointment';
  assert (select volunteer_id from public.collection_appointments where id = a) = '00000000-0000-0000-0000-00000000000c', 'keeps volunteer';

  begin
    perform public.set_staff_role('00000000-0000-0000-0000-00000000000c', 'admin');
    raise exception 'FAIL: admin changed roles';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
  begin
    update public.site_settings set value = '{}' where key = 'team';
    if found then raise exception 'FAIL: admin edited settings'; end if;
  end;
end $$;
reset role;

-- ---------- 6. Coordinator limits ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$
declare d1 uuid := (select v::uuid from t_ctx where k = 'd1');
begin
  assert (select count(*) from public.donations) = 1, 'coordinator sees only assigned donation';
  assert (select count(*) from public.donation_notes) = 0, 'coordinator cannot read internal notes';
  assert (select count(*) from public.donation_images) = 1, 'coordinator sees images of assigned donation';
  assert (select count(*) from public.collection_appointments where status = 'scheduled') = 1
    and not exists (select 1 from public.collection_appointments where volunteer_id is distinct from auth.uid()), 'coordinator sees own appointments only';
  begin
    perform public.change_donation_status(d1, 'completed');
    raise exception 'FAIL: coordinator completed a donation';
  exception when raise_exception then
    if sqlerrm <> 'invalid_transition' then raise; end if;
  end;
  begin
    perform public.change_donation_status(d1, 'received');
    raise exception 'FAIL: received without bag count';
  exception when raise_exception then
    if sqlerrm <> 'received_bags_required' then raise; end if;
  end;
  perform public.change_donation_status(d1, 'received', null, 3, 25);
  perform public.update_collection_notes((select id from public.collection_appointments where donation_id = d1 order by created_at desc limit 1), 'تم');
  begin
    perform public.add_donation_note(d1, 'x');
    raise exception 'FAIL: coordinator added internal note';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
do $$
begin
  assert (select count(*) from public.donations) = 1, 'coord2 sees only their own assigned donation';
  begin
    perform public.change_donation_status((select v::uuid from t_ctx where k = 'd1'), 'awaiting_pickup');
    raise exception 'FAIL: coord2 changed a donation assigned to someone else';
  exception when raise_exception then
    if sqlerrm not in ('forbidden', 'same_status') then raise; end if;
  end;
end $$;
reset role;

-- ---------- 7. Notifications & completion ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$
declare d1 uuid := (select v::uuid from t_ctx where k = 'd1');
begin
  assert exists (select 1 from public.notifications where type = 'collection_completed'), 'admin notified of completed collection';
  assert not exists (select 1 from public.notifications where recipient_id <> auth.uid()), 'only own notifications are visible';
  perform public.mark_notifications_read(null);
  assert not exists (select 1 from public.notifications where read_at is null), 'all marked read';
  perform public.change_donation_status(d1, 'completed');
  assert (select count(*) from public.donation_status_history where donation_id = d1) = 5, 'every change is recorded';
  assert (select count(*) from public.audit_logs) > 0, 'admin can read donation audit trail';
end $$;
reset role;

set local role anon;
do $$
declare s jsonb := public.public_impact_stats();
begin
  assert (s->>'completed_donations')::int = 1, 'one completed donation';
  assert (s->>'received_bags')::int = 3, 'bags counted';
  assert (s->>'received_pieces')::int = 25, 'pieces counted';
end $$;
reset role;

-- ---------- 8. Storage access ----------
insert into storage.objects (bucket_id, name) values
  ('donation-images', (select v from t_ctx where k = 'd1') || '/a.jpg'),
  ('donation-images', (select v from t_ctx where k = 'd2') || '/b.jpg'),
  ('donation-images', 'not-a-uuid/c.jpg');

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  assert (select count(*) from storage.objects) = 1, 'coordinator reads photos of assigned donation only';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
do $$ begin
  assert (select count(*) from storage.objects) = 0, 'stranger reads no photos';
end $$;
reset role;

-- ---------- 9. Retention / anonymization ----------
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  begin
    perform public.anonymize_donation((select v::uuid from t_ctx where k = 'd1'));
    raise exception 'FAIL: admin anonymized';
  exception when raise_exception then
    if sqlerrm <> 'forbidden' then raise; end if;
  end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
do $$
declare d1 uuid := (select v::uuid from t_ctx where k = 'd1');
        paths text[];
begin
  begin
    perform public.anonymize_donation((select v::uuid from t_ctx where k = 'd2'));
    raise exception 'FAIL: open donation anonymized';
  exception when raise_exception then
    if sqlerrm <> 'not_closed' then raise; end if;
  end;
  paths := public.anonymize_donation(d1);
  assert paths = array['p/1.jpg'], 'returns image paths for deletion';
  assert (select donor_name is null and phone is null and anonymized_at is not null from public.donations where id = d1), 'PII removed';
  assert (public.public_impact_stats()->>'received_bags')::int = 3, 'statistics survive anonymization';
  perform public.set_staff_active('00000000-0000-0000-0000-00000000000d', false);
  assert (select assigned_to is null from public.donations where id = (select v::uuid from t_ctx where k = 'd2')), 'deactivation releases work';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
do $$ begin
  assert (select count(*) from public.donations) = 0, 'deactivated user sees nothing';
  assert not public.is_staff(), 'deactivated user is not staff';
end $$;
reset role;

-- ---------- 10. Rate limiting ----------
set local role service_role;
do $$ begin
  assert public.hit_rate_limit('t', 2, 60) and public.hit_rate_limit('t', 2, 60), 'within limit';
  assert not public.hit_rate_limit('t', 2, 60), 'third hit blocked';
end $$;
reset role;

select 'ALL TESTS PASSED' as result;
rollback;
