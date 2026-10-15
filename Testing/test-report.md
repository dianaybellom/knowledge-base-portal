# Informe de pruebas: Knowledge Base Portal

Pruebas manuales del prototipo (Fase 4). La especificación de la API está en [`Backend/API.md`](../Backend/API.md) y la guía de la interfaz, en [`Frontend/README.md`](../Frontend/README.md).

- **Fecha de ejecución de las pruebas de API:** 15 de octubre de 2026.
- **Entorno:** backend en local (`http://localhost:3000/api`) con la base de datos PostgreSQL de Neon y Neon Object Storage, después de `npm run db:seed`.
- **Herramienta:** `curl` desde la terminal. La colección de Postman cubre los mismos flujos.
- **Datos de prueba:** cuentas `qa.*@example.com` y una solución con código `qa-test-<marca de tiempo>`. Todo se eliminó al terminar (se comprobó que no quedan usuarios `qa.` y que la solución responde 404).

## Cómo correr la colección de Postman

Archivo: [`Testing/knowledge-portal.postman_collection.json`](knowledge-portal.postman_collection.json).

1. Levanta el backend (`npm run dev` en `Backend/`; ver el [README principal](../README.md)).
2. En Postman: **Import → File** y elige el archivo de la colección.
3. Abre la colección, pestaña **Variables**, y completa en la columna *Current value*:
   - `adminEmail` y `adminPassword`: las credenciales `ADMIN_EMAIL` y `ADMIN_PASSWORD` de tu `.env`.
   - `baseUrl` ya vale `http://localhost:3000/api`; cámbialo solo si usas otro puerto.
4. Ejecuta **1. Auth → Login (admin)**. El token se guarda en `token` y la colección lo usa como *Bearer* en todas las peticiones.
5. En **6. Componentes → Subir componente con archivo**, pestaña *Body*, elige un archivo (máx. 50 MB) en el campo `file`.
6. Ejecuta las carpetas en orden (1 a 7), una petición a la vez o con **Run collection**. Cada petición tiene *tests* que validan el código y los datos de la respuesta.

Notas:
- **Register** genera un correo aleatorio en cada ejecución y guarda el token del consultor en `consultantToken`, que se usa en **2. Permisos (403)** sin reemplazar la sesión del admin.
- Las peticiones que crean recursos guardan sus identificadores (`solutionCode`, `componentId`, `userId`, `downloadUrl`); la carpeta **7. Limpieza** borra la solución y el usuario de prueba.
- Si una ejecución anterior se interrumpió antes de **7. Limpieza**, **Crear solución** responderá 409 porque `postman-test-solution` ya existe. Ejecuta primero **7. Limpieza → Eliminar solución**.

## Casos de prueba

Convención: **A** = aprobado, **F** = fallido. En las pruebas de API, "Resultado obtenido" registra el código HTTP y el mensaje reales devueltos por el servidor.

### 1. Ingreso de datos y validaciones

