-- Reinicio operativo de Pesca con Fe
--
-- ESTE ARCHIVO NO ES UNA MIGRACION Y NO DEBE EJECUTARSE SIN APROBACION.
-- Conserva el catalogo estructural estable y las cuentas administrativas.
-- Elimina marcas administradas, inventario, operaciones comerciales y usuarios
-- que no sean administradores. Los ocho logos del inicio viven en frontend.
--
-- Orden de ejecucion aprobado:
--   1. Activar mantenimiento y confirmar una copia de seguridad.
--   2. Ejecutar por separado las consultas de DIAGNOSTICO de este archivo.
--   3. Revisar los conteos.
--   4. Descomentar el set_config del BLOQUE DE REINICIO y ejecutar el bloque.
--
-- Los JWT emitidos a usuarios eliminados pueden seguir siendo validos hasta
-- expirar. Mantener el sitio en mantenimiento durante el TTL configurado.

-- ---------------------------------------------------------------------------
-- DIAGNOSTICO: solo lectura. Ejecutar y revisar antes del bloque destructivo.
-- ---------------------------------------------------------------------------

select *
from (
  select 'CONSERVAR'::text as accion, 'public.categorias'::text as objeto, count(*)::bigint as filas from public.categorias
  union all select 'CONSERVAR', 'public.subcategorias', count(*) from public.subcategorias
  union all select 'CONSERVAR', 'public.catalogo_nodos', count(*) from public.catalogo_nodos
  union all select 'CONSERVAR', 'public.catalogo_atributos', count(*) from public.catalogo_atributos
  union all select 'CONSERVAR', 'public.perfiles_admin', count(*) from public.perfiles_admin
  union all select 'ELIMINAR', 'public.productos', count(*) from public.productos
  union all select 'ELIMINAR', 'public.marcas', count(*) from public.marcas
  union all select 'ELIMINAR', 'public.producto_imagenes', count(*) from public.producto_imagenes
  union all select 'ELIMINAR', 'public.producto_variantes', count(*) from public.producto_variantes
  union all select 'ELIMINAR', 'public.producto_atributos', count(*) from public.producto_atributos
  union all select 'ELIMINAR', 'public.pedidos', count(*) from public.pedidos
  union all select 'ELIMINAR', 'public.pedido_items', count(*) from public.pedido_items
  union all select 'ELIMINAR', 'public.ventas_fisicas', count(*) from public.ventas_fisicas
  union all select 'ELIMINAR', 'public.venta_fisica_items', count(*) from public.venta_fisica_items
  union all select 'ELIMINAR', 'public.direcciones_cliente', count(*) from public.direcciones_cliente
  union all select 'ELIMINAR', 'private.intentos_pago', count(*) from private.intentos_pago
  union all select 'ELIMINAR', 'private.reservas_stock', count(*) from private.reservas_stock
  union all select 'ELIMINAR', 'private.auditoria_seguridad', count(*) from private.auditoria_seguridad
  union all select 'ELIMINAR', 'private.limites_frecuencia', count(*) from private.limites_frecuencia
) as diagnostico
order by accion desc, objeto;

select
  count(*) filter (where pa.id is not null)::bigint as usuarios_admin_conservados,
  count(*) filter (where pa.id is null)::bigint as usuarios_no_admin_eliminados,
  count(*)::bigint as usuarios_auth_totales
from auth.users as u
left join public.perfiles_admin as pa on pa.id = u.id;

select rol, activo, count(*)::bigint as cantidad
from public.perfiles_admin
group by rol, activo
order by rol, activo;

select
  (select count(*) from storage.objects)::bigint as objetos_supabase_storage,
  (select count(*) from storage.buckets)::bigint as buckets_supabase_storage;

-- ---------------------------------------------------------------------------
-- BLOQUE DE REINICIO: bloqueado por defecto.
-- Ejecutar completo y solamente despues del visto bueno y la copia de seguridad.
-- ---------------------------------------------------------------------------

begin;

set local lock_timeout = '5s';
set local statement_timeout = '60s';

-- DESCOMENTAR SOLO AL MOMENTO DE EJECUTAR EL REINICIO APROBADO:
-- select set_config(
--   'app.pesca_con_fe_reset_confirmation',
--   'REINICIAR_BASE_PESCA_CON_FE',
--   true
-- );

do $proteccion$
begin
  if current_setting('app.pesca_con_fe_reset_confirmation', true)
       is distinct from 'REINICIAR_BASE_PESCA_CON_FE' then
    raise exception
      'Reinicio bloqueado: falta la confirmacion REINICIAR_BASE_PESCA_CON_FE';
  end if;

  if not exists (
    select 1
    from public.perfiles_admin as pa
    join auth.users as u on u.id = pa.id
    where pa.activo = true
      and pa.rol = 'dueno'
  ) then
    raise exception 'Reinicio bloqueado: no existe un dueno activo para conservar';
  end if;
