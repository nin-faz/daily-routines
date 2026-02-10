create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_push_subscriptions_user_id
  on push_subscriptions(user_id);

create unique index if not exists idx_push_subscriptions_user_endpoint
  on push_subscriptions(user_id, ((subscription->>'endpoint')));

alter table push_subscriptions enable row level security;

create policy "Users can manage their own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role can manage all subscriptions"
  on push_subscriptions for all
  to service_role
  using (true)
  with check (true);
