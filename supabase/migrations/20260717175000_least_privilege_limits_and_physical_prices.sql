-- Contrato de seguridad: AAL2/RBAC, mínimo privilegio y política de precios POS.
-- Aplicar solo después de desplegar la aplicación compatible, verificar un dueño con
-- MFA operativo y completar las migraciones de expansión 170000, 172000, 173000 y 174000.

-- El propio perfil puede leerse en AAL1 para completar/desafiar MFA. Gestionar
-- otros perfiles sigue reservado al dueño con AAL2.
drop policy if exists "Admins leen perfiles admin" on public.perfiles_admin;
create policy "Admin lee su perfil o dueno gestiona roles"
on public.perfiles_admin for select to authenticated
using (
  (id = (select auth.uid()) and activo = true and rol in ('dueno', 'admin', 'vendedor'))
  or (select private.tiene_permiso('roles.manage', true))
);

drop policy if exists "Admins gestionan categorias" on public.categorias;
create policy "Catalogo gestionado con permiso" on public.categorias
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan subcategorias" on public.subcategorias;
create policy "Subcategorias gestionadas con permiso" on public.subcategorias
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan marcas" on public.marcas;
create policy "Marcas gestionadas con permiso" on public.marcas
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan catalogo" on public.catalogo_nodos;
create policy "Nodos gestionados con permiso" on public.catalogo_nodos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan atributos del catalogo" on public.catalogo_atributos;
create policy "Atributos gestionados con permiso" on public.catalogo_atributos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan atributos de productos" on public.producto_atributos;
create policy "Atributos producto gestionados con permiso" on public.producto_atributos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan productos" on public.productos;
create policy "Productos gestionados con permiso" on public.productos
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan variantes" on public.producto_variantes;
create policy "Variantes gestionadas con permiso" on public.producto_variantes
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan imagenes de productos" on public.producto_imagenes;
create policy "Imagenes gestionadas con permiso" on public.producto_imagenes
for all to authenticated
using ((select private.tiene_permiso('catalog.write', true)))
with check ((select private.tiene_permiso('catalog.write', true)));

drop policy if exists "Admins gestionan pedidos" on public.pedidos;
create policy "Personal autorizado lee pedidos" on public.pedidos
for select to authenticated
using ((select private.tiene_permiso('orders.read', true)));
create policy "Personal autorizado gestiona pedidos" on public.pedidos
for all to authenticated
using ((select private.tiene_permiso('orders.write', true)))
with check ((select private.tiene_permiso('orders.write', true)));

drop policy if exists "Admins gestionan items de pedidos" on public.pedido_items;
create policy "Personal autorizado lee items pedidos" on public.pedido_items
for select to authenticated
using ((select private.tiene_permiso('orders.read', true)));
create policy "Personal autorizado gestiona items pedidos" on public.pedido_items
for all to authenticated
using ((select private.tiene_permiso('orders.write', true)))
with check ((select private.tiene_permiso('orders.write', true)));

drop policy if exists "Admins gestionan perfiles cliente" on public.perfiles_cliente;
create policy "Personal autorizado lee perfiles cliente" on public.perfiles_cliente
for select to authenticated
using ((select private.tiene_permiso('customers.read', true)));

drop policy if exists "Admins gestionan direcciones cliente" on public.direcciones_cliente;
create policy "Personal autorizado lee direcciones cliente" on public.direcciones_cliente
for select to authenticated
using ((select private.tiene_permiso('customers.read', true)));

drop policy if exists "Admins gestionan ventas fisicas" on public.ventas_fisicas;
create policy "Personal autorizado lee ventas fisicas" on public.ventas_fisicas
for select to authenticated
using ((select private.tiene_permiso('sales.read', true)));

drop policy if exists "Admins gestionan items de ventas fisicas" on public.venta_fisica_items;
create policy "Personal autorizado lee items venta fisica" on public.venta_fisica_items
for select to authenticated
using ((select private.tiene_permiso('sales.read', true)));

