-- Run after inviting axooff7@gmail.com in Supabase Auth -> Users.
-- Binds the owner UUID in admin_config (kept strictly server-side, never in public frontend code).

insert into public.admin_config (id, owner_user_id)
select 1, id
from auth.users
where lower(email) = 'axooff7@gmail.com'
on conflict (id) do update
  set owner_user_id = excluded.owner_user_id,
      updated_at = now();