| ID | Categoría | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| VAL-01 | Validaciones | Registro con campos vacíos | `POST /auth/register` con `{}` | 400 `"Datos no válidos."` con un detalle por campo | **A**. 400 `"Datos no válidos."`: `fullName` "El nombre es obligatorio.", `email` "El correo es obligatorio.", `password` "La contraseña es obligatoria." |
| VAL-02 | Validaciones | Registro con email inválido | `POST /auth/register` con `email: "correo-invalido"` | 400 con error en `email` | **A**. 400, `email`: "Ingresa un correo válido." |
| VAL-03 | Validaciones | Registro con contraseña corta | `POST /auth/register` con `password` de 7 caracteres | 400 con error en `password` | **A**. 400, `password`: "La contraseña debe tener al menos 8 caracteres." |
| VAL-04 | Validaciones | Registro con email duplicado | Registrar dos veces el mismo correo | 409 | **A**. 409 "Ya existe una cuenta con ese correo." |
| VAL-05 | Validaciones | Email duplicado con distinta capitalización | Registrar el mismo correo en MAYÚSCULAS | 409 (el correo se guarda en minúsculas) | **A**. 409 "Ya existe una cuenta con ese correo." |
| VAL-06 | Validaciones | Ingreso con campos vacíos | `POST /auth/login` con `email` y `password` vacíos | 400 con errores en ambos campos | **A**. 400: `email` "El correo es obligatorio." y "Ingresa un correo válido.", `password` "La contraseña es obligatoria." *Observación: el correo vacío devuelve dos mensajes.* |
| VAL-07 | Validaciones | JSON mal formado | `POST /auth/login` con un cuerpo JSON incompleto | 400 | **A**. 400 "El cuerpo de la petición no es un JSON válido." |
| VAL-08 | Validaciones | `code` con formato inválido | `POST /solutions` (autor) con `code: "Mi Solucion"` | 400 con error en `code` | **A**. 400, `code`: "El código solo admite minúsculas, números y guiones simples (ejemplo: accessibility-assistant)." |
| VAL-09 | Validaciones | `code` duplicado | `POST /solutions` dos veces con el mismo `code` | 409 | **A**. 409 "Ya existe una solución con el código \"qa-test-…\"." |
| VAL-10 | Validaciones | Solución sin campos obligatorios | `POST /solutions` solo con `code` | 400 con un detalle por campo faltante | **A**. 400: "El nombre es obligatorio.", "El tipo no es válido. Valores permitidos: addon, plugin, integration.", "El resumen es obligatorio.", "La descripción es obligatorio." *Observación: falta de concordancia ("La descripción es obligatorio").* |
| VAL-11 | Validaciones | Más de un PO | `POST /solutions` con dos `members` de rol `po` | 400 en `members` | **A**. 400, `members`: "Solo puede haber un PO por solución." |
| VAL-12 | Validaciones | Tipo de solución inválido | `POST /solutions` con `type: "app"` | 400 en `type` | **A**. 400, `type`: "El tipo no es válido. Valores permitidos: addon, plugin, integration." |
| VAL-13 | Validaciones | Intentar cambiar el `code` | `PUT /solutions/:code` con otro `code` en el cuerpo | 400 | **A**. 400 "El código de una solución no se puede modificar." |
| VAL-14 | Validaciones | Iframe de dominio no permitido | `PUT /solutions/:code/documents/technical` con un iframe de `player.vimeo.com` | 400 que indique el dominio rechazado | **A**. 400, `content`: "El video de \"player.vimeo.com\" no está permitido. Usa el código para insertar de YouTube o de SharePoint." |
| VAL-15 | Validaciones | Iframe sin `title` | Igual que VAL-14 con un iframe de YouTube sin `title` | 400 que indique el `title` faltante | **A**. 400, `content`: "El video necesita un atributo title que lo describa (se usa en lectores de pantalla)." |
| VAL-16 | Validaciones | Sección vacía | `PUT …/documents/technical` con `content: "   "` | 400 | **A**. 400, `content`: "El contenido es obligatorio." |
| VAL-17 | Validaciones | Sección de más de 200 000 caracteres | `PUT …/documents/technical` con 200 001 caracteres | 400 | **A**. 400, `content`: "El contenido no puede superar 200.000 caracteres." |
| VAL-18 | Validaciones | Tipo de sección inexistente | `PUT …/documents/manual` | 400 con los tipos permitidos | **A**. 400 "El tipo de sección no es válido. Valores permitidos: technical, release-notes, user-guide, fact-sheet." |
| VAL-19 | Validaciones | Componente sin nombre ni versión | `POST /solutions/:code/components` con `name` y `version` vacíos | 400 con errores en ambos campos | **A**. 400: "El nombre del componente es obligatorio.", "La versión es obligatorio." *Observación: falta de concordancia ("La versión es obligatorio").* |
| VAL-20 | Validaciones | Rol de usuario inválido | `PATCH /users/:id/role` (admin) con `role: "superuser"` | 400 | **A**. 400, `role`: "El rol no es válido. Valores permitidos: consultant, author, admin." |
| VAL-21 | Validaciones | Filtro de tipo inválido | `GET /solutions?type=foo` | 400 | **A**. 400, `type`: "El tipo no es válido. Valores permitidos: addon, plugin, integration." |
| VAL-22 | Validaciones | Límite fuera de rango | `GET /solutions/recent-updates?limit=50` | 400 | **A**. 400, `limit`: "El límite máximo es 20." |
| VAL-23 | Validaciones | Cuerpo JSON de más de 1 MB | `PUT …/documents/technical` con un JSON de 1,1 MB | 413 con un mensaje en español que explique el límite | **A** (tras la corrección). 413 "El contenido enviado supera el tamaño máximo de 1 MB." En la primera ejecución respondió 500 (ver *Fallo corregido*). |
| VAL-24 | Validaciones | Archivo de más de 50 MB | `POST /solutions/:code/components` con un archivo de 50 MB + 1 byte | 413 | **A**. 413 "El archivo supera el tamaño máximo de 50 MB." |
| VAL-25 | Validaciones | Identificador mal formado | `GET /components/no-es-uuid/download` | 404 | **A**. 404 "Componente no encontrado." |