-- La API anónima nunca debe mutar tablas. Los clientes autenticados reciben solo
-- las operaciones usadas por la aplicación; RLS sigue siendo la segunda barrera.
revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from anon;
revoke all on all sequences in schema public from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on all tables in schema public from authenticated;

-- La lectura anónima se limita al catálogo. Los datos de cuentas, pedidos y
-- ventas requieren sesión y continúan filtrados por RLS.
revoke select on all tables in schema public from anon, authenticated;

grant select on table
  public.categorias,
  public.subcategorias,
  public.marcas,
  public.catalogo_nodos,
  public.catalogo_atributos,
  public.producto_atributos,
  public.producto_variantes,
  public.productos_publicos
to anon, authenticated;

grant select on table
  public.perfiles_admin,
  public.perfiles_cliente,
  public.direcciones_cliente,
  public.pedidos,
  public.pedido_items,
  public.ventas_fisicas,
  public.venta_fisica_items
to authenticated;

grant insert, update, delete on table
  public.categorias,
  public.subcategorias,
  public.marcas,
  public.catalogo_nodos,
  public.catalogo_atributos,
  public.producto_atributos,
  public.productos,
  public.producto_variantes,
  public.producto_imagenes
to authenticated;

grant update on table public.pedidos to authenticated;
grant insert, update, delete on table public.perfiles_cliente, public.direcciones_cliente
  to authenticated;

-- No exponer UUID de autores, firmas ni identificadores internos de Cloudinary.
revoke select on table public.productos from anon, authenticated;
grant select (
  id, categoria_id, subcategoria_id, marca_id, slug, nombre, sku, precio,
  precio_oferta, stock, descripcion, caracteristicas, youtube_video_id,
  destacado, activo, catalogo_nodo_id
) on public.productos to anon, authenticated;

revoke select on table public.producto_imagenes from anon, authenticated;
grant select (
  id, producto_id, cloudinary_secure_url, cloudinary_url, cloudinary_version,
  cloudinary_format, cloudinary_resource_type, cloudinary_width,
  cloudinary_height, cloudinary_bytes, alt, orden, principal, activo
) on public.producto_imagenes to anon, authenticated;

-- Por defecto, los objetos futuros no quedan publicados accidentalmente.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- Retirar ejecución implícita de funciones existentes y volver a conceder solo
-- los puntos de entrada documentados de la aplicación.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.es_cedula_ecuatoriana(text) to anon, authenticated;
grant execute on function public.crear_pedido_web(jsonb) to authenticated;
grant execute on function public.crear_pedido_payphone_con_recargo(jsonb) to authenticated;
grant execute on function public.registrar_venta_fisica(jsonb, text, text) to authenticated;
grant execute on function public.confirmar_pago_pedido(uuid) to authenticated;
grant execute on function public.marcar_pedido_listo_retiro(uuid) to authenticated;
grant execute on function public.marcar_pedido_retirado(uuid) to authenticated;
grant execute on function public.marcar_pedido_enviado(uuid) to authenticated;
grant execute on function public.cancelar_pedido(uuid) to authenticated;
grant execute on all functions in schema public to service_role;

-- Datos suficientes para demostrar y auditar cualquier precio modificado.
alter table public.venta_fisica_items
  add column if not exists precio_lista numeric,
  add column if not exists precio_override boolean not null default false,
  add column if not exists motivo_override text;

update public.venta_fisica_items
set precio_lista = precio
where precio_lista is null;

alter table public.venta_fisica_items
  alter column precio_lista set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.venta_fisica_items'::regclass
      and conname = 'venta_fisica_items_precio_lista_valido'
  ) then
    alter table public.venta_fisica_items
      add constraint venta_fisica_items_precio_lista_valido check (precio_lista >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.venta_fisica_items'::regclass
      and conname = 'venta_fisica_items_motivo_override_valido'
  ) then
    alter table public.venta_fisica_items
      add constraint venta_fisica_items_motivo_override_valido check (
        (not precio_override and motivo_override is null)
        or (
          precio_override
          and char_length(btrim(motivo_override)) between 5 and 500
        )
      );
  end if;
