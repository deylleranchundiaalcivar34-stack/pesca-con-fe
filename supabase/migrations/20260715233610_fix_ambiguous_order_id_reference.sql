-- The function returns a column named `id`. Qualifying the order table alias
-- prevents PL/pgSQL from treating `id` in the final UPDATE as ambiguous.
create or replace function public.crear_pedido_web(payload jsonb)
returns table(id uuid, codigo text)
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare
  pedido_id_creado uuid;
  pedido_codigo_creado text;
  cliente_actual uuid := auth.uid();
  perfil_cliente public.perfiles_cliente%rowtype;
  direccion_guardada public.direcciones_cliente%rowtype;
  direccion_cliente_input uuid;
  tipo_entrega_input public.tipo_entrega;
  items_input jsonb;
  item_input jsonb;
  producto_input uuid;
  variante_input uuid;
  cantidad_input integer;
  producto_record public.productos%rowtype;
  variante_record public.producto_variantes%rowtype;
  categoria_slug_calculada text;
  imagen_calculada text;
  precio_calculado numeric(10,2);
  subtotal_calculado numeric(10,2) := 0;
  envio_calculado numeric(10,2) := 0;
  provincia_calculada text;
  ciudad_calculada text;
  direccion_calculada text;
  referencia_calculada text;
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesión para generar un pedido';
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Datos de pedido inválidos';
  end if;

  select pc.* into perfil_cliente
  from public.perfiles_cliente as pc
  where pc.id = cliente_actual;

  if not found
    or nullif(trim(perfil_cliente.nombre_completo), '') is null
    or nullif(trim(perfil_cliente.cedula), '') is null
    or nullif(trim(perfil_cliente.celular), '') is null
    or nullif(trim(perfil_cliente.correo::text), '') is null then
    raise exception 'Completa tu perfil antes de generar un pedido';
  end if;

  tipo_entrega_input := coalesce(payload->>'tipo_entrega', 'envio_servientrega')::public.tipo_entrega;
  items_input := payload->'items';

  if jsonb_typeof(items_input) <> 'array' or jsonb_array_length(items_input) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  if jsonb_array_length(items_input) > 50 then
    raise exception 'El pedido supera el máximo de productos permitido';
  end if;

  direccion_cliente_input := nullif(payload->>'direccion_cliente_id', '')::uuid;

  if tipo_entrega_input = 'envio_servientrega' then
    if direccion_cliente_input is not null then
      select d.* into direccion_guardada
      from public.direcciones_cliente as d
      where d.id = direccion_cliente_input
        and d.cliente_id = cliente_actual
        and d.activa = true;

      if not found then
        raise exception 'La dirección seleccionada no pertenece al cliente';
      end if;

      provincia_calculada := direccion_guardada.provincia;
      ciudad_calculada := direccion_guardada.ciudad;
      direccion_calculada := direccion_guardada.direccion;
      referencia_calculada := direccion_guardada.referencia;
    else
      provincia_calculada := nullif(trim(coalesce(payload->>'cliente_provincia', '')), '');
      ciudad_calculada := nullif(trim(coalesce(payload->>'cliente_ciudad', '')), '');
      direccion_calculada := nullif(trim(coalesce(payload->>'cliente_direccion', '')), '');
      referencia_calculada := nullif(trim(coalesce(payload->>'cliente_referencia_entrega', '')), '');

      if provincia_calculada is null
        or ciudad_calculada is null
        or direccion_calculada is null
        or length(direccion_calculada) < 8 then
        raise exception 'Completa una dirección de entrega válida';
      end if;
    end if;
  else
    direccion_cliente_input := null;
  end if;

  insert into public.pedidos (
    cliente_id,
    cliente_nombre_completo,
    cliente_cedula,
    cliente_celular,
    cliente_correo,
    cliente_provincia,
    cliente_ciudad,
    cliente_direccion,
    cliente_referencia_entrega,
    direccion_cliente_id,
    tipo_entrega,
    subtotal,
    envio,
    total,
    estado
  )
  values (
    cliente_actual,
    perfil_cliente.nombre_completo,
    perfil_cliente.cedula,
    perfil_cliente.celular,
    perfil_cliente.correo,
    provincia_calculada,
    ciudad_calculada,
    direccion_calculada,
    referencia_calculada,
    direccion_cliente_input,
    tipo_entrega_input,
    0,
    0,
    0,
    'pendiente_pago'
  )
  returning pedidos.id, pedidos.codigo into pedido_id_creado, pedido_codigo_creado;

  for item_input in select value from jsonb_array_elements(items_input)
  loop
    if nullif(item_input->>'producto_id', '') is null
      or coalesce(item_input->>'cantidad', '') !~ '^[1-9][0-9]*$' then
      raise exception 'Producto o cantidad inválidos';
    end if;

    producto_input := (item_input->>'producto_id')::uuid;
    variante_input := nullif(item_input->>'variante_id', '')::uuid;
    cantidad_input := (item_input->>'cantidad')::integer;
    variante_record := null;

    select p.* into producto_record
    from public.productos as p
    where p.id = producto_input
      and p.activo = true;

    if not found then
      raise exception 'El producto seleccionado ya no está disponible';
    end if;

    select c.slug into categoria_slug_calculada
    from public.categorias as c
    where c.id = producto_record.categoria_id;

    select pi.cloudinary_secure_url into imagen_calculada
    from public.producto_imagenes as pi
    where pi.producto_id = producto_record.id
      and pi.activo = true
    order by pi.principal desc, pi.orden asc
    limit 1;

    if variante_input is not null then
      select v.* into variante_record
      from public.producto_variantes as v
      where v.id = variante_input
        and v.producto_id = producto_record.id
        and v.activo = true;

      if not found then
        raise exception 'La variante seleccionada no está disponible para este producto';
      end if;

      if variante_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para la variante seleccionada';
      end if;

      precio_calculado := coalesce(variante_record.precio_oferta, variante_record.precio);
    else
      if producto_record.stock < cantidad_input then
        raise exception 'Stock insuficiente para el producto seleccionado';
      end if;

      precio_calculado := coalesce(producto_record.precio_oferta, producto_record.precio);
    end if;

    insert into public.pedido_items (
      pedido_id,
      producto_id,
      variante_id,
      variante_nombre,
      variante_sku,
      producto_nombre,
      producto_slug,
      producto_sku,
      producto_imagen,
      categoria_slug,
      precio,
      cantidad
    )
    values (
      pedido_id_creado,
      producto_record.id,
      case when variante_input is null then null else variante_record.id end,
      case when variante_input is null then null else variante_record.nombre end,
      case when variante_input is null then null else variante_record.sku end,
      case
        when variante_input is null then producto_record.nombre
        else producto_record.nombre || ' · ' || variante_record.nombre
      end,
      producto_record.slug,
      producto_record.sku,
      imagen_calculada,
      coalesce(categoria_slug_calculada, ''),
      precio_calculado,
      cantidad_input
    );

    subtotal_calculado := subtotal_calculado + (precio_calculado * cantidad_input);

    if tipo_entrega_input = 'envio_servientrega' then
      envio_calculado := greatest(
        envio_calculado,
        case when categoria_slug_calculada = 'canas' then 8.50 else 6.50 end
      );
    end if;
  end loop;

  update public.pedidos as p
  set subtotal = subtotal_calculado,
      envio = envio_calculado,
      total = subtotal_calculado + envio_calculado
  where p.id = pedido_id_creado;

  return query select pedido_id_creado, pedido_codigo_creado;
end;
$function$;
