# Auditoría integral de seguridad — Pesca con Fe

> **Actualización de remediación:** este documento conserva el estado encontrado al iniciar la revisión. Las correcciones implementadas, lo que aún falta activar en producción y el plan de despliegue seguro están en [`REMEDIACION-SEGURIDAD-2026-07-17.md`](./REMEDIACION-SEGURIDAD-2026-07-17.md).

**Fecha:** 17 de julio de 2026
**Revisión de código:** `ca65a448ed0a`
**Entornos revisados:** repositorio local, despliegue público `https://pescaconfe.com`, proyecto Supabase activo y metadatos públicos del repositorio GitHub.
**Resultado general:** no se encontró evidencia de una intrusión ni una vulnerabilidad crítica de ejecución remota o exposición masiva inmediata. Sí existen **7 hallazgos altos, 11 medios y 2 bajos** que deben corregirse antes de considerar el sistema suficientemente endurecido para información sensible.

> Este documento es una evaluación técnica puntual, no una garantía de ausencia total de vulnerabilidades. Los controles operativos que requieren acceso a paneles de proveedores se enumeran como “por verificar” y no se presentan como fallos confirmados.

## 1. Alcance y metodología

Se revisaron:

- autenticación, recuperación de contraseña, registro y gestión de sesión;
- autorización de clientes y personal administrativo;
- checkout, cálculo de precios, stock, pedidos, venta física y PayPhone;
- Server Actions, Route Handlers, proxy, validación de entradas y manejo de errores;
- acceso a Supabase, RLS, privilegios, vistas, funciones `SECURITY DEFINER`, esquema privado y migraciones;
- exposición de secretos, historial Git local y separación entre claves públicas y privadas;
- scripts externos, Cloudinary, hCaptcha y superficie del navegador;
- cabeceras HTTP y configuración de Next.js/Vercel;
- dependencias, lockfile, Dependabot y GitHub Actions;
- pruebas automatizadas y compilación de producción.

Comprobaciones ejecutadas:

