# Remediación de seguridad — Pesca Con Fe

**Fecha:** 17 de julio de 2026
**Rama de trabajo:** `codex/security-remediation`
**Informe de origen:** `docs/AUDITORIA-SEGURIDAD-2026-07-17.md`

## Resultado ejecutivo

Se implementaron las correcciones de código y las migraciones necesarias para los 20 hallazgos de la auditoría. La solución usa un despliegue **expandir / aplicación / contratar**: primero instala infraestructura compatible, después publica la aplicación y finalmente activa AAL2, mínimo privilegio y revoca las RPC anteriores.

Las correcciones todavía no deben considerarse cerradas en producción: cinco migraciones nuevas no se han aplicado, la aplicación no se ha desplegado y hay controles externos que requieren los paneles de Supabase, PayPhone, GitHub y el proveedor de hosting. La migración contractual `20260717175000` debe ejecutarse después de publicar la aplicación y comprobar MFA.

La migración `20260717151847_harden_function_execution.sql`, que elimina el bypass histórico del recargo PayPhone y endurece RPC, sí fue aplicada previamente al proyecto Supabase activo.

## Estado por hallazgo

| ID | Corrección preparada | Estado para cierre |
|---|---|---|
| SEC-01 | El formulario solo acepta el evento `PASSWORD_RECOVERY`; una sesión normal muestra enlace inválido. | **Pendiente externo:** exigir contraseña actual/reauth en Supabase Auth. La interfaz por sí sola no puede impedir una llamada directa a Auth. |
| SEC-02 | Webhook oficial, confirmación única reutilizable, señal durable, reintentos, reconciliación, estados de revisión y cancelación no destructiva. | **Pendiente:** migración, secretos, scheduler y autorización del webhook por PayPhone. |
| SEC-03 | TOTP, desafío AAL2, redirección obligatoria en proxy y exigencia independiente en RLS/RPC. | **Pendiente:** desplegar, enrolar a los dos propietarios y después aplicar RLS AAL2. |
| SEC-04 | Matriz de capacidades para `dueno`, `admin` y `vendedor`, aplicada en servidor, navegación y base de datos. | **Pendiente:** aplicar migración y ejecutar pruebas reales por rol. |
| SEC-05 | Elfsight quedó dentro de un `iframe` sin `allow-same-origin`; PayPhone/hCaptcha se cargan solo donde se usan; CSP limita orígenes. | **Implementado localmente; pendiente de desplegar.** |
| SEC-06 | Se recuperaron las 29 migraciones registradas en producción con sus versiones/nombres correctos; CI bloquea duplicados y patrones peligrosos. | **Pendiente:** reconstrucción semántica en una rama Supabase temporal antes de producción. |
| SEC-07 | Revocación de DML anónimo, lectura pública limitada al catálogo, grants autenticados explícitos, defaults cerrados y allowlist de RPC. | **Pendiente:** aplicar migración y volver a consultar grants/advisors. |
| SEC-08 | La RPC antigua sin recargo ya no es ejecutable por usuarios. | **Cerrado en producción** mediante `20260717151847`. |
| SEC-09 | El resultado consulta el pedido propio persistido; `estado=aprobado` en la URL ya no decide el mensaje. | **Implementado y probado localmente.** |
| SEC-10 | Serializador JSON-LD escapa caracteres capaces de cerrar el `<script>`. | **Implementado con pruebas unitarias.** |
| SEC-11 | Column grants ocultan autores, firma y `public_id` de Cloudinary; las consultas públicas usan campos curados. | **Pendiente:** aplicar migración y probar Data API anónima. |
| SEC-12 | CSP, `nosniff`, anti-framing, Permissions-Policy, COOP y otras cabeceras; `upgrade-insecure-requests` solo en producción. | **Implementado y verificado en navegador local.** |
| SEC-13 | Rate limit durable con identificadores HMAC e idempotencia transaccional por usuario/solicitud. | **Pendiente:** crear `RATE_LIMIT_SECRET` y aplicar migraciones. |
| SEC-14 | Registro y recuperación responden de forma genérica; hCaptcha está integrado. | **Pendiente externo:** protección de contraseñas filtradas, reauth, política de sesión/contraseña y CAPTCHA activos en Supabase. |
| SEC-15 | El POS obtiene el precio desde la base; vendedor no puede cambiarlo; admin tiene máximo 30 % de descuento y motivo; dueño conserva override auditado. | **Pendiente:** aplicar migración y validar política comercial con ventas de prueba. |
| SEC-16 | Límite por archivo/lote/cantidad, MIME permitido, firma binaria, dimensiones y límites de texto. | **Implementado con pruebas unitarias.** |
| SEC-17 | Tabla privada append-only y triggers para catálogo, productos, pedidos, roles y ventas; eventos explícitos PayPhone/POS. | **Pendiente:** aplicar migración y configurar retención/alertas externas. |
| SEC-18 | Paquetes sensibles fijados, overrides auditados, acciones GitHub por SHA, build/audit/secret scan/CodeQL en CI. | **Implementado; `pnpm audit` sin vulnerabilidades conocidas.** |
| SEC-19 | Server Actions devuelven mensajes estables y registran una referencia de correlación en servidor. | **Implementado localmente.** |
| SEC-20 | Canonical seguro por defecto y configuración documentada. | **Pendiente externo:** fijar `NEXT_PUBLIC_SITE_URL=https://pescaconfe.com` en producción y verificar cabeceras del dominio. |

