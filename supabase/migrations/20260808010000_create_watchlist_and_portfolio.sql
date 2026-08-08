-- Sprint 1.7: user-owned watchlist entries and current portfolio positions.
create table public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  display_name text null check (display_name is null or char_length(display_name) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watchlist_user_symbol_key unique (user_id, symbol)
);

create index watchlist_user_created_idx on public.watchlist (user_id, created_at desc);
alter table public.watchlist enable row level security;

create policy "Users can read their own watchlist" on public.watchlist for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own watchlist entries" on public.watchlist for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their own watchlist entries" on public.watchlist for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own watchlist entries" on public.watchlist for delete to authenticated
using ((select auth.uid()) = user_id);

create table public.portfolio_positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symbol text not null check (symbol = upper(btrim(symbol)) and symbol ~ '^[A-Z][A-Z0-9.-]{0,9}$'),
  quantity numeric(24, 8) not null check (quantity > 0),
  average_cost numeric(24, 8) not null check (average_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_positions_user_symbol_key unique (user_id, symbol)
);

create index portfolio_positions_user_created_idx on public.portfolio_positions (user_id, created_at desc);
alter table public.portfolio_positions enable row level security;

create policy "Users can read their own positions" on public.portfolio_positions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own positions" on public.portfolio_positions for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their own positions" on public.portfolio_positions for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own positions" on public.portfolio_positions for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_investment_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_watchlist_updated_at before update on public.watchlist
for each row execute function public.set_investment_updated_at();
create trigger set_portfolio_positions_updated_at before update on public.portfolio_positions
for each row execute function public.set_investment_updated_at();
