alter table public.producto_imagenes
  add column if not exists variante_id uuid null;

alter table public.producto_imagenes
  drop constraint if exists producto_imagenes_variante_id_fkey;

alter table public.producto_imagenes
  add constraint producto_imagenes_variante_id_fkey
  foreign key (variante_id)
  references public.producto_variantes(id)
  on delete set null;

create index if not exists producto_imagenes_variante_orden_idx
  on public.producto_imagenes (variante_id, orden)
  where variante_id is not null and activo = true;

create or replace function public.validar_imagen_variante_del_producto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.variante_id is not null and not exists (
    select 1
    from public.producto_variantes as variante
    where variante.id = new.variante_id
      and variante.producto_id = new.producto_id
  ) then
    raise exception 'La variante de la imagen no pertenece al producto';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_imagen_variante_del_producto
  on public.producto_imagenes;

create trigger validar_imagen_variante_del_producto
before insert or update of variante_id, producto_id
on public.producto_imagenes
for each row
execute function public.validar_imagen_variante_del_producto();

comment on column public.producto_imagenes.variante_id is
  'Variante de color a la que pertenece la imagen; permite varias imagenes por color';

grant select (variante_id) on table public.producto_imagenes to anon, authenticated;
