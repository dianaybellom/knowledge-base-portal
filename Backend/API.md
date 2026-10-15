# API — Knowledge Base Portal

API REST en JSON. Todas las rutas usan el prefijo **`/api`**.

- **Local:** `http://localhost:3000/api`
- **Autenticación:** cabecera `Authorization: Bearer <token>`. El token (JWT) se obtiene en `/auth/register` o `/auth/login`, contiene `{ sub, role, name }` y expira en **8 horas**.
- **Roles:** `consultant` (Consultor), `author` (Autor técnico) y `admin` (Administrador). El rol se lee de la base de datos en cada petición, así que un cambio de rol o una eliminación aplican de inmediato.
- **Identificadores:** los `id` son UUID. Las soluciones se identifican en las rutas por su **`code`** (slug inmutable, por ejemplo `accessibility-assistant`).
- **Fechas:** ISO 8601 en UTC (`2026-10-03T01:33:30.000Z`).
- **Cuerpo JSON:** `Content-Type: application/json`, máximo 1 MB por petición, si lo supera responde 413 (las subidas de archivos usan `multipart/form-data`).
- **Orden de las verificaciones:** primero la sesión (401), luego el rol (403) y después la validación del cuerpo (400). Un consultor que envía un cuerpo inválido a una ruta de autor recibe 403, no 400.

## Índice