## Cambios principales

### Identidad y administración

- `requireAdmin()` centraliza autenticación, rol, permiso y AAL2.
- `/admin/seguridad` permite enrolar y desafiar TOTP.
- El proxy no deja entrar a una ruta sensible con AAL1.
- Las Server Actions administrativas exigen la capacidad concreta.
- El propietario conserva todas las capacidades; `admin` no gestiona roles; `vendedor` solo registra/consulta ventas y catálogo público necesario.

### Base de datos

Las migraciones nuevas, aún no aplicadas en producción, son:

1. `20260717170000_security_rbac_aal_audit.sql`
2. `20260717172000_payphone_durable_reconciliation.sql`
3. `20260717173000_durable_rate_limits.sql`
4. `20260717174000_checkout_idempotency.sql`
5. `20260717175000_least_privilege_limits_and_physical_prices.sql`

Estas migraciones introducen RBAC, AAL2, auditoría, mínimo privilegio, precios POS derivados en servidor, persistencia PayPhone, reconciliación, rate limiting e idempotencia. Para producción se aplican primero `170000`, `172000`, `173000` y `174000`; `175000` es el contrato final y se aplica tras validar la nueva versión.

### Pagos

- `POST /api/pagos/payphone/NotificacionPago` implementa la ruta exigida por PayPhone.
- El payload externo es solo una señal: el servidor vuelve a consultar `Confirm` con credenciales propias y compara ID, referencia, monto y moneda.
- Cerrar la cajita solicita cancelación, pero no elimina pedido ni reserva hasta conocer un estado terminal.
- Los fallos transitorios usan backoff y, tras 12 intentos, pasan a revisión manual.
- Los estados terminales no vuelven a entrar en el reconciliador.
- El checkout usa una llave UUID de idempotencia y bloqueo transaccional.
- La aplicación conserva fallback a las RPC actuales únicamente para permitir el despliegue app-first sin detener ventas.

### Superficie web

- JSON-LD seguro frente a `</script>` y caracteres especiales.
- Resultado de pago derivado de RLS/base de datos.
- Validación estricta de imágenes y campos.
- Errores internos no se entregan al navegador.
- CSP y cabeceras modernas. Durante la verificación se detectó que `upgrade-insecure-requests` rompía CSS en `localhost`; quedó limitado a producción y el diseño fue revalidado.

## Evidencia de validación local

- `pnpm lint`: aprobado.
- `pnpm typecheck`: aprobado.
- `pnpm test`: 12 archivos, 43 pruebas aprobadas.
- `pnpm build`: 84 rutas compiladas correctamente.
- `pnpm audit --audit-level=moderate`: sin vulnerabilidades conocidas.
- `pnpm security:migrations`: 34 migraciones revisadas.
- `pnpm security:secrets`: revisa archivos rastreados y nuevos no ignorados.
- Parser PostgreSQL 17: sintaxis válida en las 34 migraciones.
- Historial: las primeras 29 versiones/nombres locales coinciden con Supabase producción.
- Navegador: portada estilizada, consola sin errores, `/admin` redirige a login, una visita normal no habilita reset y una URL de pago falsificada no muestra aprobación.

Esta evidencia no sustituye pruebas de integración contra PostgreSQL/Supabase real ni un pago sandbox PayPhone.

## Plan seguro de despliegue

### Fase 0 — Precondiciones y respaldo

1. Crear/exportar un respaldo recuperable de la base y guardar un inventario de grants, políticas y funciones.
2. Crear secretos aleatorios de al menos 32 bytes:
   - `RATE_LIMIT_SECRET` en producción;
   - `CRON_SECRET` con el mismo valor en producción y GitHub Actions.
3. Fijar `NEXT_PUBLIC_SITE_URL=https://pescaconfe.com`.
4. Confirmar que los dos propietarios pueden iniciar sesión y tienen un autenticador TOTP disponible.
5. Probar las cinco migraciones en una rama Supabase temporal. La organización está en plan Free y Supabase cotiza la rama en **USD 0,01344/hora**; requiere aprobación expresa antes de crearla.

