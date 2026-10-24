create table public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index watchlist_items_user_id_idx on public.watchlist_items (user_id);

alter table public.watchlist_items enable row level security;

-- Signed-in users can only see, add and remove their own rows.
create policy "watchlist: select own" on public.watchlist_items
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "watchlist: insert own" on public.watchlist_items
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "watchlist: delete own" on public.watchlist_items
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Defense in depth: signed-out (anon) requests get no table access at all.
revoke all on public.watchlist_items from anon;
grant select, insert, delete on public.watchlist_items to authenticated;
