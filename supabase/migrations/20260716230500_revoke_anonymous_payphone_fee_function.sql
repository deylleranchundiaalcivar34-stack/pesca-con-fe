-- La preparación del pago requiere sesión: nunca debe poder invocarla el rol anónimo.
revoke execute on function public.crear_pedido_payphone_con_recargo(jsonb) from anon;
revoke execute on function public.crear_pedido_payphone_con_recargo(jsonb) from public;
grant execute on function public.crear_pedido_payphone_con_recargo(jsonb) to authenticated;