- `pnpm audit --json`;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test` — 4 archivos y 12 pruebas aprobadas;
- `pnpm build` — compilación de producción aprobada;
- inspección anónima controlada de la Data API de Supabase;
- asesores de seguridad y rendimiento de Supabase;
- comparación de migraciones locales con las registradas en producción;
- inspección de cabeceras HTTPS/HTTP del dominio desplegado;
- búsqueda de los valores exactos de los secretos locales actuales en todas las revisiones Git locales, sin imprimirlos.

No se realizaron ataques destructivos, pruebas de denegación de servicio, cobros reales, alteración de datos de clientes ni rotación de credenciales.

### Escala utilizada

- **Crítica:** compromiso inmediato y generalizado, sin precondiciones relevantes.
- **Alta:** posible toma de cuentas, afectación importante de pagos/datos o fallo sistémico con impacto elevado.
- **Media:** requiere condiciones adicionales, tiene alcance limitado o debilita una defensa importante.
- **Baja:** endurecimiento o exposición de bajo impacto por sí sola.

## 2. Resumen ejecutivo

| ID | Severidad | Hallazgo | Estado |
|---|---|---|---|
| SEC-01 | Alta | El formulario de restablecimiento acepta cualquier sesión válida | Confirmado |
| SEC-02 | Alta | Confirmación PayPhone dependiente del navegador, sin webhook/reconciliación durable | Confirmado |
| SEC-03 | Alta | El panel administrativo no exige MFA/AAL2 | Confirmado |
| SEC-04 | Alta | `dueno`, `admin` y `vendedor` reciben privilegios equivalentes | Confirmado |
| SEC-05 | Alta | JavaScript de terceros no fijado convive con credenciales de sesión legibles por JavaScript | Confirmado; explotación no observada |
| SEC-06 | Alta | Las migraciones locales no representan la base de producción | Confirmado |
| SEC-07 | Alta | Privilegios y privilegios predeterminados de Supabase son excesivamente amplios | Confirmado; RLS limita el impacto actual |
| SEC-08 | Media | La RPC PayPhone antigua permite omitir el recargo fijo | Confirmado |
| SEC-09 | Media | La página de resultado confía visualmente en parámetros de URL manipulables | Confirmado |
| SEC-10 | Media | Posible XSS persistente en JSON-LD de productos | Confirmado; requiere autor de catálogo comprometido/malicioso |
| SEC-11 | Media | La Data API anónima expone columnas internas innecesarias | Confirmado |
| SEC-12 | Media | Faltan CSP y varias cabeceras de seguridad | Confirmado en producción |
| SEC-13 | Media | No hay límites de frecuencia/cuotas de aplicación en operaciones sensibles | Confirmado |
| SEC-14 | Media | Enumeración de correos y endurecimiento de Auth incompleto | Parcialmente confirmado |
| SEC-15 | Media | El precio de venta física se acepta desde el cliente | Confirmado; depende de la política comercial |
| SEC-16 | Media | Límite global de 6 MB y validación insuficiente de imágenes/campos | Confirmado |
| SEC-17 | Media | No hay auditoría inmutable ni alertas de seguridad de aplicación | Confirmado en el código; retención externa por verificar |
| SEC-18 | Media | Dependencias vulnerables y CI de seguridad incompleto | Confirmado |
| SEC-19 | Baja | Errores internos de Supabase llegan al cliente | Confirmado |
| SEC-20 | Baja | Metadatos de despliegue y dominio canónico inconsistentes | Confirmado |

No se asignó severidad crítica. Eso no reduce la prioridad de SEC-01 a SEC-08: afectan cuentas privilegiadas, integridad monetaria o la capacidad de desplegar cambios de base de datos con seguridad.

## 3. Hallazgos detallados

### SEC-01 — Restablecimiento de contraseña con cualquier sesión válida

**Severidad: Alta — toma de cuenta después de robo de sesión.**

**Evidencia:** `src/components/shared/formulario-restablecer-contrasena.tsx:27-34` marca el formulario como listo al encontrar cualquier sesión mediante `getSession()`. Aunque también escucha `PASSWORD_RECOVERY`, esa señal no es obligatoria. En `:64` se ejecuta `updateUser({ password })`.

**Impacto:** una sesión normal robada por XSS, extensión maliciosa, equipo compartido o script de terceros puede abrir `/restablecer-contrasena` y fijar una contraseña nueva sin conocer la actual ni poseer un flujo de recuperación. Esto puede convertir un robo temporal de sesión en control persistente de la cuenta.

**Corrección:**

1. No habilitar el formulario por la mera existencia de una sesión.
2. Para recuperación, exigir una sesión/evento `PASSWORD_RECOVERY` válido y rechazar sesiones normales.
3. Para cambio voluntario de contraseña de un usuario autenticado, crear un flujo separado que exija reautenticación/contraseña actual o el nonce de reautenticación de Supabase.
4. Configurar en Supabase la exigencia de reautenticación para cambios de contraseña y probarla desde la API, no solo desde la interfaz.

**Criterio de cierre:** una sesión normal recibe rechazo; un enlace de recuperación válido permite un solo cambio; un token expirado/reutilizado falla; una sesión robada no puede fijar una contraseña nueva sin reautenticación.

### SEC-02 — PayPhone no tiene confirmación durable ni reconciliación

**Severidad: Alta — integridad de cobros, pedidos y stock.**

**Evidencia:** `src/app/api/pagos/payphone/retorno/route.ts` confirma y finaliza el pago únicamente cuando el navegador vuelve por GET desde PayPhone. La documentación de PayPhone indica que, si la transacción de Cajita no se confirma dentro de cinco minutos, se revierte automáticamente. El proveedor ofrece una notificación externa POST, pero no existe un webhook correspondiente en el proyecto.

Además:

- `descartar_intento_payphone_servidor` elimina pedido/intento pendiente cuando el navegador reporta cancelación o fallo;
- un cobro aprobado por el proveedor puede competir con esa eliminación antes de que llegue el retorno;
- la expiración se ejecuta al iniciar otro checkout, no mediante tarea periódica;
- no existe proceso de reconciliación de estados inciertos con PayPhone.

La finalización actual sí vuelve a consultar al proveedor, valida identificadores/monto/moneda y es transaccional e idempotente; esas defensas son correctas, pero no garantizan que el retorno ocurra.

**Corrección:**

1. Activar la notificación externa oficial de PayPhone y crear un endpoint POST autenticado.
2. Tratar webhook y retorno del navegador como señales hacia un único servicio idempotente de confirmación con PayPhone.
3. No eliminar inmediatamente un intento mientras el estado del proveedor sea incierto: usar `cancel_requested`, `failed`, `expired`, `approved` y conservar trazabilidad.
4. Ejecutar una tarea programada que reconcilie intentos pendientes y estados terminales con el proveedor.
5. Definir compensaciones explícitas para pago aprobado sin pedido, pedido sin pago, expiración y fallo de stock.
6. Registrar cada transición y alertar sobre estados incongruentes.

**Criterio de cierre:** cerrar el navegador después de pagar no pierde ni revierte silenciosamente una venta; eventos repetidos o desordenados no duplican cobros/pedidos; una cancelación concurrente no borra un pago aprobado; todos los pendientes terminan reconciliados.

Referencias oficiales: [Cajita de Pagos](https://docs.payphone.app/cajita-de-pagos) y [Notificación externa](https://docs.payphone.app/notificacion-externa).

### SEC-03 — Administración sin MFA/AAL2

**Severidad: Alta — compromiso de catálogo, inventario, pedidos y datos personales.**

**Evidencia:** `src/lib/supabase/proxy.ts:74-81` autoriza `/admin` con una sesión y un registro activo en `perfiles_admin`. Las políticas y RPC usan `private.es_admin()`, que comprueba usuario/rol, pero no el nivel de autenticación `aal2`. No existe alta, desafío o recuperación MFA en la aplicación.

**Impacto:** una contraseña o sesión administrativa comprometida basta para acceder a PII de clientes, cambiar precios/stock, administrar pedidos y registrar ventas.

**Corrección:**

1. Habilitar TOTP y flujo de enrolamiento/recuperación para personal.
2. Exigir `aal2` en el proxy y, de forma independiente, en RLS/RPC sensibles mediante el claim `aal`.
3. Impedir que una comprobación solo de interfaz sea la defensa final.
4. Exigir reautenticación para cambio de roles, exportaciones, cancelaciones, ajustes de stock y otras acciones de alto impacto.

**Criterio de cierre:** una sesión administrativa `aal1` no puede leer ni mutar recursos sensibles ni invocar RPC privilegiadas; `aal2` sí puede; los códigos de recuperación se gestionan con procedimiento controlado.

Referencia: [Supabase Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa).

### SEC-04 — Roles administrativos sin separación real

**Severidad: Alta — violación de mínimo privilegio y exposición futura de PII.**

**Evidencia:** la función desplegada `private.es_admin()` considera equivalentes los roles activos `dueno`, `admin` y `vendedor`. Server Actions y proxy solo validan la presencia de un perfil activo. Por tanto, un futuro `vendedor` puede acceder a las mismas funciones, pedidos, datos de clientes, catálogo y exportaciones que el propietario.

Actualmente los dos perfiles administrativos activos son `dueno`; el riesgo es latente, pero el modelo ya contiene roles que sugieren delegación futura.

**Corrección:** sustituir el booleano global por capacidades explícitas, por ejemplo `catalog.write`, `orders.read`, `orders.update`, `sales.create`, `inventory.export`, `users.read`, `roles.manage`. Aplicarlas en RLS/RPC y luego en la interfaz. Un vendedor no debe recibir PII completa ni administración de roles por defecto.

**Criterio de cierre:** matriz de permisos aprobada; pruebas por rol que demuestran denegación tanto vía UI como llamada REST/RPC directa; solo el propietario puede gestionar roles y operaciones de máxima sensibilidad.

### SEC-05 — Scripts de terceros con acceso al contexto de sesión

**Severidad: Alta — riesgo de cadena de suministro y robo de sesión.**

**Evidencia:** `src/components/home/seccion-noticias-instagram.tsx:35` carga `https://elfsightcdn.com/platform.js` sin versión ni integridad. Checkout carga JavaScript/CSS de PayPhone y hCaptcha también ejecuta código externo. La configuración actual de Supabase SSR necesita cookies de autenticación accesibles a JavaScript (`httpOnly: false` en las opciones instaladas), por lo que cualquier XSS o script externo comprometido que ejecute en el origen puede leer tokens o actuar con la sesión. No hay CSP que limite carga, conexión o ejecución.

