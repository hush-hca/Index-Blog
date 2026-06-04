do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'scan-naver-blogs-hourly'
  ) then
    perform cron.unschedule('scan-naver-blogs-hourly');
  end if;
end;
$$;
