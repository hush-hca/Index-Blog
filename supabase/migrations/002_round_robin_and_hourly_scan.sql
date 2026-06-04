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