El token de Cajita PayPhone entregado al navegador forma parte del diseño de esa integración; no se clasifica por sí solo como secreto filtrado. Debe quedar limitado al dominio registrado y separado de credenciales servidoras.

**Corrección:**

1. Eliminar Elfsight si no es esencial; preferir datos renderizados en servidor o un iframe con `sandbox` y origen separado.
2. Cargar PayPhone únicamente en checkout y hCaptcha únicamente donde sea necesario.
3. Fijar versiones y SRI cuando el proveedor lo permita; documentar excepciones cuando el script cambie dinámicamente.
4. Implementar una CSP estricta y revisar `script-src`, `connect-src`, `frame-src`, `img-src` y `style-src` para PayPhone, hCaptcha, YouTube, Cloudinary y cualquier widget conservado.
5. Mantener tokens servidor (`SUPABASE_SECRET_KEY`, API secret de Cloudinary y credenciales privadas de PayPhone) fuera del cliente y con rotación definida.

**Criterio de cierre:** inventario aprobado de terceros; ningún script no esencial ejecuta en páginas autenticadas; CSP bloquea orígenes no autorizados; una prueba de compromiso del widget no permite leer/usar la sesión principal.

### SEC-06 — Deriva crítica entre migraciones y producción

**Severidad: Alta — riesgo de omitir o revertir controles de seguridad.**

**Evidencia:** Supabase registra 28 migraciones en producción, mientras `supabase/migrations/` contiene 12 archivos. Solo las primeras cuatro versiones locales coinciden exactamente con versiones desplegadas; ocho cambios tienen nombres similares pero versiones distintas, y dieciséis migraciones históricas no existen localmente.

**Impacto:** un `db push`, recuperación de desastre, entorno de pruebas nuevo o cambio futuro puede fallar, duplicar objetos o levantar un esquema sin las correcciones actuales de checkout, RLS, `search_path`, variantes, PayPhone o extensiones.

**Corrección:** congelar cambios de esquema hasta reconciliar el historial; extraer/baselinear el estado real; reparar el historial con las herramientas oficiales de Supabase; validar en un proyecto efímero desde cero; añadir CI que compare migraciones y genere un diff vacío contra el esquema esperado.

**Criterio de cierre:** un entorno vacío reconstruido solo con el repositorio coincide con producción en tablas, funciones, grants, RLS, vistas, triggers e índices; `supabase migration list` no presenta divergencias.

