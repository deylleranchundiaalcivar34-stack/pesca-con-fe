-- La cédula se actualiza desde la Server Action autenticada y queda validada por el trigger
-- al crear el pedido. No se expone un RPC adicional en la API pública.
drop function if exists public.registrar_cedula_checkout(text);
