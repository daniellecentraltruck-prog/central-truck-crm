-- Executar no SQL Editor do Supabase do CRM Central Truck.
create table if not exists public.ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero_os text not null,
  empresa_id uuid not null references public.empresas(id),
  servicos text default '',
  pecas text default '',
  valor numeric(12,2) not null default 0,
  forma_pagamento text default '',
  criado_em timestamptz not null default now()
);
create index if not exists ordens_servico_empresa_idx on public.ordens_servico(empresa_id);
create unique index if not exists ordens_servico_numero_idx on public.ordens_servico(numero_os);
alter table public.ordens_servico enable row level security;
create policy "OS leitura usuarios autenticados" on public.ordens_servico for select to authenticated using (true);
create policy "OS cadastro usuarios autenticados" on public.ordens_servico for insert to authenticated with check (true);
create policy "OS edicao usuarios autenticados" on public.ordens_servico for update to authenticated using (true) with check (true);