| Método | Ruta | Rol |
|---|---|---|
| POST | [`/auth/register`](#post-authregister) | público |
| POST | [`/auth/login`](#post-authlogin) | público |
| GET | [`/auth/me`](#get-authme) | autenticado |
| GET | [`/users`](#get-users) | admin |
| PATCH | [`/users/:id/role`](#patch-usersidrole) | admin |
| DELETE | [`/users/:id`](#delete-usersid) | admin |
| GET | [`/solutions`](#get-solutions) | autenticado |
| GET | [`/solutions/coverage`](#get-solutionscoverage) | autenticado |
| GET | [`/solutions/recent-updates`](#get-solutionsrecent-updates) | autenticado |
| GET | [`/solutions/:code`](#get-solutionscode) | autenticado |
| POST | [`/solutions`](#post-solutions) | author, admin |
| PUT | [`/solutions/:code`](#put-solutionscode) | author, admin |
| DELETE | [`/solutions/:code`](#delete-solutionscode) | author, admin |
| GET | [`/solutions/:code/documents/:type`](#get-solutionscodedocumentstype) | autenticado |
| PUT | [`/solutions/:code/documents/:type`](#put-solutionscodedocumentstype) | author, admin |
| DELETE | [`/solutions/:code/documents/:type`](#delete-solutionscodedocumentstype) | author, admin |
| POST | [`/solutions/:code/components`](#post-solutionscodecomponents) | author, admin |
| DELETE | [`/components/:id`](#delete-componentsid) | author, admin |
| GET | [`/components/:id/download`](#get-componentsiddownload) | autenticado |

## Errores

Todas las respuestas de error tienen el formato:

```json
{ "error": "Mensaje en español", "details": [{ "field": "email", "message": "Ingresa un correo válido." }] }
```

`details` solo aparece en los errores de validación (un elemento por problema, con el campo afectado).

| Código | Cuándo |
|---|---|
| 400 | Datos no válidos (`"Datos no válidos."` con `details`), JSON mal formado (`"El cuerpo de la petición no es un JSON válido."`), tipo de sección inexistente, regla de negocio (por ejemplo, un admin que se quita su propio rol) |
| 401 | Sin token, token inválido o expirado, cuenta eliminada, credenciales incorrectas (ver [mensajes de sesión](#mensajes-de-sesión-401)) |
| 403 | El rol no tiene permiso para la acción (`"No tienes permiso para realizar esta acción."`) |
| 404 | Recurso inexistente. Un `id` que no es UUID o un `code` con formato inválido también responden 404, porque no pueden existir. Una ruta inexistente bajo `/api` responde `"Recurso no encontrado."` |
| 409 | Email (`"Ya existe una cuenta con ese correo."`) o `code` de solución duplicado |
| 413 | Archivo de más de 50 MB (`"El archivo supera el tamaño máximo de 50 MB."`) o cuerpo JSON de más de 1 MB (`"El contenido enviado supera el tamaño máximo de 1 MB."`) |
| 500 | Error interno (el detalle queda solo en el log del servidor): `"Error interno del servidor. Intenta de nuevo más tarde."` |

### Mensajes de sesión (401)

| Situación | Mensaje |
|---|---|
| Sin cabecera `Authorization` o sin el esquema `Bearer` | `"Debes iniciar sesión para continuar."` |
| Token mal formado o con firma inválida | `"La sesión no es válida. Inicia sesión de nuevo."` |
| Token expirado (más de 8 horas) | `"Tu sesión expiró. Inicia sesión de nuevo."` |
| El usuario del token fue eliminado | `"La cuenta ya no existe. Inicia sesión de nuevo."` |

## Valores de catálogo

| Campo | Valores |
|---|---|
| `role` (usuario) | `consultant`, `author`, `admin` |
| `type` (solución) | `addon`, `plugin`, `integration` |
| `docStatus` | `complete`, `partial`, `pending` |
| `members[].role` | `po`, `dev` (como máximo un `po` por solución) |
| `type` (sección) | `technical`, `release-notes`, `user-guide`, `fact-sheet` (en este orden) |

---

## Autenticación

### POST `/auth/register`

Crea una cuenta con rol `consultant` y devuelve su sesión. **Rol:** público.

**Cuerpo**

| Campo | Tipo | Reglas |
|---|---|---|
| `fullName` | string | obligatorio, 2 a 120 caracteres |
| `email` | string | obligatorio, email válido, máx. 160; se guarda en minúsculas |
| `password` | string | obligatorio, 8 a 72 caracteres |

```json
{ "fullName": "Diana Bello", "email": "diana@example.com", "password": "Secreta123" }
```

**Respuesta 201**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "8f55fb5b-c4d2-4d14-8fd3-5e6ccf8b9b1e",
    "fullName": "Diana Bello",
    "email": "diana@example.com",
    "role": "consultant",
    "createdAt": "2026-10-03T01:00:00.000Z"
  }
}
```

**Códigos:** 201, 400 (validación; por ejemplo "Ingresa un correo válido." o "La contraseña debe tener al menos 8 caracteres."), 409 ("Ya existe una cuenta con ese correo.").

### POST `/auth/login`

**Rol:** público.

**Cuerpo:** `{ "email": "diana@example.com", "password": "Secreta123" }`

**Respuesta 200:** igual que el registro (`{ token, user }`).

**Códigos:** 200, 400 (validación), 401 ("Credenciales inválidas.", el mismo mensaje si el correo no existe o la contraseña es incorrecta).

### GET `/auth/me`

Devuelve el usuario de la sesión actual. **Rol:** autenticado.

**Respuesta 200:** `{ "user": { "id": "…", "fullName": "…", "email": "…", "role": "author", "createdAt": "…" } }`

**Códigos:** 200, 401 (cualquiera de los [mensajes de sesión](#mensajes-de-sesión-401)).

---

## Usuarios

### GET `/users`

Lista todos los usuarios (sin `password_hash`), ordenados por fecha de creación. **Rol:** admin.

**Respuesta 200**

```json
{
  "users": [
    { "id": "07c56ec1-…", "fullName": "Administrador", "email": "admin@example.com", "role": "admin", "createdAt": "…" },
    { "id": "8f55fb5b-…", "fullName": "Diana Bello", "email": "diana@example.com", "role": "consultant", "createdAt": "…" }
  ]
}
```

**Códigos:** 200, 401, 403.

### PATCH `/users/:id/role`

Cambia el rol de un usuario. **Rol:** admin.

**Parámetros:** `id` (UUID del usuario). **Cuerpo:** `{ "role": "author" }`

**Respuesta 200:** `{ "user": { "id": "…", "fullName": "…", "email": "…", "role": "author", "createdAt": "…" } }`

**Códigos:** 200, 400 (rol inválido: "El rol no es válido. Valores permitidos: consultant, author, admin."; "No puedes quitarte el rol de administrador."), 401, 403, 404 ("Usuario no encontrado.", también si el `id` no es un UUID).

### DELETE `/users/:id`

Elimina un usuario. Las soluciones que creó se conservan (`createdBy` queda en `null`). **Rol:** admin.

**Respuesta:** 204 sin cuerpo.

**Códigos:** 204, 400 ("No puedes eliminar tu propia cuenta."), 401, 403, 404 ("Usuario no encontrado.").

---

## Soluciones

### GET `/solutions`

Lista las soluciones ordenadas por nombre. **Rol:** autenticado.

**Query (todos opcionales; un valor vacío se ignora)**

| Parámetro | Descripción |
|---|---|
| `search` | Texto buscado (ILIKE, sin distinguir mayúsculas) en `name` y `summary`; máx. 100 caracteres. `%` y `_` se buscan de forma literal. |
| `type` | `addon`, `plugin` o `integration` |
| `docStatus` | `complete`, `partial` o `pending` |

Ejemplo: `GET /api/solutions?search=accesib&type=plugin`

**Respuesta 200**

```json
{
  "solutions": [
    {
      "id": "3f2a9c1e-…",
      "code": "accessibility-assistant",
      "name": "Asistente de Accesibilidad",
      "type": "plugin",
      "summary": "Plugin para el punto de venta que lee en voz alta productos y totales…",
      "docStatus": "complete",
      "createdAt": "…",
      "updatedAt": "…"
    }
  ]
}
```

**Códigos:** 200, 400 (filtro con valor no permitido), 401.

### GET `/solutions/coverage`

Indicador de cobertura documental (RF-10). `coveragePercent` = soluciones `complete` / total × 100, redondeado (0 si no hay soluciones). **Rol:** autenticado.

**Respuesta 200:** `{ "total": 3, "complete": 1, "partial": 1, "pending": 1, "coveragePercent": 33 }`

**Códigos:** 200, 401.

### GET `/solutions/recent-updates`

Novedades recientes para la página principal: una entrada por solución, ordenadas por fecha de publicación descendente. **Rol:** autenticado.

**Query:** `limit` (opcional, entero de 1 a 20; por defecto 5).

**Cómo se arma cada entrada**

- Si la solución tiene la sección **Novedades** (`release-notes`), se toma su **primer bloque**: desde el primer encabezado `##` hasta el siguiente. El encabezado es el `title` y el texto (sin Markdown ni HTML, máx. 160 caracteres, sin cortar palabras) es el `excerpt`. La fecha es la de la sección. `source: "release-notes"`.
- Si la sección existe pero no tiene ningún encabezado `#` o `##`, `title` es `"Novedades actualizadas"`.
- Si no la tiene: `title: "Solución actualizada"`, `excerpt: null` y la fecha general de la solución. `source: "solution"`.

> **Convención de la sección Novedades:** cada publicación empieza con un encabezado `##` y **la más reciente va primero**. El texto antes del primer `##` se ignora.

**Respuesta 200**

```json
{
  "updates": [
    {
      "solution": { "code": "accessibility-assistant", "name": "Asistente de Accesibilidad", "type": "plugin" },
      "source": "release-notes",
      "title": "Versión 2.1.0",
      "excerpt": "Nuevo parámetro ACC_SPEECH_RATE para ajustar la velocidad de lectura. Corrección: el total se leía dos veces al aplicar descuentos.",
      "publishedAt": "2026-09-22T14:30:00.000Z"
    },
    {
      "solution": { "code": "e-invoicing-connector", "name": "Conector de Facturación Electrónica", "type": "integration" },
      "source": "solution",
      "title": "Solución actualizada",
      "excerpt": null,
      "publishedAt": "2026-09-18T18:15:00.000Z"
    }
  ]
}
```

**Códigos:** 200, 400 (`limit` no válido), 401.

### GET `/solutions/:code`

Ficha completa de una solución. Las secciones se listan sin su contenido (se obtiene con `GET /solutions/:code/documents/:type`). **Rol:** autenticado.

**Respuesta 200**

```json
{
  "solution": {
    "id": "3f2a9c1e-…",
    "code": "accessibility-assistant",
    "name": "Asistente de Accesibilidad",
    "type": "plugin",
    "summary": "Plugin para el punto de venta…",
    "docStatus": "complete",
    "createdAt": "…",
    "updatedAt": "…",
    "description": "Componente que permite…\n\n## Funcionalidades\n\n- Lectura en voz alta…",
    "createdBy": { "id": "07c56ec1-…", "fullName": "Administrador" },
    "members": [
      { "id": "…", "name": "Laura Méndez", "role": "po" },
      { "id": "…", "name": "Carlos Ríos", "role": "dev" }
    ],
    "components": [
      { "id": "…", "name": "Plugin POS Accesibilidad", "version": "2.1.0", "fileName": null, "hasFile": false, "createdAt": "…" }
    ],
    "documents": [
      { "type": "technical", "updatedAt": "…" },
      { "type": "release-notes", "updatedAt": "…" }
    ]
  }
}
```

`members` trae primero al PO; `documents` sigue el orden del catálogo.

**Códigos:** 200, 401, 404 ("Solución no encontrada.").

### POST `/solutions`

Crea una solución con sus responsables. **Rol:** author, admin.

**Cuerpo**

| Campo | Tipo | Reglas |
|---|---|---|
| `code` | string | obligatorio, máx. 80, `^[a-z0-9]+(-[a-z0-9]+)*$`, único; **no se puede cambiar después** |
| `name` | string | obligatorio, 2 a 120 |
| `type` | string | `addon`, `plugin` o `integration` |
| `summary` | string | obligatorio, texto plano, máx. 300 (tarjetas y búsqueda) |
| `description` | string | obligatorio, Markdown, máx. 20 000; los iframes se validan (ver [Videos](#videos-iframes)) |
| `docStatus` | string | opcional, por defecto `pending` |
| `members` | array | opcional, máx. 20 elementos `{ name, role }`; como máximo un `po` |

```json
{
  "code": "accessibility-assistant",
  "name": "Asistente de Accesibilidad",
  "type": "plugin",
  "summary": "Plugin para el punto de venta que lee en voz alta productos y totales.",
  "description": "Componente que permite…\n\n## Funcionalidades\n\n- Navegación completa por teclado.",
  "docStatus": "complete",
  "members": [{ "name": "Laura Méndez", "role": "po" }, { "name": "Carlos Ríos", "role": "dev" }]
}
```

**Respuesta 201:** `{ "solution": { … } }` con la misma forma que `GET /solutions/:code`.

**Códigos:** 201, 400 (validación; por ejemplo "El código solo admite minúsculas, números y guiones simples (ejemplo: accessibility-assistant)." o "Solo puede haber un PO por solución."), 401, 403, 409 ("Ya existe una solución con el código \"…\".").

### PUT `/solutions/:code`

Reemplaza los datos de la solución y **reemplaza la lista completa de responsables**. Actualiza `updatedAt`. **Rol:** author, admin.

**Cuerpo:** los mismos campos que `POST` excepto `code`. Si se envía `code` con un valor distinto al de la URL, responde 400 ("El código de una solución no se puede modificar."). Enviar `members: []` deja la solución sin responsables.

**Respuesta 200:** `{ "solution": { … } }`.

**Códigos:** 200, 400, 401, 403, 404. La existencia de la solución se comprueba antes de validar el cuerpo.

### DELETE `/solutions/:code`

Elimina la solución con sus responsables, componentes y secciones, y borra del almacenamiento los archivos de sus componentes. Si el almacenamiento falla, el error se registra en el log y la eliminación continúa. **Rol:** author, admin.

**Respuesta:** 204 sin cuerpo. **Códigos:** 204, 401, 403, 404.

---

## Secciones de documentación

Cada solución tiene como máximo **una sección de cada tipo**, y cada sección es un único registro con su **Markdown completo** (encabezados, tablas y videos). Crear, editar o eliminar una sección actualiza el `updatedAt` de la solución.

### GET `/solutions/:code/documents/:type`

**Rol:** autenticado. **Parámetros:** `code` de la solución; `type` de la sección.

**Respuesta 200**

```json
{
  "document": {
    "type": "technical",
    "content": "El Asistente de Accesibilidad se configura…\n\n## Parámetros del sistema\n\n…",
    "updatedAt": "…",
    "solution": { "code": "accessibility-assistant", "name": "Asistente de Accesibilidad" }
  }
}
```

**Códigos:** 200, 400 (tipo de sección no válido), 401, 404 (solución inexistente o "Esta sección todavía no tiene contenido.").

### PUT `/solutions/:code/documents/:type`

Crea la sección si no existe o reemplaza su contenido. **Rol:** author, admin.

**Cuerpo:** `{ "content": "## Introducción\n\n…" }` (obligatorio, máx. 200 000 caracteres; los iframes se validan).

**Respuesta:** **201** si se creó o **200** si se reemplazó, con `{ "document": { "type": "technical", "content": "…", "updatedAt": "…" } }`.

**Códigos:** 200, 201, 400, 401, 403, 404.

### DELETE `/solutions/:code/documents/:type`

**Rol:** author, admin. **Respuesta:** 204 sin cuerpo.

**Códigos:** 204, 400, 401, 403, 404 ("Esta sección no existe.").

### Videos (iframes)

Los videos se insertan dentro del Markdown (`description` o `content`) pegando el código para insertar de la plataforma; opcionalmente pueden ir envueltos en `<div class="video-embed">`. Cada `<iframe>` debe cumplir:

- `src` con `https://` y uno de estos orígenes:
  - `https://www.youtube.com/embed/…`
  - `https://www.youtube-nocookie.com/embed/…`
  - `https://<cualquier-tenant>.sharepoint.com/…/_layouts/15/embed.aspx…`
- Un atributo `title` no vacío que describa el video (accesibilidad).

Si alguno no cumple, la respuesta es 400 con un mensaje por problema, por ejemplo: *"El video 2 de \"vimeo.com\" no está permitido. Usa el código para insertar de YouTube o de SharePoint."* Esta validación orienta al autor; la protección contra HTML malicioso la hace la sanitización del frontend.

---

## Componentes e instalables

### POST `/solutions/:code/components`

Crea un componente y, si se adjunta, sube su instalable al almacenamiento privado con la clave `components/<solutionId>/<timestamp>-<nombre>`. Actualiza el `updatedAt` de la solución. **Rol:** author, admin.

**Cuerpo:** `multipart/form-data`

| Campo | Tipo | Reglas |
|---|---|---|
| `name` | texto | obligatorio, máx. 120 |
| `version` | texto | obligatorio, máx. 30 |
| `file` | archivo | opcional, uno solo, máx. **50 MB**; el nombre original (con acentos) se conserva para la descarga |

**Respuesta 201**

```json
{
  "component": {
    "id": "5b1d…",
    "solutionId": "3f2a9c1e-…",
    "name": "Plugin POS Accesibilidad",
    "version": "2.1.0",
    "fileName": "plugin-accesibilidad-2.1.0.zip",
    "hasFile": true,
    "createdAt": "…"
  }
}
```

**Códigos:** 201, 400 (validación; archivo en un campo distinto de `file` o más de un archivo: "La subida no es válida. Envía un solo archivo en el campo \"file\"."), 401, 403, 404 ("Solución no encontrada."), 413 ("El archivo supera el tamaño máximo de 50 MB.").

### DELETE `/components/:id`

Elimina el componente y su archivo del almacenamiento. **Rol:** author, admin.

**Respuesta:** 204 sin cuerpo. **Códigos:** 204, 401, 403, 404 ("Componente no encontrado.", también si el `id` no es un UUID). Si falla el borrado en el almacenamiento, se registra en el log y el componente se elimina igual.

### GET `/components/:id/download`

Genera una URL prefirmada para descargar el instalable. La URL vale **5 minutos**; el bucket es privado, así que el archivo no se puede descargar sin firma. **Rol:** autenticado.

**Respuesta 200**

```json
{
  "url": "https://…/downloadables/components/3f2a9c1e-…/1790991209917-plugin.zip?X-Amz-Algorithm=…&X-Amz-Signature=…",
  "fileName": "plugin-accesibilidad-2.1.0.zip",
  "expiresIn": 300
}
```

**Códigos:** 200, 401, 404 ("Componente no encontrado." o "Este componente todavía no tiene un instalable disponible.").