### 2. Autenticación y autorización

| ID | Categoría | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| AUT-01 | Autenticación | Contraseña incorrecta | `POST /auth/login` con un correo existente y otra contraseña | 401 con mensaje genérico | **A**. 401 "Credenciales inválidas." |
| AUT-02 | Autenticación | Correo inexistente | `POST /auth/login` con un correo no registrado | 401 con el mismo mensaje que AUT-01 | **A**. 401 "Credenciales inválidas." |
| AUT-03 | Autenticación | Sin token | `GET /solutions` sin `Authorization` | 401 | **A**. 401 "Debes iniciar sesión para continuar." |
| AUT-04 | Autenticación | Token inválido | `GET /solutions` con `Bearer token.invalido.123` | 401 | **A**. 401 "La sesión no es válida. Inicia sesión de nuevo." |
| AUT-05 | Autenticación | Token expirado | `GET /solutions` con un JWT firmado con `exp` en el pasado | 401 | **A**. 401 "Tu sesión expiró. Inicia sesión de nuevo." |
| AUT-06 | Autenticación | Token de una cuenta eliminada | Registrar un usuario, eliminarlo con el admin y llamar a `GET /auth/me` con su token | 401 | **A**. 401 "La cuenta ya no existe. Inicia sesión de nuevo." |
| AUT-07 | Autorización | Consultor crea una solución | `POST /solutions` con token de consultor | 403 | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-08 | Autorización | Consultor edita una sección | `PUT /solutions/accessibility-assistant/documents/technical` con token de consultor | 403 | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-09 | Autorización | Consultor elimina una solución | `DELETE /solutions/accessibility-assistant` con token de consultor | 403 (la solución no cambia) | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-10 | Autorización | Consultor sube un componente | `POST /solutions/accessibility-assistant/components` con token de consultor | 403 | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-11 | Autorización | Consultor lista usuarios | `GET /users` con token de consultor | 403 | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-12 | Autorización | Autor lista usuarios | `GET /users` con token de autor | 403 | **A**. 403 "No tienes permiso para realizar esta acción." |
| AUT-13 | Autorización | Autor gestiona usuarios | `PATCH /users/:id/role` (a `admin`) y `DELETE /users/:id` con token de autor | 403 en ambos | **A**. 403 "No tienes permiso para realizar esta acción." en ambos |
| AUT-14 | Autorización | Admin se quita el rol | `PATCH /users/<propio id>/role` con `consultant` | 400 | **A**. 400 "No puedes quitarte el rol de administrador." |
| AUT-15 | Autorización | Admin se elimina | `DELETE /users/<propio id>` | 400 | **A**. 400 "No puedes eliminar tu propia cuenta." |
| AUT-16 | Autorización | Consultor lee el catálogo | `GET /solutions` con token de consultor | 200 | **A**. 200 con la lista de soluciones |
| AUT-17 | Autorización | El cambio de rol aplica sin volver a ingresar | Promover al consultor a `author` (API-05) y crear una solución con su token anterior | 201 | **A**. 201, la solución se creó con el mismo token (`createdBy` = el usuario promovido) |