end;
$$;

create or replace function public.registrar_venta_fisica(
  items_input jsonb,
  nota_input text default null,
  metodo_pago_input text default 'efectivo'
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  item jsonb;
  venta_id uuid;
  producto_record public.productos%rowtype;
  variante_record public.producto_variantes%rowtype;
  producto_id_input uuid;
  variante_id_input uuid;
  cantidad_input integer;
  precio_solicitado numeric;
  precio_lista_input numeric;
  precio_aplicado numeric;
  tiene_override boolean;
  subtotal_input numeric := 0;
  nota_limpia text := nullif(btrim(nota_input), '');
  rol_actual text;
begin
  if not private.tiene_permiso('sales.create', true) then
    raise exception 'No autorizado';
  end if;

  rol_actual := private.rol_admin_actual();

  if jsonb_typeof(items_input) <> 'array'
    or jsonb_array_length(items_input) = 0
    or jsonb_array_length(items_input) > 50 then
    raise exception 'Agrega entre uno y cincuenta productos a la venta';
  end if;

  if nota_limpia is not null and char_length(nota_limpia) > 500 then
    raise exception 'La nota no puede superar 500 caracteres';
  end if;

  if metodo_pago_input not in ('efectivo', 'transferencia', 'tarjeta', 'otro') then
    raise exception 'Método de pago no válido';
  end if;

  insert into public.ventas_fisicas (nota, metodo_pago, subtotal, total, creado_por)
  values (nota_limpia, metodo_pago_input, 0, 0, auth.uid())
  returning id into venta_id;

  for item in select value from jsonb_array_elements(items_input)
  loop
    begin
      producto_id_input := (item ->> 'productId')::uuid;
      variante_id_input := nullif(item ->> 'variantId', '')::uuid;
      cantidad_input := (item ->> 'quantity')::integer;
      precio_solicitado := (item ->> 'price')::numeric;
    exception when others then
      raise exception 'Un artículo de la venta tiene datos inválidos';
    end;

    if cantidad_input <= 0 or cantidad_input > 999
      or precio_solicitado is null or precio_solicitado < 0 then
      raise exception 'Cantidad o precio inválido';
    end if;

    select * into producto_record
    from public.productos
    where id = producto_id_input and activo = true
    for update;

    if not found then
      raise exception 'Producto no encontrado o inactivo';
    end if;

    if variante_id_input is not null then
      select * into variante_record
      from public.producto_variantes
      where id = variante_id_input
        and producto_id = producto_id_input
        and activo = true
      for update;

      if not found then
        raise exception 'Variante no encontrada o inactiva';
      end if;

      precio_lista_input := coalesce(variante_record.precio_oferta, variante_record.precio);

      if variante_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para %', producto_record.nombre || ' - ' || variante_record.nombre;
      end if;

      update public.producto_variantes
      set stock = variante_record.stock - cantidad_input,
          actualizado_en = now()
      where id = variante_id_input;
    else
      precio_lista_input := coalesce(producto_record.precio_oferta, producto_record.precio);

      if producto_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para %', producto_record.nombre;
      end if;

      update public.productos
      set stock = producto_record.stock - cantidad_input,
          actualizado_por = auth.uid()
      where id = producto_id_input;
    end if;

    tiene_override := abs(precio_solicitado - precio_lista_input) > 0.005;
    precio_aplicado := round(precio_solicitado, 2);

    if tiene_override then
      if not private.tiene_permiso('sales.override_price', true) then
        raise exception 'Tu rol no puede modificar precios';
      end if;

      if nota_limpia is null or char_length(nota_limpia) < 5 then
        raise exception 'Explica el motivo del cambio de precio en la nota';
      end if;

      if precio_aplicado > round(precio_lista_input * 2, 2) then
        raise exception 'El precio modificado está fuera del límite permitido';
      end if;

      if rol_actual <> 'dueno' and precio_aplicado < round(precio_lista_input * 0.70, 2) then
        raise exception 'Descuentos mayores al 30 por ciento requieren al dueño';
      end if;
    else
      precio_aplicado := precio_lista_input;
    end if;

    insert into public.venta_fisica_items (
      venta_id, producto_id, variante_id, producto_nombre, variante_nombre,
      producto_sku, precio, precio_lista, precio_override, motivo_override, cantidad
    ) values (
      venta_id, producto_id_input, variante_id_input, producto_record.nombre,
      case when variante_id_input is null then null else variante_record.nombre end,
      case when variante_id_input is null then producto_record.sku else variante_record.sku end,
      precio_aplicado, precio_lista_input, tiene_override,
      case when tiene_override then nota_limpia else null end,
      cantidad_input
    );

    if tiene_override then
      perform private.registrar_auditoria_interna(
        'sales.price_override', 'venta_fisica', venta_id::text, 'ok',
        jsonb_build_object(
          'producto_id', producto_id_input,
          'variante_id', variante_id_input,
          'precio_lista', precio_lista_input,
          'precio_aplicado', precio_aplicado
        )
      );
    end if;

    subtotal_input := subtotal_input + (precio_aplicado * cantidad_input);
  end loop;

  update public.ventas_fisicas
  set subtotal = subtotal_input,
      total = subtotal_input
  where id = venta_id;

  perform private.registrar_auditoria_interna(
    'sales.created', 'venta_fisica', venta_id::text, 'ok',
    jsonb_build_object('metodo_pago', metodo_pago_input, 'total', subtotal_input)
  );

  return venta_id;
end;
$$;

revoke all on function public.registrar_venta_fisica(jsonb, text, text)
  from public, anon;
grant execute on function public.registrar_venta_fisica(jsonb, text, text)
  to authenticated, service_role;

-- La aplicación desplegada ya usa las variantes idempotentes. Los puntos de entrada
-- anteriores se cierran únicamente en esta fase contractual para conservar rollback
-- seguro durante la expansión.
revoke all on function public.crear_pedido_web(jsonb) from public, anon, authenticated;
revoke all on function public.crear_pedido_payphone_con_recargo(jsonb)
  from public, anon, authenticated;
do $$
begin
  if to_regprocedure('public.crear_pedido_web_idempotente(jsonb,uuid)') is not null then
    execute 'grant execute on function public.crear_pedido_web_idempotente(jsonb, uuid) '
      || 'to authenticated, service_role';
  end if;

  if to_regprocedure('public.crear_pedido_payphone_idempotente(jsonb,uuid)') is not null then
    execute 'grant execute on function public.crear_pedido_payphone_idempotente(jsonb, uuid) '
      || 'to authenticated, service_role';
  end if;
end;
$$;

-- Límites de texto adicionales para evitar payloads fuera del contrato.
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.productos'::regclass and conname = 'productos_limites_texto') then
    alter table public.productos add constraint productos_limites_texto check (
      char_length(nombre) between 1 and 160
      and char_length(slug) between 1 and 180
      and char_length(sku) between 1 and 80
      and char_length(descripcion) <= 5000
      and cardinality(caracteristicas) <= 30
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conrelid = 'public.producto_variantes'::regclass and conname = 'producto_variantes_limites_texto') then
    alter table public.producto_variantes add constraint producto_variantes_limites_texto check (
      char_length(nombre) between 1 and 160
      and (descripcion is null or char_length(descripcion) <= 1000)
      and (sku is null or char_length(sku) <= 80)
      and (imagen is null or char_length(imagen) <= 2048)
      and jsonb_typeof(atributos) = 'object'
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conrelid = 'public.direcciones_cliente'::regclass and conname = 'direcciones_cliente_limites_texto') then
    alter table public.direcciones_cliente add constraint direcciones_cliente_limites_texto check (
      char_length(alias) between 1 and 80
      and char_length(provincia) between 1 and 100
      and char_length(ciudad) between 1 and 100
      and char_length(direccion) between 8 and 500
      and (referencia is null or char_length(referencia) <= 500)
      and (celular_contacto is null or char_length(celular_contacto) <= 30)
    ) not valid;
  end if;
end;
$$;
