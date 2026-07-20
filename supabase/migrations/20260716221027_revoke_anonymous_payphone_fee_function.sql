-- La preparaciÃ³n del pago requiere sesiÃ³n: nunca debe poder invocarla el rol anÃ³nimo.
revoke execute on function public.crear_pedido_payphone_con_recargo(jsonb) from anon;
revoke execute on function public.crear_pedido_payphone_con_recargo(jsonb) from public;
grant execute on function public.crear_pedido_payphone_con_recargo(jsonb) to authenticated;
