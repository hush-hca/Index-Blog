create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.claim_next_wordpress_site()
returns public.wordpress_sites
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_site public.wordpress_sites;
begin
  select *
  into selected_site
  from public.wordpress_sites
  where is_active = true
  order by last_used_at asc nulls first, id asc
  for update skip locked
  limit 1;

  if selected_site.id is null then
    raise exception 'No active WordPress sites available';
  end if;

  update public.wordpress_sites
  set last_used_at = now()
  where id = selected_site.id
  returning * into selected_site;

  return selected_site;
end;
$$;

revoke all on function public.claim_next_wordpress_site() from anon;
revoke all on function public.claim_next_wordpress_site() from authenticated;

-- Store these once in Supabase Vault before enabling the cron job:
-- select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'project_url');
-- select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY', 'publishable_key');

do $$
begin
  if not exists (
    select 1
    from cron.job
    where jobname = 'scan-naver-blogs-hourly'
  ) then
    perform cron.schedule(
      'scan-naver-blogs-hourly',
      '0 * * * *',
      $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/scan-naver-blogs',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
        ),
        body := jsonb_build_object('triggered_at', now())
      ) as request_id;
      $cron$
    );
  end if;
end;
$$;