Inventario de variables que deben configurarse directamente en los paneles, sin guardarlas en Git:

- Públicas: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`.
- Solo servidor: `SUPABASE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`, `PAYPHONE_TAX_MODE`, `PAYPHONE_TAX_RATE`, `CRON_SECRET`, `RATE_LIMIT_SECRET`.
- `RATE_LIMIT_SECRET` y `CRON_SECRET` deben contener al menos 32 bytes aleatorios, ser distintos entre sí y no reutilizar ninguna clave de proveedor.

### Fase 1 — Expandir la base sin retirar compatibilidad

1. Aplicar `20260717170000_security_rbac_aal_audit.sql` sin activar todavía sus políticas contractuales.
2. Aplicar `20260717172000`, `20260717173000` y `20260717174000`.
3. Reservar `20260717175000_least_privilege_limits_and_physical_prices.sql` para la fase contractual.
4. Verificar tablas, funciones nuevas y que las RPC anteriores continúan disponibles para la versión productiva actual.
5. Si falla la expansión, detener la publicación y corregir hacia adelante antes de desplegar la aplicación.

### Fase 2 — Publicar y validar la aplicación compatible

1. Publicar la rama validada y comprobar portada, login, perfil, carrito, transferencia y PayPhone sandbox.
2. Confirmar que checkout utiliza las RPC idempotentes nuevas y que reintentar no duplica pedidos.
3. Entrar con cada propietario a `/admin/seguridad` y completar un desafío AAL2.
4. Mantener disponible el despliegue anterior hasta completar estas pruebas; la expansión sigue siendo compatible con ambos artefactos.

### Fase 3 — Aplicar el contrato de seguridad

1. Aplicar `20260717175000_least_privilege_limits_and_physical_prices.sql` únicamente después de las comprobaciones anteriores.
2. Probar llamadas directas REST/RPC con:
   - anónimo;
   - cliente autenticado;
   - propietario AAL1;
   - propietario AAL2;
   - `admin` AAL2;
   - `vendedor` AAL2.
3. Confirmar que las RPC antiguas de checkout dejaron de ser ejecutables por clientes.
4. Ejecutar Supabase Security Advisor y revisar RLS/grants/`search_path`.

No es seguro volver a una versión antigua de la aplicación después del contrato. A partir de ese punto se debe corregir hacia adelante o restaurar explícitamente la compatibilidad antes de un rollback de aplicación.

### Fase 4 — PayPhone y reconciliación

1. Solicitar a `requests.docs@payphone.app` la activación de notificación externa para:
   `https://pescaconfe.com/api/pagos/payphone/NotificacionPago`
2. Añadir `CRON_SECRET` a los secretos de GitHub y habilitar el workflow `PayPhone reconciliation` cada cinco minutos.
3. Probar sandbox:
   - aprobado con retorno normal;
   - aprobado cerrando el navegador;
   - webhook repetido;
   - webhook antes/después del retorno;
   - cancelado;
   - timeout del proveedor;
   - stock agotado tras una reserva liberada.
4. Revisar que discrepancias y 12 fallos terminen en `requiere_revision`, no en aprobación automática.

### Fase 5 — Configuración Supabase Auth

1. Activar contraseña actual/reauth para cambios de contraseña.
2. Configurar longitud y complejidad coherentes con la validación de la app.
3. Activar hCaptcha en Auth y verificar que producción usa las claves correctas.
4. Definir expiración y política de sesiones administrativas.
5. Activar protección de contraseñas filtradas. Supabase la ofrece en planes superiores; la organización actual está en Free, por lo que puede requerir upgrade.
6. Probar la API directamente: una sesión normal no debe poder cambiar contraseña sin reautenticación.

### Fase 6 — Observabilidad y operación

1. Alertar por `requiere_revision`, conflictos PayPhone, intentos agotados, errores de rate limiter y cambios de roles.
2. Definir retención/exportación de `private.auditoria_seguridad` a un destino inmutable.
3. Revisar semanalmente Dependency/CodeQL/Supabase advisors.
4. Rotar secretos ante exposición, salida de personal o incidente.
5. Ejecutar una prueba trimestral de restauración y del procedimiento de pérdida de MFA.

## Criterio final de cierre

El proyecto puede considerarse endurecido para datos sensibles cuando:

- la aplicación corregida esté desplegada;
- los dos propietarios usen TOTP/AAL2;
- las cinco migraciones estén aplicadas y verificadas;
- Auth exija reautenticación para contraseña;
- webhook y reconciliación PayPhone estén activos;
- los secretos estén configurados y no versionados;
- pruebas directas confirmen denegación por rol/AAL;
- monitoreo y recuperación estén operativos.

Hasta entonces, el repositorio contiene la remediación, pero producción conserva riesgos pendientes de activación.
