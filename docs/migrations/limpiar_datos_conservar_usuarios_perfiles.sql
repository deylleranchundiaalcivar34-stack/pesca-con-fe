-- Limpia datos operativos y de catalogo de Pesca Con Fe.
-- Conserva auth.users, public.perfiles_admin y public.perfiles_cliente.
-- Ejecutar manualmente en Supabase SQL Editor despues de hacer respaldo/export.
--
-- Importante:
-- - Este script elimina direcciones guardadas de clientes porque no son perfiles.
-- - Este script no elimina archivos en Cloudinary; solo borra sus registros en Supabase.

begin;

truncate table
  public.movimientos_inventario,
  public.pedido_items,
  public.pedidos,
  public.producto_imagenes,
  public.productos,
  public.subcategorias,
  public.categorias,
  public.marcas,
  public.direcciones_cliente
restart identity cascade;

alter sequence if exists public.pedido_codigo_seq restart with 1001;

commit;

-- Verificacion opcional despues de ejecutar:
select 'perfiles_admin' as tabla, count(*) as registros from public.perfiles_admin
union all
select 'perfiles_cliente' as tabla, count(*) as registros from public.perfiles_cliente
union all
select 'direcciones_cliente' as tabla, count(*) as registros from public.direcciones_cliente
union all
select 'categorias' as tabla, count(*) as registros from public.categorias
union all
select 'subcategorias' as tabla, count(*) as registros from public.subcategorias
union all
select 'marcas' as tabla, count(*) as registros from public.marcas
union all
select 'productos' as tabla, count(*) as registros from public.productos
union all
select 'producto_imagenes' as tabla, count(*) as registros from public.producto_imagenes
union all
select 'pedidos' as tabla, count(*) as registros from public.pedidos
union all
select 'pedido_items' as tabla, count(*) as registros from public.pedido_items
union all
select 'movimientos_inventario' as tabla, count(*) as registros from public.movimientos_inventario
order by tabla;
