-- 고2 수학여행 체크인 사이트 — 스키마
-- Supabase SQL 에디터에서 001 -> 002 -> 003 순서로 실행하세요.

create extension if not exists pgcrypto;

-- 테이블 생성 순서 주의: groups가 auth_accounts보다 먼저 만들어져야 하고,
-- auth_accounts는 groups를 참조하므로 groups.auth_account_id의 FK는 나중에 ALTER로 붙인다.

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,              -- 모둠명, Excel 조인 키
  access_code text not null unique,       -- 학생용 링크/QR 접속코드
  leader_name text not null,
  leader_student_id text not null,        -- 학번 = 모둠장 로그인 비밀번호
  leader_phone text not null,             -- 교사만 열람
  auth_account_id uuid,                   -- FK는 아래에서 ALTER로 추가
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table auth_accounts (
  id uuid primary key default gen_random_uuid(),
  internal_code text not null unique,     -- 예: 't001', 'g001'
  display_name text not null,             -- 로그인 폼 입력값 (교사 이름 / 모둠명)
  role text not null check (role in ('teacher', 'group_leader')),
  group_id uuid references groups(id) on delete cascade,  -- teacher는 null
  created_at timestamptz not null default now()
);

alter table groups
  add constraint groups_auth_account_fk foreign key (auth_account_id)
  references auth_accounts(id) on delete set null;

create table teachers (
  id uuid primary key default gen_random_uuid(),
  auth_account_id uuid not null references auth_accounts(id) on delete cascade,
  name text not null,
  phone text not null,        -- 로그인 비밀번호
  created_at timestamptz not null default now()
);

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null
);

create table timetable_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  seq int not null,
  time_planned time not null,
  place_name text not null,
  task text,
  lat double precision,
  lng double precision,
  geocode_status text not null default 'pending' check (geocode_status in ('pending', 'ok', 'failed')),
  created_at timestamptz not null default now(),
  unique (group_id, seq)
);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  timetable_item_id uuid not null references timetable_items(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  lat double precision not null,
  lng double precision not null,
  photo_path text,
  created_at timestamptz not null default now(),
  unique (timetable_item_id)   -- 항목당 체크인 1회
);

create table emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('homeroom_teacher', 'bus_driver')),
  label text not null,
  name text not null,
  phone text not null,
  sort_order int not null default 0
);

-- Storage 버킷: 체크인 사진
insert into storage.buckets (id, name, public)
values ('checkin-photos', 'checkin-photos', true)
on conflict (id) do nothing;