end
$proteccion$;

create temporary table reinicio_conteos_conservados
on commit drop
as
select
  (select count(*) from public.categorias)::bigint as categorias,
  (select count(*) from public.subcategorias)::bigint as subcategorias,
  (select count(*) from public.catalogo_nodos)::bigint as catalogo_nodos,
  (select count(*) from public.catalogo_atributos)::bigint as catalogo_atributos,
  (select count(*) from public.perfiles_admin)::bigint as perfiles_admin,
  (
    select count(*)
    from public.perfiles_cliente as pc
    join public.perfiles_admin as pa on pa.id = pc.id
  )::bigint as perfiles_cliente_admin;

-- Se incluyen juntos todos los lados de las claves foraneas operativas.
-- No se usa CASCADE: cualquier dependencia nueva no contemplada abortara el bloque.
truncate table
  private.reservas_stock,
  private.intentos_pago,
  public.pedido_items,
  public.pedidos,
  public.venta_fisica_items,
  public.ventas_fisicas,
  public.producto_atributos,
  public.producto_imagenes,
  public.producto_variantes,
  public.productos,
  public.marcas,
  public.direcciones_cliente,
  private.auditoria_seguridad,
  private.limites_frecuencia
restart identity;

-- Supabase permite eliminar usuarios desde auth.users. Las claves foraneas con
-- ON DELETE CASCADE limpian sus identidades, sesiones, MFA y perfil cliente.
-- Las cuentas con cualquier perfil administrativo se conservan.
delete from auth.users as u
where not exists (
  select 1
  from public.perfiles_admin as pa
  where pa.id = u.id
);

-- Estas secuencias no dependen de columnas identity y se reinician de forma
-- explicita para que el siguiente pedido/venta comience desde uno.
alter sequence public.pedido_codigo_seq restart with 1;
alter sequence public.ventas_fisicas_codigo_seq restart with 1;

do $verificacion$
declare
  esperados reinicio_conteos_conservados%rowtype;
  filas_operativas bigint;
begin
  select * into strict esperados from reinicio_conteos_conservados;

  select
    (select count(*) from private.reservas_stock)
    + (select count(*) from private.intentos_pago)
    + (select count(*) from public.pedido_items)
    + (select count(*) from public.pedidos)
    + (select count(*) from public.venta_fisica_items)
    + (select count(*) from public.ventas_fisicas)
    + (select count(*) from public.producto_atributos)
    + (select count(*) from public.producto_imagenes)
    + (select count(*) from public.producto_variantes)
    + (select count(*) from public.productos)
    + (select count(*) from public.marcas)
    + (select count(*) from public.direcciones_cliente)
    + (select count(*) from private.auditoria_seguridad)
    + (select count(*) from private.limites_frecuencia)
  into filas_operativas;

  if filas_operativas <> 0 then
    raise exception 'Verificacion fallida: quedan % filas operativas', filas_operativas;
  end if;

  if (select count(*) from public.categorias) <> esperados.categorias
    or (select count(*) from public.subcategorias) <> esperados.subcategorias
    or (select count(*) from public.catalogo_nodos) <> esperados.catalogo_nodos
    or (select count(*) from public.catalogo_atributos) <> esperados.catalogo_atributos then
    raise exception 'Verificacion fallida: cambiaron datos estructurales del catalogo';
  end if;

  if (select count(*) from public.perfiles_admin) <> esperados.perfiles_admin
    or (select count(*) from auth.users) <> esperados.perfiles_admin then
    raise exception 'Verificacion fallida: no se conservaron exactamente los administradores';
  end if;

  if exists (
    select 1
    from auth.users as u
    left join public.perfiles_admin as pa on pa.id = u.id
    where pa.id is null
  ) then
    raise exception 'Verificacion fallida: quedan usuarios sin perfil administrativo';
  end if;

  if (
    select count(*)
    from public.perfiles_cliente as pc
    join public.perfiles_admin as pa on pa.id = pc.id
  ) <> esperados.perfiles_cliente_admin then
    raise exception 'Verificacion fallida: cambiaron los perfiles cliente de administradores';
  end if;

  if not exists (
    select 1
    from public.perfiles_admin
    where activo = true and rol = 'dueno'
  ) then
    raise exception 'Verificacion fallida: no queda ningun dueno activo';
  end if;
end
$verificacion$;

commit;

-- Resultado final esperado. Estas consultas solo se alcanzan tras un COMMIT.
select
  (select count(*) from auth.users)::bigint as administradores_conservados,
  (select count(*) from public.marcas)::bigint as marcas,
  (select count(*) from public.productos)::bigint as productos,
  (select count(*) from public.pedidos)::bigint as pedidos,
  (select count(*) from public.direcciones_cliente)::bigint as direcciones,
  (select count(*) from public.ventas_fisicas)::bigint as ventas_fisicas;