### 3. Integración de la API

| ID | Categoría | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| API-01 | Integración | Registro | `POST /auth/register` con datos válidos | 201 con `token` y `user.role = consultant` | **A**. 201, `role: "consultant"` |
| API-02 | Integración | Ingreso del admin del seed | `POST /auth/login` con `ADMIN_EMAIL` y `ADMIN_PASSWORD` | 200 con `token` y `user.role = admin` | **A**. 200, `role: "admin"` |
| API-03 | Integración | Usuario actual | `GET /auth/me` | 200 con el usuario | **A**. 200 con `id`, `fullName`, `email`, `role`, `createdAt` |
| API-04 | Integración | Listar usuarios | `GET /users` (admin) | 200 sin `password_hash` | **A**. 200; ningún usuario incluye `password_hash` |
| API-05 | Integración | Cambiar rol | `PATCH /users/:id/role` con `author` | 200 con el rol nuevo | **A**. 200, `role: "author"` |
| API-06 | Integración | Búsqueda y filtro | `GET /solutions?search=accesib&type=plugin` | 200 con la solución del seed | **A**. 200, 1 resultado: `accessibility-assistant` |
| API-07 | Integración | Cobertura documental | `GET /solutions/coverage` | 200 con `total`, `complete`, `partial`, `pending`, `coveragePercent` | **A**. 200 `{"total":4,"complete":1,"partial":2,"pending":1,"coveragePercent":25}` (la base tenía una solución adicional creada antes de estas pruebas) |
| API-08 | Integración | Novedades recientes | `GET /solutions/recent-updates?limit=3` | 200 ordenado por fecha; con `release-notes`: título y extracto del primer `##`; sin la sección: "Solución actualizada" | **A**. 200; incluye `source: "solution"` con "Solución actualizada" y `source: "release-notes"` con "Versión 2.1.0" y su extracto |
| API-09 | Integración | Ficha de la solución del seed | `GET /solutions/accessibility-assistant` | 200 con `members`, `components` y `documents` en el orden del catálogo, sin `content` | **A**. 200: 3 responsables, 2 componentes, secciones `technical, release-notes, user-guide, fact-sheet`, sin `content` |
| API-10 | Integración | Crear solución | `POST /solutions` (autor) con `code`, datos y 2 responsables | 201 con la ficha | **A**. 201, `code: "qa-test-…"`, 2 responsables |
| API-11 | Integración | Ver la solución creada | `GET /solutions/:code` (consultor) | 200 | **A**. 200 con los datos enviados |
| API-12 | Integración | Editar solución | `PUT /solutions/:code` con otro nombre, tipo, estado y 1 responsable | 200; responsables reemplazados | **A**. 200: `name` "QA Solucion editada", `type` `addon`, `docStatus` `complete`, responsables = solo "QA Dev Nuevo" (dev) |
| API-13 | Integración | Crear sección con video | `PUT …/documents/release-notes` con un iframe de `youtube-nocookie.com` y `title` | 201 | **A**. 201 con el contenido guardado |
| API-14 | Integración | Reemplazar sección | `PUT` de nuevo sobre la misma sección; luego `GET /solutions/recent-updates?limit=1` | 200; la novedad más reciente es el primer `##` | **A**. 200; Novedades recientes muestra la solución de prueba con `title` "Version 1.1.0 QA" y `excerpt` "Segunda publicacion." |
| API-15 | Integración | Leer sección | `GET …/documents/release-notes` (consultor) | 200 con `content` y `solution: {code, name}` | **A**. 200 con `content` y `solution` |
| API-16 | Integración | Subir componente con archivo | `POST /solutions/:code/components` multipart con `name`, `version` y `file` | 201 con `hasFile: true` | **A**. 201, `fileName: "qa-installer.txt"`, `hasFile: true` |
| API-17 | Integración | Componente sin archivo | Igual sin `file` | 201 con `hasFile: false` | **A**. 201, `fileName: null`, `hasFile: false` |
| API-18 | Integración | Obtener URL de descarga | `GET /components/:id/download` (consultor) | 200 con `url` prefirmada, `fileName` y `expiresIn: 300` | **A**. 200; URL firmada con `X-Amz-Expires=300` |
| API-19 | Integración | Descargar con la URL prefirmada | `GET <url>` sin cabecera de autenticación | 200 y el archivo idéntico al subido | **A**. 200; el archivo descargado es idéntico byte a byte |
| API-20 | Integración | Descarga sin instalable | `GET /components/:id/download` del componente sin archivo | 404 | **A**. 404 "Este componente todavía no tiene un instalable disponible." |
| API-21 | Integración | Eliminar sección | `DELETE …/documents/release-notes` y luego `GET` | 204; luego 404 | **A**. 204; luego 404 "Esta sección todavía no tiene contenido." |
| API-22 | Integración | Eliminar componente y su archivo | `DELETE /components/:id`; luego pedir la descarga y abrir la URL prefirmada anterior | 204; la descarga da 404 y el objeto ya no existe en el almacenamiento | **A**. 204; descarga 404 "Componente no encontrado."; la URL prefirmada anterior responde 404 |
| API-23 | Integración | Eliminar solución | `DELETE /solutions/:code`; luego `GET` | 204; luego 404 | **A**. 204; luego 404 "Solución no encontrada." |
| API-24 | Integración | Eliminar usuario | `DELETE /users/:id` (admin) | 204 | **A**. 204; no quedan usuarios de prueba |
| API-25 | Integración | Ruta inexistente | `GET /api/no-existe` | 404 | **A**. 404 "Recurso no encontrado." |