### SEC-07 — Privilegios SQL y valores predeterminados demasiado amplios

**Severidad: Alta — fallo sistémico de mínimo privilegio.**

**Evidencia:** en el esquema público, muchas tablas conservan privilegios amplios para `anon` y `authenticated` (incluidos INSERT/UPDATE/DELETE) y los privilegios predeterminados del propietario conceden acceso a futuras tablas, secuencias y funciones. RLS está habilitado en las 16 tablas públicas y hoy bloquea mutaciones no autorizadas, pero cada objeto nuevo depende de que su política sea perfecta desde el primer momento.

Los asesores también muestran que `authenticated` puede ejecutar tres funciones `SECURITY DEFINER` de checkout. Dos son puntos de entrada intencionales; la función histórica indicada en SEC-08 no debería seguir expuesta. Las tablas privadas de intentos y reservas no conceden acceso a `anon`/`authenticated`, lo cual es correcto.

**Corrección:**

1. Revocar privilegios predeterminados amplios y conceder solo los necesarios por objeto/columna.
2. Exponer lectura pública a través de vistas `security_invoker` curadas.
3. Mover auxiliares de checkout a `private` y dejar una única RPC pública autenticada.
4. Añadir una prueba de CI que falle si una tabla nueva no tiene RLS o si recibe grants inesperados.
5. Documentar las excepciones intencionales de `SECURITY DEFINER`, con `search_path` fijo y pruebas de autorización.

**Criterio de cierre:** una tabla nueva no es accesible por `anon`/`authenticated` sin grant explícito; la matriz real de grants coincide con una especificación versionada; no existen funciones públicas ejecutables accidentalmente.

