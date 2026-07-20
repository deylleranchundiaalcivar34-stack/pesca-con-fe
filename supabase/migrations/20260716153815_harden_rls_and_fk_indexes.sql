
-- Evita que clientes consuman números de pedido llamando el generador directamente.
revoke execute on function public.siguiente_codigo_pedido() from public, anon, authenticated;
grant execute on function public.siguiente_codigo_pedido() to service_role;

-- Las políticas administrativas nunca deben evaluarse para tráfico anónimo.
alter policy "Admins gestionan atributos del catalogo" on public.catalogo_atributos to authenticated;
alter policy "Admins gestionan catalogo" on public.catalogo_nodos to authenticated;
alter policy "Admins gestionan categorias" on public.categorias to authenticated;
alter policy "Admins gestionan direcciones cliente" on public.direcciones_cliente to authenticated;
alter policy "Admins gestionan marcas" on public.marcas to authenticated;
alter policy "Admins gestionan items de pedidos" on public.pedido_items to authenticated;
alter policy "Admins gestionan pedidos" on public.pedidos to authenticated;
alter policy "Admins leen perfiles admin" on public.perfiles_admin to authenticated;
alter policy "Admins gestionan perfiles cliente" on public.perfiles_cliente to authenticated;
alter policy "Admins gestionan atributos de productos" on public.producto_atributos to authenticated;
alter policy "Admins gestionan imagenes de productos" on public.producto_imagenes to authenticated;
alter policy "Admins gestionan variantes" on public.producto_variantes to authenticated;
alter policy "Admins gestionan productos" on public.productos to authenticated;
alter policy "Admins gestionan subcategorias" on public.subcategorias to authenticated;

-- La función auxiliar de administración solo es necesaria para sesiones autenticadas.
revoke execute on function private.es_admin() from public, anon;
grant execute on function private.es_admin() to authenticated;

-- Evalúa auth.uid() una sola vez por consulta y limita las políticas de cliente.
alter policy "Clientes gestionan sus direcciones"
  on public.direcciones_cliente
  to authenticated
  using (cliente_id = (select auth.uid()))
  with check (cliente_id = (select auth.uid()));

alter policy "Clientes leen items de sus pedidos"
  on public.pedido_items
  to authenticated
  using (
    exists (
      select 1
      from public.pedidos p
      where p.id = pedido_items.pedido_id
        and p.cliente_id = (select auth.uid())
    )
  );

alter policy "Clientes leen sus pedidos"
  on public.pedidos
  to authenticated
  using (cliente_id = (select auth.uid()));

alter policy "Clientes leen su perfil"
  on public.perfiles_cliente
  to authenticated
  using (id = (select auth.uid()));

alter policy "Clientes crean su perfil"
  on public.perfiles_cliente
  to authenticated
  with check (id = (select auth.uid()));

alter policy "Clientes actualizan su perfil"
  on public.perfiles_cliente
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Índices para claves foráneas usados en validaciones y eliminaciones.
create index if not exists intentos_pago_cliente_id_idx
  on private.intentos_pago (cliente_id);
create index if not exists reservas_stock_pedido_id_idx
  on private.reservas_stock (pedido_id);
create index if not exists reservas_stock_variante_id_idx
  on private.reservas_stock (variante_id);
create index if not exists pedido_items_producto_id_idx
  on public.pedido_items (producto_id);
create index if not exists pedidos_confirmado_por_idx
  on public.pedidos (confirmado_por);
create index if not exists pedidos_direccion_cliente_id_idx
  on public.pedidos (direccion_cliente_id);
create index if not exists producto_imagenes_creado_por_idx
  on public.producto_imagenes (creado_por);
create index if not exists producto_imagenes_actualizado_por_idx
  on public.producto_imagenes (actualizado_por);
create index if not exists productos_creado_por_idx
  on public.productos (creado_por);
create index if not exists productos_actualizado_por_idx
  on public.productos (actualizado_por);
create index if not exists productos_subcategoria_id_idx
  on public.productos (subcategoria_id);

-- Conserva la restricción UNIQUE respaldada por subcategorias_categoria_id_slug_key.
drop index if exists public.subcategorias_categoria_slug_unique_idx;
