create or replace function public.crear_perfil_cliente_desde_auth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles_cliente (
    id,
    nombres,
    apellidos,
    cedula,
    celular,
    correo
  )
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'cedula',
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do update
  set nombres = excluded.nombres,
      apellidos = excluded.apellidos,
      cedula = excluded.cedula,
      celular = excluded.celular,
      correo = excluded.correo;

  return new;
end;
$$;

drop trigger if exists crear_perfil_cliente_al_registrarse on auth.users;

create trigger crear_perfil_cliente_al_registrarse
after insert on auth.users
for each row execute function public.crear_perfil_cliente_desde_auth();