### 4. Navegación, accesibilidad y diseño responsivo

Estos casos se ejecutan en el navegador con el frontend en `http://localhost:5173`. Quedan pendientes de ejecución manual.

| ID | Categoría | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|---|
| NAV-01 | Navegación | Recorrido completo del consultor | Registrarse → Inicio → buscar "accesib" → abrir la ficha → abrir "Documentación Técnica" → volver por las migas de pan | Cada vista carga con su skeleton y luego el contenido; las migas de pan llevan a la vista correcta | |
| NAV-02 | Navegación | Filtro por tipo | En Inicio, pulsar la tarjeta "Plugin POS"; luego **Limpiar búsqueda** | La URL cambia a `/?type=plugin`, se muestran solo plugins con su número; al limpiar vuelve la vista inicial | |
| NAV-03 | Navegación | Búsqueda sin resultados | Buscar "zzzz" | Estado vacío "No encontramos soluciones con esos criterios" con el botón "Ver todas las soluciones" | |
| NAV-04 | Navegación | Descarga desde la ficha | Pulsar **Descargar** en un componente con archivo | El archivo se descarga y aparece el aviso "Descarga iniciada: <archivo>" | |
| NAV-05 | Navegación | Recorrido del autor | Nueva solución → crear → agregar componente con archivo → publicar una sección con video → ver la sección → eliminar la solución | Aviso de éxito tras cada acción; el video se ve a 16:9; la eliminación pide confirmación en un modal | |
| NAV-06 | Navegación | Cambios sin guardar | Escribir en una sección y cambiar a otra en la lista | Modal "¿Descartar los cambios sin guardar?"; al cerrar la pestaña, el navegador pide confirmación | |
| NAV-07 | Navegación | Administración de usuarios | Como admin, cambiar el rol de un usuario y eliminar otro | Aviso de éxito; la fila propia tiene el `select` deshabilitado y sin botón Eliminar | |
| NAV-08 | Navegación | Ruta protegida sin sesión | Cerrar sesión y abrir `/solutions/accessibility-assistant` | Redirige a `/login`; al ingresar vuelve a la ficha | |
| NAV-09 | Navegación | Rol insuficiente | Como consultor, abrir `/manage/solutions/new` y `/admin/users` | Vista "Sin permiso" con el rol actual y "Volver al catálogo" | |
| NAV-10 | Navegación | Error de conexión | Detener el backend y pulsar **Reintentar** en una vista | Mensaje de error con **Reintentar**; al levantar el backend y reintentar, carga el contenido | |
| ACC-01 | Accesibilidad | Navegación por teclado | Recorrer Inicio, ficha, sección y formularios solo con Tab, Shift+Tab, Enter, Espacio y Escape | Todo es alcanzable y operable; el orden de foco sigue el orden visual | |
| ACC-02 | Accesibilidad | Saltar al contenido | En cualquier página, pulsar Tab al cargar y luego Enter | Aparece "Saltar al contenido" y el foco pasa al contenido principal | |
| ACC-03 | Accesibilidad | Foco visible | Navegar con Tab en modo claro y oscuro | Contorno azul de 3 px visible en cada elemento | |
| ACC-04 | Accesibilidad | Modal de confirmación | Abrir un modal de eliminar; pulsar Tab varias veces y luego Escape | El foco empieza en "Cancelar", no sale del modal, y al cerrar vuelve al botón que lo abrió | |
| ACC-05 | Accesibilidad | Errores de formulario | Enviar el registro vacío | Errores junto a cada campo, foco en el primer campo con error, anunciados por el lector de pantalla (`aria-describedby`) | |
| ACC-06 | Accesibilidad | Avisos con lector de pantalla | Con NVDA o Narrador, guardar una sección | Se anuncia el aviso de éxito (región `aria-live="polite"`) | |
| ACC-07 | Accesibilidad | Tabla de contenidos | En una sección, elegir un título de la tabla | Desplaza al título, mueve el foco a él y resalta el enlace activo | |
| ACC-08 | Accesibilidad | Modo oscuro | Pulsar el botón luna/sol y recargar | El tema cambia, se conserva al recargar y no hay destello del tema anterior | |
| ACC-09 | Accesibilidad | Lighthouse: accesibilidad | Chrome DevTools → Lighthouse → Accesibilidad en Inicio, ficha y sección | Puntuación de 90 o más, sin errores de contraste | |
| ACC-10 | Accesibilidad | Lighthouse: rendimiento | Igual, categoría Rendimiento, sobre `npm run build` + `npm run preview` | Puntuación de 90 o más | |
| RES-01 | Responsive | 360 px | DevTools, modo dispositivo a 360 px de ancho, en todas las vistas | Sin desplazamiento horizontal de la página; tabla de contenidos plegada; botones de 44 px o más | |
| RES-02 | Responsive | 768 px | Igual a 768 px | Tarjetas en dos columnas; barra superior completa | |
| RES-03 | Responsive | 1440 px | Igual a 1440 px | Ficha con Secciones y Componentes en paralelo; tabla de contenidos fija a la derecha | |

