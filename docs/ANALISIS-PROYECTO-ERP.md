# Auditoría técnica y viabilidad ERP

Fecha: 17 de julio de 2026.

## Resultado ejecutivo

El e-commerce queda compilando y con sus validaciones en verde. Se revisaron 150 archivos TypeScript/TSX, 81 rutas de producción y la base Supabase remota. No se detectan módulos huérfanos después de la limpieza y la integridad actual de productos, imágenes, pedidos, totales y direcciones es correcta.

El panel **todavía no es un ERP**: es un backoffice de e-commerce con inventario básico, pedidos, reportes y un POS inicial. La base es reutilizable y la evolución es factible, pero requiere modelar movimientos de inventario, compras, costos, caja, contabilidad y control interno; no conviene ampliar las tablas actuales como si solo fueran más pantallas.

## Correcciones aplicadas

- Eliminado código sin uso: un componente completo, exports auxiliares y el flujo PayPhone `Prepare` antiguo.
- Autorización administrativa centralizada; validación de UUID y errores de Supabase que antes se ignoraban.
- Carga de imágenes con limpieza de Cloudinary y restauración de portada ante fallos parciales.
- Reporte de ventas basado en `estado_pago = aprobado` y `pagado_en`, no en el estado logístico del pedido.
- Migración remota `20260717151847_harden_function_execution` aplicada:
  - impide ejecutar directamente la función PayPhone que omitía el recargo;
  - elimina acceso anónimo a ventas físicas y a funciones de trigger;
  - solo permite confirmar manualmente transferencias;
  - registra `estado_pago` y `pagado_en` al cobrar y corrige el registro histórico inconsistente.
- Dependencias transitivas vulnerables de PostCSS y Babel fijadas a versiones seguras; `pnpm audit --prod` reporta cero vulnerabilidades conocidas.
- Añadidos el inventario documentado de variables, la auditoría de dependencias en CI y las rutas administrativas faltantes.

## Estado comprobado

| Comprobación | Resultado |
| --- | --- |
| ESLint | Correcto |
| TypeScript estricto | Correcto |
| Pruebas unitarias | 43/43, 12 archivos |
| Build Next.js | Correcto, 84 rutas |
| Auditoría de paquetes | 0 vulnerabilidades conocidas |
| Tablas públicas Supabase | 16/16 con RLS |
| Productos activos | 52 |
| Pedidos | 43 |
| Inconsistencias de totales, stock lógico, imágenes o pagos revisadas | 0 |

## Pendientes técnicos priorizados

### P0 — antes de producción

1. **Historial de migraciones no reproducible:** la base remota tiene 29 migraciones y el repositorio solo 13; además, varias versiones locales no coinciden con las remotas. Crear un baseline verificable y exigir migraciones en CI.
2. Certificar PayPhone de extremo a extremo: pago aprobado/rechazado, reintento, retorno duplicado, abandono, conciliación y devolución.
3. Activar en Supabase Auth la protección contra contraseñas filtradas.
4. Completar el SKU de la variante activa `Caña Casting Abu Garcia Veritas PLX / 7 pies - Medium Heavy - 80lb`.
5. Añadir pruebas de integración para RPC, RLS, concurrencia de stock y callbacks de pago. La cobertura actual es baja para operaciones financieras.

### P1 — escalabilidad y mantenimiento

- Generar y versionar tipos de la base Supabase; hoy gran parte del mapeo es manual.
- Mover agregaciones del panel a consultas/vistas SQL y paginar pedidos/productos antes de que crezcan los datos.
- Mantener vigilados los dos RPC `SECURITY DEFINER` del checkout. Son intencionales y validan usuario/precios en servidor, pero requieren pruebas y revisión en cada cambio.
- Definir descuentos con motivo, límite y aprobación; la venta física actualmente permite un precio unitario editable.

## Evaluación ERP

**Factibilidad: alta para un ERP comercial/inventario propio; media para un ERP contable completo.** La cobertura funcional actual estimada es de 30–40 % de un ERP minorista mínimo.

Ya existe una buena base:

- catálogo, productos, variantes, SKU y stock;
- clientes, direcciones, pedidos y pagos;
- venta física inicial;
- operaciones de stock transaccionales en varios flujos;
- panel, reportes básicos, exportación y perfil administrador.

Falta para considerarlo ERP:

1. **Inventario:** kardex inmutable, tipos de movimiento, bodegas/ubicaciones, transferencias, conteos, ajustes, reservas visibles, lotes/series si aplican y stock disponible vs. comprometido.
2. **Compras:** proveedores, órdenes de compra, recepción parcial, devoluciones, costos adicionales y cuentas por pagar.
3. **Costos y rentabilidad:** costo histórico, promedio/FIFO según decisión contable, margen real por canal/producto y valorización de inventario.
4. **Caja y pagos:** apertura/cierre de caja, arqueos, conciliación PayPhone/banco, reembolsos, notas de crédito y trazabilidad de descuentos.
5. **Finanzas y Ecuador:** plan de cuentas, asientos, impuestos, documentos electrónicos/SRI y cuentas por cobrar/pagar. Debe validarse con un contador local.
6. **Gobierno:** permisos por módulo/acción, bitácora de auditoría, aprobaciones, numeraciones documentales y cierre de periodos.
7. **Operación:** devoluciones/RMA, CRM básico, compras sugeridas, alertas, indicadores y exportaciones contables.

## Ruta recomendada

1. Estabilizar migraciones, pruebas de base, PayPhone y seguridad.
2. Crear el núcleo ERP: `movimientos_inventario`, bodegas, ajustes, conteos, proveedores, compras y recepciones. Todo cambio de stock debe generar un movimiento trazable dentro de la misma transacción.
3. Añadir costos, márgenes, caja, conciliación, devoluciones y notas de crédito.
4. Integrar facturación/SRI y contabilidad solo después de definir el alcance con administración y contabilidad.
5. Incorporar roles granulares, auditoría y reportes agregados.

Conclusión: conviene evolucionar el sistema actual de forma modular. El e-commerce puede ser el canal de ventas del ERP, pero inventario, compras y finanzas deben convertirse en dominios propios con trazabilidad; de lo contrario el stock seguirá siendo solo un número mutable y no un registro empresarial auditable.
