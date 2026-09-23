begin;

create table if not exists public.products (
  id text primary key,
  code text,
  name text not null,
  category text not null check (category in ('abarrotes', 'farmacia', 'restaurante')),
  price numeric(12, 2) not null check (price >= 0),
  icon text not null default '🛒',
  stock numeric(12, 3),
  department text,
  active boolean not null default true,
  image_url text,
  image_source_url text,
  image_attribution text,
  image_license text,
  image_license_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_active_idx on public.products (category, active);
create index if not exists products_code_idx on public.products (code);

create or replace function public.set_product_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_product_updated_at();

alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;

drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products
for select to anon, authenticated using (active = true);

-- Las modificaciones se hacen desde Dashboard o un script local autorizado.
-- No se concede escritura a visitantes ni a cualquier usuario autenticado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

commit;