Referencias: [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) y [Securing your API](https://supabase.com/docs/guides/api/securing-your-api).

### SEC-08 — Bypass del recargo PayPhone mediante RPC histórica

**Severidad: Media — integridad monetaria.**

**Evidencia:** la aplicación llama a `crear_pedido_payphone_con_recargo`, pero producción todavía concede a `authenticated` ejecución sobre `public.crear_pedido_payphone(payload)`. Un usuario puede invocar directamente la función anterior con su JWT y crear un intento/pedido válido sin los 45 centavos añadidos por la envoltura nueva.

**Corrección:** revocar inmediatamente `EXECUTE` de `authenticated`, `anon` y `public` sobre la RPC histórica; moverla a `private` como auxiliar o integrar toda la lógica en una única función pública; probar la llamada REST directa con usuario autenticado.

**Criterio de cierre:** solo existe un punto de entrada autenticado para PayPhone y todos los pedidos PayPhone calculan el recargo en base de datos.

### SEC-09 — “Pago confirmado” controlado por la URL

**Severidad: Media — engaño al usuario y evidencia visual falsa.**

**Evidencia:** `src/app/checkout/resultado/page.tsx:48-61` calcula `approved` desde `?estado=aprobado` y muestra “Pago confirmado” y el código entregado por la URL. La consulta posterior verifica el pedido solo para limpiar carrito/favoritos, no para decidir el mensaje principal.

**Impacto:** cualquiera puede fabricar un enlace o captura que aparente un pago aprobado. Esto no cambia la base de datos, pero puede confundir al comprador o al personal si se acepta una captura como prueba.

**Corrección:** derivar estado, código y monto desde un pedido propio consultado en base de datos; ante pedido inexistente/no propio/estado incierto, mostrar error o verificación pendiente. El panel administrativo debe ser la única fuente operativa de verdad.

**Criterio de cierre:** parámetros inventados nunca producen una pantalla de éxito; las pruebas cubren pedido ajeno, inexistente, pendiente, cancelado y aprobado.

### SEC-10 — XSS persistente en JSON-LD de producto

**Severidad: Media — ejecución de JavaScript con una cuenta de catálogo comprometida.**

**Evidencia:** `src/components/shared/producto-json-ld.tsx:35` inserta `JSON.stringify(jsonLd)` mediante `dangerouslySetInnerHTML`. `JSON.stringify` no escapa `<`; un campo de producto con `</script><script>…` puede cerrar el bloque y ejecutar código. `src/components/shared/negocio-local-json-ld.tsx:47` usa el mismo patrón, aunque sus datos actuales son estáticos.

**Corrección:** usar un serializador seguro que, como mínimo, convierta `<` en `\u003c` y escape separadores Unicode problemáticos; centralizarlo para todos los JSON-LD; validar/limitar campos de catálogo; añadir una prueba de regresión con `</script>`.

**Criterio de cierre:** el payload queda dentro del JSON-LD, no crea un segundo elemento `script` y una CSP estricta lo bloquea como defensa adicional.

### SEC-11 — Exposición anónima de columnas internas

**Severidad: Media — minimización de datos y metadatos internos.**

**Evidencia verificada mediante la clave publicable:** la Data API permite leer directamente en productos activos `creado_por` y `actualizado_por`, y en imágenes activas `cloudinary_signature`, `creado_por` y `actualizado_por`. Las vistas administrativas respetaron RLS y no devolvieron pedidos anónimos.

Las firmas de respuesta de Cloudinary no equivalen a su API secret, pero no son necesarias para el catálogo público. Los UUID de autores facilitan correlación y aumentan superficie informativa.

**Corrección:** revocar lectura anónima de tablas base y servir el catálogo con vistas `security_invoker` que enumeren solo columnas públicas; alternativamente, usar grants de columna estrictos. Revisar toda respuesta pública con un inventario de datos permitido.

**Criterio de cierre:** una petición REST anónima no puede seleccionar columnas internas aunque conozca su nombre; el catálogo sigue funcionando únicamente con el contrato público.

### SEC-12 — Cabeceras y CSP incompletas

**Severidad: Media — falta defensa en profundidad frente a XSS, clickjacking y MIME sniffing.**

**Evidencia en producción:** se observan HSTS de Vercel y redirección HTTP→HTTPS, pero `next.config.ts:11` solo define `Referrer-Policy`. No se observaron CSP, `X-Content-Type-Options`, `Permissions-Policy` ni protección explícita de framing. También se publica `X-Powered-By: Next.js`.

**Corrección:** desplegar primero `Content-Security-Policy-Report-Only`, observar violaciones y luego aplicar CSP. Incluir al menos `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors`, `form-action`, y listas mínimas para los proveedores conservados. Añadir `X-Content-Type-Options: nosniff`, `Permissions-Policy`, una política de framing y `poweredByHeader: false`. Probar PayPhone, hCaptcha, YouTube y Cloudinary antes de bloquear.

**Criterio de cierre:** escáner de cabeceras aprobado; no hay violaciones inesperadas; checkout y captcha continúan operando; un origen no autorizado no puede ejecutar ni enmarcar la aplicación.

### SEC-13 — Sin rate limiting ni cuotas de negocio

**Severidad: Media — abuso, spam y costos.**

**Evidencia:** no hay límites por usuario/IP ni idempotency keys para creación de pedidos/intentos PayPhone, búsquedas, endpoints de sesión, direcciones, cambios de perfil o acciones de escritura. El checkout limita a 50 ítems por pedido, pero no el número de pedidos o intentos.

**Corrección:** aplicar límites en el borde y/o almacén durable por IP/usuario; limitar pendientes activos, direcciones e intentos; usar idempotency keys en checkout; añadir backoff y alertas; conservar límites de Supabase Auth y verificar hCaptcha del lado de Supabase.

**Criterio de cierre:** pruebas automáticas demuestran `429`/rechazo controlado, los reintentos legítimos son idempotentes y el límite no puede eludirse cambiando solo parámetros del cliente.

### SEC-14 — Enumeración y configuración de Auth por endurecer

**Severidad: Media.**

**Evidencia:** `src/components/shared/panel-inicio-sesion.tsx:59-60,237` detecta `identities.length === 0` y revela expresamente que el correo ya existe. La protección de contraseñas filtradas aparece deshabilitada en el asesor de Supabase. La interfaz exige longitud/complejidad, pero los mínimos del servidor, la exigencia del secreto hCaptcha, la reautenticación y políticas de sesión no son verificables desde el endpoint público. La confirmación de correo sí está habilitada.

**Corrección:** respuesta genérica para registro/recuperación; habilitar protección de contraseñas filtradas si el plan lo soporta; fijar mínimo y complejidad en Auth; comprobar hCaptcha servidor; configurar reautenticación y sesiones acordes al riesgo; alertar sobre intentos anómalos.

**Criterio de cierre:** la respuesta observable es equivalente para correo existente/no existente; contraseñas débiles o filtradas fallan mediante llamada directa a Auth; captcha ausente/inválido se rechaza.

Referencia: [Supabase Password Security](https://supabase.com/docs/guides/auth/password-security).

### SEC-15 — Venta física confía en precio enviado por cliente

**Severidad: Media — fraude interno o error de caja.**

**Evidencia:** `src/app/admin/ventas-fisicas/acciones.ts:54-59` envía `price: item.price` a `registrar_venta_fisica`; la RPC acepta ese valor. La interfaz permite editarlo. Con el RBAC actual, cualquier rol administrativo futuro puede reducirlo.

**Corrección:** decidir la política comercial. Si no se permiten descuentos, calcular precio vigente en DB. Si se permiten, exigir permiso específico, límite de descuento/precio mínimo, motivo obligatorio y auditoría; para excepciones grandes, aprobación del propietario.

**Criterio de cierre:** manipular el request no permite un precio fuera de política; todo override conserva actor, precio original, precio aplicado, motivo y aprobación.

### SEC-16 — Entradas y cargas insuficientemente acotadas

**Severidad: Media — abuso de recursos, costos y datos fuera de contrato.**

**Evidencia:** `next.config.ts:27` eleva globalmente Server Actions a 6 MB. `src/app/admin/productos/acciones.ts:172-177` solo comprueba que cada elemento sea `File` y tenga tamaño positivo antes de Cloudinary; no impone en servidor número, tamaño individual, MIME por contenido, dimensiones o cuota. También faltan límites uniformes de longitud/cantidad para diversos textos, variantes, direcciones y perfiles.

Cloudinary con `resource_type: image` aporta validación adicional, pero no sustituye cuotas y validación de negocio, especialmente cuando existan roles delegados.

**Corrección:** reducir el límite global; aislar carga de archivos; validar magic bytes/MIME, extensión, tamaño, dimensiones y cantidad; aplicar cuotas; establecer límites Zod y `CHECK` en DB; normalizar texto y rechazar payloads excesivos antes de llamadas externas.

**Criterio de cierre:** archivos no-imagen, bombas de tamaño/dimensiones, lotes excesivos y campos fuera de límite fallan sin generar recursos en Cloudinary ni escrituras parciales.

### SEC-17 — Auditoría y monitoreo insuficientes

**Severidad: Media — baja detección y trazabilidad.**

**Evidencia:** no existe un registro de auditoría inmutable para accesos/cambios sensibles, roles, precios, stock, PII, pedidos y transiciones de pagos. Tampoco se observó lógica de alertas para fallos administrativos, anomalías de checkout o discrepancias PayPhone. La retención y exportación de logs de Supabase/Vercel requieren verificación en sus paneles.

**Corrección:** tabla privada append-only con actor, acción, objeto, resultado, correlación y metadatos mínimos; nunca almacenar tokens o PII completa en logs; enviar eventos críticos a monitoreo con retención; alertar sobre cambios de rol, múltiples fallos, overrides, discrepancias de pago y uso de `service_role`; preparar runbook de incidente.

**Criterio de cierre:** cada acción crítica se puede atribuir; un administrador normal no puede alterar el log; una simulación genera alerta y permite reconstruir la secuencia sin revelar secretos.

### SEC-18 — Cadena de suministro y CI de seguridad incompletos

**Severidad: Media — dependencias conocidas y prevención insuficiente.**

`pnpm audit` reportó 0 críticas, 0 altas, 2 moderadas y 1 baja:

| Paquete | Ruta | Riesgo contextual | Versión corregida |
|---|---|---|---|
| `postcss@8.4.31` | transitiva de Next | XSS al procesar CSS controlado/malicioso; el proyecto compila CSS confiable, por lo que la exposición actual es baja | `>=8.5.10` |
| `js-yaml@4.1.1` | ESLint | DoS al parsear YAML atacante; ruta de desarrollo, no runtime | `>=4.2.0` |
| `@babel/core@7.29.0` | ESLint/Next | lectura de sourcemap al compilar código atacante; no se compila código de usuarios | `>=7.29.6` |

Next `16.2.10` todavía declara la rama vulnerable de PostCSS; no basta con actualizar Next sin verificar el árbol. El workflow usa `actions/checkout@v4`, `pnpm/action-setup@v4` y `actions/setup-node@v4` por etiqueta, no SHA. CI ejecuta lint, tipos y pruebas, pero no build, audit, SAST, secret scanning ni validación de migraciones. Dependabot semanal sí está configurado y `contents: read` limita permisos.

**Corrección:** probar upgrades/overrides compatibles en una rama, sin imponer transitivas a ciegas; fijar Actions por SHA; añadir build, audit con política de severidad, CodeQL/SAST, escaneo de secretos, revisión de migraciones y pruebas de seguridad; proteger `main` y exigir revisiones/CI.

**Criterio de cierre:** audit sin vulnerabilidades aceptadas o con excepción documentada/fecha; Actions inmutables; PR malicioso o migración insegura falla en CI; protección de rama verificada.

### SEC-19 — Mensajes internos expuestos

**Severidad: Baja.**

Varias Server Actions retornan o lanzan `error.message` de Supabase, por ejemplo `src/app/admin/marcas/acciones.ts:64,94,117`, `src/app/mi-cuenta/acciones.ts:66,303,336` y múltiples ramas de productos. Esto puede revelar nombres, restricciones o detalles de políticas.

**Corrección:** respuestas públicas con códigos/mensajes estables; detalle técnico sanitizado solo en logs del servidor con ID de correlación.

### SEC-20 — Metadatos de despliegue inconsistentes

**Severidad: Baja.**

Producción publica `X-Powered-By: Next.js`. El `robots.txt` del dominio principal referencia un sitemap en `https://pesca-con-fe.vercel.app`, señal de que `NEXT_PUBLIC_SITE_URL` no está alineado con el dominio canónico. No compromete datos directamente, pero revela tecnología y puede causar enlaces/orígenes incoherentes.

**Corrección:** definir `NEXT_PUBLIC_SITE_URL=https://pescaconfe.com` en producción, verificar sitemap/canonical/redirects y desactivar `poweredByHeader`.

## 4. Controles positivos comprobados

Estos controles deben preservarse durante la remediación:

- `crear_pedido_web` ya calcula precios, descuentos, envío y total en base de datos; no confía en precios del navegador.
- El checkout valida producto/variante activa, stock, dirección propia y máximo de 50 ítems; persiste variante, nombre y SKU.
- Las 16 tablas públicas tienen RLS habilitado.
- `private.intentos_pago` y `private.reservas_stock` no conceden acceso de tabla a `anon`/`authenticated`.
- Las cinco vistas públicas revisadas usan `security_invoker=true`.
- Funciones sensibles tienen `search_path` fijo y `citext` reside en `extensions`.
- Las claves servidoras están en módulos `server-only`; no se observaron bajo prefijos `NEXT_PUBLIC_*`.
- Los valores exactos de los secretos locales actuales no aparecieron en el historial Git local inspeccionado.
- La confirmación PayPhone actual vuelve a consultar al proveedor y valida transacción, cliente, monto y moneda; la finalización es transaccional e idempotente.
- Confirmación de correo de Supabase está habilitada y hCaptcha está integrado en la interfaz.
- El retorno después de login restringe redirecciones al prefijo `/admin`.
- HTTPS, redirección desde HTTP y HSTS están activos.
- No existen buckets de Supabase Storage ni Edge Functions desplegadas, reduciendo superficie.
- Lockfile, Dependabot y permisos mínimos `contents: read` están presentes.
- Lint, tipos, pruebas y build pasan en la revisión actual.

## 5. Secretos y datos sensibles

Se identificaron variables para Supabase, Cloudinary, PayPhone y hCaptcha. Los archivos `.env*` están ignorados y no se encontraron los valores exactos actuales de `SUPABASE_SECRET_KEY`, `PAYPHONE_TOKEN`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_API_KEY` o `PAYPHONE_STORE_ID` en revisiones Git locales.

Limitaciones: esto no sustituye un escáner histórico especializado ni verifica forks, caches, logs de CI, artefactos, Vercel o secretos antiguos ya rotados.

Acciones requeridas:

1. activar secret scanning y push protection en GitHub;
2. ejecutar Gitleaks/TruffleHog en CI e historial completo;
3. inventariar propietario, alcance, fecha y rotación de cada secreto;
4. restringir Cloudinary por preset/carpeta/tipo/cuota y PayPhone por dominio/entorno;
5. rotar inmediatamente cualquier credencial que aparezca en un log, issue, artefacto o commit, incluso si luego se borró.

## 6. Controles que deben verificarse en paneles externos

No fue posible confirmar los siguientes puntos con el repositorio y APIs disponibles. Deben formar parte del cierre de seguridad:

- backups automáticos, restauración probada y PITR de Supabase;
- política de longitud/complejidad, captcha secreto, reautenticación y duración de sesión de Supabase Auth;
- activación de protección de contraseñas filtradas y disponibilidad según plan;
- notificación externa PayPhone activada, dominios permitidos y credenciales separadas entre pruebas/producción;
- rotación/restricciones de Cloudinary y límites de consumo;
- WAF/rate limiting, retención de logs y alertas de Vercel;
- branch protection, required reviews, CodeQL, Dependabot alerts, secret scanning y push protection de GitHub;
- retención, borrado/exportación de PII, respuesta a solicitudes del titular y procedimiento de incidente;
- restauración de una copia en un entorno aislado y tiempos RPO/RTO aceptados.

## 7. Plan integral de remediación

### Fase 0 — Contención inmediata (0–48 horas)

| Acción | Hallazgos | Responsable sugerido | Evidencia de cierre |
|---|---|---|---|
| Bloquear cambio de contraseña desde sesión normal y separar recuperación/cambio autenticado | SEC-01 | Frontend + Auth | Pruebas de sesión normal, recovery válido, expirado y reutilizado |
| Revocar ejecución de `crear_pedido_payphone` a usuarios y dejar una sola RPC pública | SEC-07, SEC-08 | Backend/DB | Matriz de grants y prueba REST directa denegada |
| Escapar JSON-LD y añadir payload de regresión | SEC-10 | Frontend | Test con `</script>` y revisión DOM |
| Validar el pedido real antes de mostrar “Pago confirmado” | SEC-09 | Frontend/Backend | Casos ajeno/inexistente/pendiente/aprobado |
| Congelar migraciones, generar backup y documentar el estado real antes de modificar DB | SEC-06 | DB/DevOps | Backup verificable y listado de divergencias aprobado |
| Revisar cuentas administrativas activas, cerrar sesiones innecesarias y rotar credenciales sospechosas | SEC-03, SEC-05 | Propietario | Inventario firmado; no implica rotar claves sin evidencia |

### Fase 1 — Controles de máximo impacto (días 3–7)

| Acción | Hallazgos | Evidencia de cierre |
|---|---|---|
| Implementar webhook PayPhone, máquina de estados idempotente, cron y reconciliación | SEC-02 | Pruebas de pérdida del navegador, duplicado, desorden, timeout y carrera de cancelación |
| Implementar MFA y exigir AAL2 en proxy, RLS y RPC | SEC-03 | Matriz de pruebas `aal1` denegado / `aal2` permitido |
| Definir capacidades por rol y aplicar mínimo privilegio | SEC-04, SEC-15 | Pruebas directas UI/REST/RPC para dueño, admin y vendedor |
| Reconciliar las 28 migraciones, baseline y reconstrucción desde cero | SEC-06 | Proyecto efímero idéntico y diff vacío |
| Corregir ACL/default privileges, mover auxiliares a `private` y crear vistas públicas curadas | SEC-07, SEC-11 | Auditoría de grants y selección anónima negativa de columnas internas |
| Retirar/aislar Elfsight y reducir scripts de terceros | SEC-05 | Inventario de terceros y prueba de aislamiento |

### Fase 2 — Endurecimiento completo (semanas 2–3)

| Acción | Hallazgos | Evidencia de cierre |
|---|---|---|
| Desplegar CSP Report-Only, ajustar proveedores y luego aplicar CSP + cabeceras | SEC-05, SEC-10, SEC-12, SEC-20 | Reportes limpios y pruebas E2E de pagos/captcha/media |
| Añadir rate limiting, cuotas e idempotency keys | SEC-13 | Pruebas de abuso y reintento legítimo |
| Endurecer Supabase Auth y eliminar enumeración | SEC-01, SEC-03, SEC-14 | Pruebas directas contra API y revisión de panel |
| Validar cargas y todos los límites de entrada en servidor/DB | SEC-16 | Suite de archivos y payloads hostiles |
| Aplicar política de precios/overrides de venta física | SEC-04, SEC-15 | Pruebas de límite, permiso, motivo y auditoría |
| Crear auditoría inmutable, métricas, alertas y runbook | SEC-02, SEC-17, SEC-19 | Simulación de incidente y correlación completa |
| Actualizar dependencias, fijar Actions y ampliar CI | SEC-06, SEC-07, SEC-18 | Audit/CodeQL/secret scan/build/migraciones obligatorios en PR |
| Normalizar errores públicos | SEC-19 | Snapshots de respuestas sin detalle interno |

### Fase 3 — Operación continua

- revisión trimestral de RLS, grants, funciones `SECURITY DEFINER` y cuentas privilegiadas;
- parcheo semanal con Dependabot y SLA: crítica 24 h, alta 72 h, media 14 días;
- restauración de backup al menos trimestral;
- rotación periódica y ante cualquier sospecha;
- revisión anual de proveedores y tratamiento de PII;
- pentest externo después de cerrar Fases 0–2 y antes de ampliar roles administrativos;
- ejercicios de respuesta a incidente y reconciliación de pagos.

## 8. Suite mínima de seguridad para impedir regresiones

Añadir a CI:

1. **Auth:** sesión normal no restablece contraseña; recovery expirado/reutilizado falla; MFA AAL1/AAL2.
2. **Autorización:** matriz por rol sobre cada tabla, vista, RPC y Server Action sensible.
3. **RLS/grants:** toda tabla pública tiene RLS; no hay default grants inesperados; auxiliares no son ejecutables.
4. **Checkout:** el cliente no decide precio, descuento, envío, recargo, stock ni propietario de dirección.
5. **PayPhone:** webhook/retorno duplicado, desordenado, perdido, cancelado, monto incorrecto y concurrencia.
6. **XSS/CSP:** `</script>` en todos los campos de catálogo; orígenes no permitidos bloqueados.
7. **Datos públicos:** snapshot de columnas exactas accesibles con rol anónimo.
8. **Archivos:** MIME falso, magic bytes inválidos, archivo grande, demasiados archivos y dimensiones extremas.
9. **Abuso:** límites de pedidos, direcciones, búsquedas, login y callbacks.
10. **Supply chain:** `pnpm audit`, SAST/CodeQL, Gitleaks, Actions fijadas y build de producción.
11. **Migraciones:** levantar una DB vacía, aplicar todas las migraciones y comparar schema/grants/RLS.
12. **Cabeceras:** prueba automática de CSP, HSTS, nosniff, framing y Permissions-Policy.

## 9. Orden de aceptación y salida a producción

No considerar cerrada la auditoría solo porque se haya modificado el código. Para cada hallazgo se requiere:

1. cambio versionado y revisado por otra persona;
2. prueba negativa que demuestre que el ataque ya no funciona;
3. prueba positiva que preserve el flujo legítimo;
4. migración reversible o plan de recuperación;
5. despliegue controlado con observabilidad;
6. evidencia adjunta al issue correspondiente;
7. reauditoría final de grants, RLS, cabeceras, dependencias y producción.

La salida segura mínima exige cerrar **SEC-01 a SEC-12** y tener controles compensatorios documentados para cualquier elemento restante. Debido al uso de datos personales y pagos, SEC-13 a SEC-20 también deben completarse; no deben convertirse en excepciones permanentes.

## 10. Nota sobre el archivo

`.gitignore:13-14` excluye `/docs/` y `/docs/*`. Este informe existe en el workspace, pero **Git no lo incluirá** mientras se mantengan esas reglas. Si el documento debe quedar versionado, será necesario ajustar `.gitignore` o añadir una excepción explícita en una tarea separada.
