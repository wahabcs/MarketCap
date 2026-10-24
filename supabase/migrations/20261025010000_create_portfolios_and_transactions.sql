create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index portfolios_user_id_idx on public.portfolios (user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  portfolio_id uuid not null,
  symbol text not null check (symbol ~ '^[A-Z0-9.\-]{1,12}$'),
  type text not null check (type in ('buy', 'sell', 'dividend')),
  shares numeric(18, 6) not null check (shares > 0),
  price numeric(18, 6) not null check (price >= 0),  -- per share (dividend: amount per share)
  fees numeric(18, 6) not null default 0 check (fees >= 0),
  executed_at date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  -- A transaction can only point at a portfolio owned by the same user.
  foreign key (portfolio_id, user_id) references public.portfolios (id, user_id) on delete cascade
);
create index transactions_user_id_idx on public.transactions (user_id);
create index transactions_portfolio_id_idx on public.transactions (portfolio_id);

alter table public.portfolios enable row level security;
alter table public.transactions enable row level security;

create policy "portfolios: select own" on public.portfolios for select to authenticated using (user_id = (select auth.uid()));
create policy "portfolios: insert own" on public.portfolios for insert to authenticated with check (user_id = (select auth.uid()));
create policy "portfolios: update own" on public.portfolios for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "portfolios: delete own" on public.portfolios for delete to authenticated using (user_id = (select auth.uid()));

create policy "transactions: select own" on public.transactions for select to authenticated using (user_id = (select auth.uid()));
create policy "transactions: insert own" on public.transactions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "transactions: update own" on public.transactions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "transactions: delete own" on public.transactions for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.portfolios, public.transactions from anon;
grant select, insert, update, delete on public.portfolios, public.transactions to authenticated;
