-- Corrige la normalización para que también acepte una cédula escrita con separadores.
create or replace function private.es_cedula_ecuatoriana_valida(cedula_input text)
returns boolean
language plpgsql
immutable
strict
set search_path = pg_catalog, private
as $$
declare
  cedula text := regexp_replace(trim(cedula_input), '[^0-9]', '', 'g');
  indice integer;
  digito integer;
  acumulado integer := 0;
  verificador integer;
begin
  if cedula !~ '^[0-9]{10}$'
    or substring(cedula from 1 for 2)::integer not between 1 and 24
    or substring(cedula from 3 for 1)::integer > 5 then
    return false;
  end if;

  for indice in 1..9 loop
    digito := substring(cedula from indice for 1)::integer;

    if indice % 2 = 1 then
      digito := digito * 2;
      if digito > 9 then
        digito := digito - 9;
      end if;
    end if;

    acumulado := acumulado + digito;
  end loop;

  verificador := case when acumulado % 10 = 0 then 0 else 10 - (acumulado % 10) end;
  return verificador = substring(cedula from 10 for 1)::integer;
end;
$$;

create or replace function public.registrar_cedula_checkout(cedula_input text)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  cliente_actual uuid := auth.uid();
  cedula_normalizada text := regexp_replace(trim(coalesce(cedula_input, '')), '[^0-9]', '', 'g');
begin
  if cliente_actual is null then
    raise exception 'Debes iniciar sesión para registrar tu cédula';
  end if;

  if not private.es_cedula_ecuatoriana_valida(cedula_normalizada) then
    raise exception 'La cédula debe ser ecuatoriana y válida';
  end if;

  update public.perfiles_cliente
  set cedula = cedula_normalizada
  where id = cliente_actual;

  if not found then
    raise exception 'No encontramos tu perfil de cliente';
  end if;

  return cedula_normalizada;
end;
$$;

create or replace function private.preparar_datos_envio_pedido()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private, pg_temp
as $$
declare
  cedula_cliente text;
  provincia_normalizada text;
begin
  if new.tipo_entrega <> 'envio_servientrega' then
    return new;
  end if;

  select pc.cedula
    into cedula_cliente
  from public.perfiles_cliente as pc
  where pc.id = new.cliente_id;

  if not private.es_cedula_ecuatoriana_valida(cedula_cliente) then
    raise exception 'Para envío por Servientrega debes registrar una cédula ecuatoriana válida';
  end if;

  new.cliente_cedula := regexp_replace(cedula_cliente, '[^0-9]', '', 'g');
  provincia_normalizada := translate(
    lower(trim(coalesce(new.cliente_provincia, ''))),
    U&'\00E1\00E9\00ED\00F3\00FA\00FC\00F1',
    'aeiouun'
  );

  if provincia_normalizada = 'galapagos' then
    new.envio := 0;
    new.total := new.subtotal;
  end if;

  return new;
end;
$$;

create or replace function private.bloquear_payphone_galapagos()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, private, pg_temp
as $$
declare
  provincia_normalizada text;
begin
  provincia_normalizada := translate(
    lower(trim(coalesce(new.cliente_provincia, ''))),
    U&'\00E1\00E9\00ED\00F3\00FA\00FC\00F1',
    'aeiouun'
  );

  if new.tipo_entrega = 'envio_servientrega'
    and provincia_normalizada = 'galapagos'
    and new.metodo_pago = 'payphone' then
    raise exception 'Los envíos a Galápagos requieren cotización por WhatsApp antes del pago';
  end if;

  return new;
end;
$$;
