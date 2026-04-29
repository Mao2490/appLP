-- ============================================================
-- LP FITNESS - Sistema de Mantenimiento
-- Migración inicial de base de datos
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: perfiles (usuarios del sistema)
-- ============================================================
create table if not exists perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  nombre text not null,
  rol text not null check (rol in ('admin', 'dueno', 'tecnico')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger: crear perfil automático al registrar usuario
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.perfiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'rol', 'tecnico')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TABLA: maquinas
-- ============================================================
create table if not exists maquinas (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  marca text,
  modelo text,
  serial text,
  ubicacion text,
  fecha_adquisicion date,
  notas text,
  foto_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: novedades
-- ============================================================
create table if not exists novedades (
  id uuid default uuid_generate_v4() primary key,
  maquina_id uuid references maquinas(id) on delete cascade not null,
  descripcion text not null,
  tipo_falla text,
  estado text default 'Pendiente' check (estado in ('Pendiente', 'En proceso', 'Resuelto')),
  prioridad text default 'Normal' check (prioridad in ('Normal', 'Urgente', 'Crítico')),
  responsable_id uuid references perfiles(id) on delete set null,
  foto_url text,
  fecha date not null default current_date,
  hora time not null default current_time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABLA: proveedores
-- ============================================================
create table if not exists proveedores (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  direccion text,
  servicios text,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: compras
-- ============================================================
create table if not exists compras (
  id uuid default uuid_generate_v4() primary key,
  producto text not null,
  categoria text default 'Otros',
  cantidad numeric not null default 1,
  unidad text,
  valor_unitario numeric not null default 0,
  proveedor_id uuid references proveedores(id) on delete set null,
  notas text,
  fecha date not null default current_date,
  created_at timestamptz default now()
);

-- ============================================================
-- TABLA: tokens_tecnicos (acceso temporal QR)
-- ============================================================
create table if not exists tokens_tecnicos (
  id uuid default uuid_generate_v4() primary key,
  token uuid default uuid_generate_v4() unique not null,
  nombre_tecnico text not null,
  creado_por uuid references perfiles(id) on delete set null,
  usado boolean default false,
  expira_at timestamptz not null,
  created_at timestamptz default now()
);

-- ============================================================
-- STORAGE: bucket para fotos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table perfiles enable row level security;
alter table maquinas enable row level security;
alter table novedades enable row level security;
alter table proveedores enable row level security;
alter table compras enable row level security;
alter table tokens_tecnicos enable row level security;

-- Perfiles: cada quien ve el suyo, admin ve todos
create policy "perfiles_select" on perfiles for select using (true);
create policy "perfiles_update" on perfiles for update using (auth.uid() = id);

-- Máquinas: todos los autenticados leen, admin escribe
create policy "maquinas_select" on maquinas for select using (true);
create policy "maquinas_insert" on maquinas for insert with check (
  exists (select 1 from perfiles where id = auth.uid() and rol in ('admin', 'dueno'))
);
create policy "maquinas_update" on maquinas for update using (
  exists (select 1 from perfiles where id = auth.uid() and rol in ('admin', 'dueno'))
);

-- Novedades: todos leen, autenticados insertan
create policy "novedades_select" on novedades for select using (true);
create policy "novedades_insert" on novedades for insert with check (auth.uid() is not null);
create policy "novedades_update" on novedades for update using (auth.uid() is not null);

-- Proveedores y compras: solo admin/dueño
create policy "proveedores_select" on proveedores for select using (auth.uid() is not null);
create policy "proveedores_all" on proveedores for all using (
  exists (select 1 from perfiles where id = auth.uid() and rol in ('admin', 'dueno'))
);
create policy "compras_select" on compras for select using (auth.uid() is not null);
create policy "compras_insert" on compras for insert with check (
  exists (select 1 from perfiles where id = auth.uid() and rol in ('admin', 'dueno'))
);

-- Tokens: admin genera, todos pueden verificar
create policy "tokens_select" on tokens_tecnicos for select using (true);
create policy "tokens_insert" on tokens_tecnicos for insert with check (
  exists (select 1 from perfiles where id = auth.uid() and rol in ('admin', 'dueno'))
);
create policy "tokens_update" on tokens_tecnicos for update using (true);

-- Storage policies
create policy "fotos_upload" on storage.objects for insert with check (bucket_id = 'fotos');
create policy "fotos_select" on storage.objects for select using (bucket_id = 'fotos');