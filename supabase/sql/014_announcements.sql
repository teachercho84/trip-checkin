create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table announcements enable row level security;

create policy teacher_all_announcements on announcements for all using (is_teacher()) with check (is_teacher());
create policy public_read_announcements on announcements for select using (true);
