-- El total del pedido incluye el recargo de PayPhone cuando aplique.
alter table public.pedidos
  drop constraint if exists pedidos_total_consistente;

alter table public.pedidos
  add constraint pedidos_total_consistente
  check (total = subtotal + envio + recargo_pago);
