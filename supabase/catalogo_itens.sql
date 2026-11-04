-- Executar uma unica vez no SQL Editor do Supabase.
create table if not exists public.catalogo_itens (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('Produto','Serviço')),
  nome text not null,
  preco numeric(12,2) not null default 0,
  quantidade_caixa integer not null default 10,
  quantidade_estoque integer not null default 0,
  fornecedor text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists catalogo_itens_nome_idx on public.catalogo_itens(nome);
alter table public.catalogo_itens enable row level security;
drop policy if exists "catalogo_select" on public.catalogo_itens;
create policy "catalogo_select" on public.catalogo_itens for select to authenticated using (true);
drop policy if exists "catalogo_insert" on public.catalogo_itens;
create policy "catalogo_insert" on public.catalogo_itens for insert to authenticated with check (true);
drop policy if exists "catalogo_update" on public.catalogo_itens;
create policy "catalogo_update" on public.catalogo_itens for update to authenticated using (true) with check (true);
