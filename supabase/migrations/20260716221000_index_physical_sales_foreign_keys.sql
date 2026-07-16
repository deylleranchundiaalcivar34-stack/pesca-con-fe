-- Evita búsquedas lentas al consultar o relacionar ventas físicas.
create index if not exists venta_fisica_items_producto_id_idx on public.venta_fisica_items (producto_id);
create index if not exists venta_fisica_items_variante_id_idx on public.venta_fisica_items (variante_id);
create index if not exists ventas_fisicas_creado_por_idx on public.ventas_fisicas (creado_por);