## Resumen

| Categoría | Ejecutados | Aprobados | Fallidos |
|---|---|---|---|
| Ingreso de datos y validaciones | 25 | 25 | 0 |
| Autenticación y autorización | 17 | 17 | 0 |
| Integración de la API | 25 | 25 | 0 |
| **Total ejecutado** | **67** | **67** | **0** |
| Navegación, accesibilidad y responsive | 0 de 23 (pendientes de ejecución manual) | — | — |

### Fallo corregido

- **VAL-23: cuerpo JSON de más de 1 MB.** En la primera ejecución respondió **500** con el mensaje genérico: `express.json({ limit: '1mb' })` rechazaba el cuerpo con el error `entity.too.large`, que `Backend/src/middleware/errors.js` no trataba. Se agregó ese caso al manejador central para responder **413** "El contenido enviado supera el tamaño máximo de 1 MB." Al repetir la prueba se obtuvo 413 con ese mensaje y sin errores en el log.

### Observaciones (no son fallos)

- **VAL-10 y VAL-19:** `requiredText` en `Backend/src/utils/validation.js` usa siempre "es obligatorio", lo que produce "La descripción es obligatorio." y "La versión es obligatorio.".
- **VAL-06:** un correo vacío devuelve dos mensajes para el mismo campo ("El correo es obligatorio." e "Ingresa un correo válido."). El frontend valida antes de enviar, así que el usuario no lo ve.
