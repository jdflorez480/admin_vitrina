# API de Vitrina Raíz — Documentación

Existen dos APIs diferenciadas según el contexto de uso.

---

## ⚠️ Estado actual — leer antes de integrar

Verificado contra la API en producción el **14 de julio de 2026**.

### 1. `GET /api/external/users/[id]` está ROTO

Devuelve **`500 Internal server error` siempre**, para cualquier id.

El fallo está aislado en el handler `GET`; todo lo que lo rodea funciona:

| Prueba | Resultado | Qué demuestra |
|--------|-----------|---------------|
| `GET /users/{id}` con token válido | **500** | El fallo |
| `GET /users/{id}` sin token / token falso | 401 | La autenticación funciona |
| `PATCH /users/{id}` (mismo archivo de ruta) | 400 con validación Zod | El módulo carga, Zod corre, la BD responde |
| `GET /users/{id}/data` (mismo id) | 200 | El id existe y la BD lo encuentra |
| `GET /users/{id}` con un **id inexistente** | **500** (debería ser `404`) | ⭐ Clave |

**La última fila es la pista.** Un id que no existe también revienta con 500 en vez
de devolver 404, así que el crash ocurre **antes o al margen** de la comprobación de
"usuario no encontrado": no depende de los datos de ningún usuario concreto.

Sospecha a investigar: el detalle calcula unas `stats` mucho más ricas que el listado
(`properties.byStatus`, `leads.byStage`, `rentPayments.byStatus`, `analytics.totalEvents`).
El listado y el overview devuelven stats sin problema, así que el candidato natural es
esa agregación específica — probablemente un `groupBy`/`aggregate` sobre un campo o
enum que ya no existe. El stack trace debería aparecer en los logs del servidor.

> **Workaround en el dashboard:** el usuario se obtiene del listado (`GET /users`), que
> devuelve exactamente los mismos campos. Es más lento y no escala a miles de usuarios.
> Ver `getUserById()` en `src/lib/vitrina/api.ts`; se elimina en cuanto esto se corrija.

### 2. Esta documentación tenía enums y formas incorrectos

Corregidos abajo. Resumen de lo que estaba mal:

| Campo | Decía la doc | Devuelve la API |
|-------|--------------|-----------------|
| `role` | `AGENT \| ADMIN` | `ADMIN \| AGENT \| ASSISTANT \| MARKETING` |
| `currentPlan` (en `PATCH`) | 5 planes | 6 — falta **`ILIMITADO`** |
| `trends` | un array | un **objeto**: `{ granularity, periodDays, data: [...] }` |
| `properties.new`, `leads.new`… | `newInPeriod` | **`new`** |
| `subscriptions.total` / `.revenue` | `totalActive` / `revenueInPeriod` | **`total`** / **`revenue`** |
| `tenants.contracts` | `activeContracts` plano | anidado: `contracts: { total, active }` |
| `owners` | no se menciona | **existe** (`total`, `new`, `byStage`) |
| `trialDaysRemaining` | `0` sin trial | **`null`** sin trial |

Los enums se confirmaron enviando un `PATCH` con un valor inválido: Zod responde con la
lista completa de opciones válidas y no escribe nada.

---

## API Externa — Dashboard de Administración

**Base URL:** `https://vitrinaraiz.com/api/external`

Exclusiva para el dashboard administrativo externo. Autenticación mediante JWT con duración de 24 horas. Solo accesible por usuarios con rol `ADMIN`.

**Header requerido en todos los endpoints (excepto login):**
```
Authorization: Bearer {token}
```

---

### Mapa de endpoints

| Método | Endpoint | Qué hace |
|--------|----------|----------|
| POST | `/api/external/auth/login` | Login de admin → devuelve JWT (24h) |
| POST | `/api/external/auth/verify` | Verifica validez del token |
| GET | `/api/external/users` | Lista usuarios (paginación, filtros, `counts` activos/desactivados) |
| GET | `/api/external/users/[id]` | 🔴 **ROTO — devuelve 500 siempre.** Detalle + stats de un usuario |
| PATCH | `/api/external/users/[id]` | Edita datos del usuario (validado) |
| DELETE | `/api/external/users/[id]` | Desactiva (soft delete) · `?hard=true` borra físico |
| POST | `/api/external/users/[id]/reactivate` | Reactiva un usuario desactivado |
| POST | `/api/external/users/[id]/subscription` | Cambia plan / extiende trial / cancela |
| GET | `/api/external/users/[id]/data` | Lista propiedades/leads/deals del usuario |
| POST | `/api/external/users/[id]/impersonate` | Genera token para entrar como el usuario (1h) |
| GET | `/api/external/stats/overview` | Métricas globales del sistema por período |

---

### Autenticación

#### `POST /api/external/auth/login`

Genera un token JWT.

**Body:**
```json
{ "email": "string", "password": "string" }
```

**Respuesta:**
```json
{
  "token": "eyJ...",
  "expiresIn": 86400,
  "user": { "id": "string", "name": "string", "email": "string", "role": "ADMIN" }
}
```

> **Rate limit:** máximo **5 intentos cada 5 minutos por IP**. Al excederlo responde `429` con header `Retry-After` (segundos). Protección anti fuerza bruta a nivel de aplicación (independiente de NGINX).

---

#### `POST /api/external/auth/verify`

Verifica si un token sigue siendo válido.

**Respuesta:**
```json
{ "valid": true, "user": { "userId": "string", "email": "string", "role": "ADMIN" } }
```

---

### Usuarios

#### `GET /api/external/users`

Lista usuarios con paginación y filtros.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `search` | string | — | Busca por nombre o email |
| `plan` | string | — | `LAUNCH` `TRIAL` `BASIC` `PRO` `INMOBILIARIA` `ILIMITADO` |
| `role` | string | — | `AGENT` `ADMIN` `ASSISTANT` `MARKETING` |
| `status` | string | `active` | `active` (solo activos) · `deleted` (solo desactivados) · `all` (todos) |
| `page` | number | `1` | Página |
| `limit` | number | `20` | Por página (máx. 100) |

> Por defecto solo se listan usuarios **activos** (`deletedAt = null`). Usá `status=deleted` para ver los desactivados o `status=all` para todos.

**Respuesta por usuario:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "ADMIN | AGENT | ASSISTANT | MARKETING",
  "currentPlan": "LAUNCH | TRIAL | BASIC | PRO | INMOBILIARIA | ILIMITADO",
  "trialStartedAt": "ISO date | null",
  "trialEndsAt": "ISO date | null",
  "avatarUrl": "string | null",
  "createdAt": "ISO date",
  "updatedAt": "ISO date",
  "deletedAt": "ISO date | null",
  "profile": {
    "slug": "string",
    "phone": "string | null",
    "whatsapp": "string | null",
    "bio": "string | null",
    "logoUrl": "string | null"
  },
  "trialDaysRemaining": null,
  "trialStatus": "active | expired | none",
  "subscription": {
    "id": "string",
    "tier": "string",
    "status": "ACTIVE | ...",
    "billingPeriod": "MONTHLY | SEMIANNUAL | ANNUAL",
    "amount": 29900,
    "nextBillingDate": "ISO date",
    "startDate": "ISO date",
    "endDate": "ISO date"
  },
  "subscriptions": [ "... historial, misma forma que `subscription`" ],
  "_count": {
    "properties": 0, "leads": 0, "owners": 0,
    "deals": 0, "buildings": 0, "tenants": 0
  },
  "stats": {
    "totalProperties": 0,
    "publishedProperties": 0,
    "soldProperties": 0,
    "totalLeads": 0,
    "totalOwners": 0,
    "totalDeals": 0,
    "totalCommissions": 0,
    "totalWhatsappClicks": 0,
    "totalPropertyViews": 0,
    "totalBuildings": 0,
    "totalTenants": 0,
    "activeTenants": 0,
    "overduePayments": 0,
    "totalMonthlyRent": 0
  }
}
```

> **Ojo con tres cosas que no son obvias:**
> - Vienen **`subscription`** (la vigente, o `null`) **y `subscriptions[]`** (el historial). Son campos distintos.
> - **`trialDaysRemaining` es `null`**, no `0`, cuando el usuario no tiene trial.
> - Este endpoint devuelve **los mismos campos que el detalle**. Mientras `GET /users/[id]` siga roto, sirve de sustituto.

**Respuesta raíz:**
```json
{
  "users": [...],
  "counts": { "active": 120, "deactivated": 7, "total": 127 },
  "filter": { "status": "active" },
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

> `counts` es **global** (no depende de la página ni del filtro `status`): sirve para mostrar "120 activos · 7 desactivados". `pagination.total` sí respeta los filtros aplicados.

---

#### `GET /api/external/users/[id]` 🔴 ROTO

> **Este endpoint devuelve `500` siempre, para cualquier id.** Ver el diagnóstico al
> principio del documento. **No lo uses**: mientras tanto, obtené el usuario del
> listado (`GET /users`), que devuelve exactamente los mismos campos.
>
> Lo que sigue es la respuesta **esperada** cuando se corrija, no la actual.

Detalle completo de un usuario.

**Respuesta:**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "currentPlan": "string",
  "profile": { ... },
  "subscription": { ... },
  "stats": {
    "properties": {
      "total": 0,
      "byStatus": { "draft": 0, "published": 0, "sold": 0, "rented": 0, "paused": 0, "negotiation": 0 }
    },
    "leads": {
      "total": 0,
      "byStage": { "new": 0, "contacted": 0, "visited": 0, "negotiation": 0, "won": 0, "lost": 0 }
    },
    "deals": {
      "total": 0,
      "totalCommissions": 0,
      "avgCommission": 0
    },
    "buildings": {
      "total": 0,
      "byStatus": { "active": 0, "inactive": 0 }
    },
    "tenants": {
      "total": 0,
      "byStatus": { "pendiente": 0, "activo": 0, "inactivo": 0 },
      "activeContracts": 0,
      "totalMonthlyRent": 0
    },
    "rentPayments": {
      "byStatus": {
        "pagado": { "count": 0, "amount": 0 },
        "pendiente": { "count": 0, "amount": 0 },
        "mora": { "count": 0, "amount": 0 }
      }
    },
    "analytics": { "totalEvents": 0 }
  }
}
```

---

#### `PATCH /api/external/users/[id]`

Actualiza datos de un usuario. Todos los campos son opcionales, pero el payload se **valida con Zod**.

**Body:**
```json
{
  "name": "string (1–120 chars)",
  "email": "string (email válido, se normaliza a minúsculas)",
  "role": "ADMIN | AGENT | ASSISTANT | MARKETING",
  "currentPlan": "TRIAL | BASIC | PRO | INMOBILIARIA | LAUNCH | ILIMITADO",
  "trialEndsAt": "ISO date-time",
  "password": "string (mín. 8 chars, se hashea automáticamente)"
}
```

> **Enums verificados contra la validación real de la API** (un `PATCH` con un valor
> inválido devuelve la lista completa de opciones y no escribe nada). La versión
> anterior de este documento omitía los roles **`ASSISTANT`** y **`MARKETING`** y el
> plan **`ILIMITADO`**.
>
> Esto no es cosmético: una UI construida sobre la lista incompleta le cambiaría el rol
> a un `ASSISTANT` sin querer al guardar el formulario.

**Reglas de validación:**
- Payload inválido (tipo/formato) → `400` con `details` por campo.
- `email` ya usado por otro usuario → `409`.
- Sin ningún campo válido → `400`.

**Respuesta:**
```json
{ "success": true, "message": "User updated successfully", "user": { "id", "name", "email", "role", "currentPlan", "trialEndsAt", "updatedAt" } }
```

---

#### `DELETE /api/external/users/[id]`

**Por defecto hace _soft delete_ (desactivación reversible):** marca `deletedAt`, rota el email a `deleted-{id}-{timestamp}@vitrinaraiz.deleted` (para liberar el índice único), anula la contraseña y revoca las sesiones móviles. El usuario deja de poder iniciar sesión pero sus datos se conservan y puede reactivarse.

No permite eliminar usuarios `ADMIN`.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `hard` | boolean | `false` | `true` = borrado **físico irreversible** con cascade (elimina propiedades, leads, deals, etc.) |

**Respuesta (soft delete):**
```json
{
  "success": true,
  "message": "User deactivated successfully",
  "mode": "soft",
  "affectedData": { "properties": 0, "leads": 0, "deals": 0, "buildings": 0, "tenants": 0 }
}
```

**Respuesta (`?hard=true`):**
```json
{
  "success": true,
  "message": "User permanently deleted",
  "mode": "hard",
  "deletedData": { "properties": 0, "leads": 0, "deals": 0, "buildings": 0, "tenants": 0 }
}
```

> Si el usuario ya estaba desactivado, el soft delete responde `409`. Para restaurarlo usá el endpoint de **reactivar** (abajo).

---

### Acciones de usuario

> Todas estas acciones quedan registradas en un **log de auditoría** (evento `ADMIN_ACTION` con `adminId`, `action` y detalles) para trazabilidad de quién hizo qué.

#### `POST /api/external/users/[id]/reactivate`

Revierte el soft delete: limpia `deletedAt` y **restaura el email original** (lo recupera del log de la desactivación). El usuario deberá restablecer su contraseña (se anuló al desactivar).

**Body (opcional):**
```json
{ "email": "string (opcional, email válido)" }
```

- Si no se envía `email`, usa el email original guardado al desactivar.
- Si el email original ya está en uso por otro usuario → `409` (enviá un `email` distinto).
- Si no se puede determinar el email original y no se envía uno → `422`.

**Respuesta:**
```json
{
  "success": true,
  "message": "User reactivated successfully",
  "user": { "id", "name", "email", "role", "currentPlan" },
  "note": "El usuario deberá restablecer su contraseña (se anuló al desactivar)."
}
```

---

#### `POST /api/external/users/[id]/subscription`

Gestión administrativa del plan/suscripción de un usuario (**override manual, NO pasa por el checkout de MercadoPago**). La operación se elige con el campo `action`.

**a) Asignar / cambiar plan**
```json
{ "action": "set-plan", "plan": "PRO", "billingPeriod": "MONTHLY" }
```
- `plan`: `LAUNCH | TRIAL | BASIC | PRO | INMOBILIARIA | ILIMITADO`
- `billingPeriod` (opcional): `MONTHLY | SEMIANNUAL | ANNUAL`
- Si el usuario tiene una suscripción activa, recalcula el precio vía `changePlan`. Si no, hace un _grant_ manual del plan (y sale del estado trial si el plan es pago).

**b) Extender trial**
```json
{ "action": "extend-trial", "days": 15 }
```
o con fecha explícita:
```json
{ "action": "extend-trial", "trialEndsAt": "2026-08-01T00:00:00.000Z" }
```
- `days` extiende desde el mayor entre "ahora" y el fin de trial actual. Pone `currentPlan = TRIAL`.

**c) Cancelar suscripción**
```json
{ "action": "cancel", "downgradeTo": "BASIC" }
```
- Cancela la suscripción activa y baja el plan a `downgradeTo` (default `BASIC`).

**Respuesta (ejemplos):**
```json
{ "success": true, "message": "Plan actualizado a PRO", "plan": "PRO" }
{ "success": true, "message": "Trial extendido", "trialEndsAt": "2026-08-01T00:00:00.000Z" }
{ "success": true, "message": "Suscripción cancelada", "plan": "BASIC" }
```

> Errores: payload inválido → `400`; usuario inexistente → `404`; usuario desactivado → `409`.

---

#### `GET /api/external/users/[id]/data`

Lista **paginada** de los registros concretos de un usuario (no solo conteos). Útil para ver el detalle dentro de la ficha del usuario.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `type` | string | `properties` | `properties` · `leads` · `deals` |
| `page` | number | `1` | Página |
| `limit` | number | `20` | Por página (máx. 100) |

**Respuesta `type=properties`:**
```json
{
  "type": "properties",
  "items": [
    { "id": "string", "code": "string | null", "title": "string | null", "slug": "string | null",
      "status": "DRAFT | PUBLISHED | ...", "operation": "SALE | RENT", "price": 0,
      "isHighlighted": false, "rooms": 0, "baths": 0, "city": "string | null", "createdAt": "ISO date" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

**Respuesta `type=leads`:**
```json
{
  "type": "leads",
  "items": [
    { "id": "string", "name": "string", "email": "string | null", "phone": "string | null",
      "source": "string | null", "stage": "NEW | CONTACTED | ...",
      "property": { "id": "string", "title": "string", "code": "string" } | null, "createdAt": "ISO date" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

**Respuesta `type=deals`:**
```json
{
  "type": "deals",
  "items": [
    { "id": "string", "status": "OPEN | WON | LOST | ...", "closeDate": "ISO date | null",
      "finalValue": 0, "grossFee": 0, "netFee": 0,
      "property": { "id": "string", "title": "string", "code": "string" } | null,
      "owner": { "id": "string", "name": "string" } | null, "createdAt": "ISO date" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

---

#### `POST /api/external/users/[id]/impersonate`

Genera un **token de sesión de corta duración** para entrar a la app como ese usuario (soporte). El token es compatible con la autenticación de la app: se puede usar como `Authorization: Bearer <token>` o como cookie `vitrina_token`. Incluye el claim `impersonatedBy` para trazabilidad y **expira en 1 hora**.

- No permite impersonar usuarios `ADMIN` → `403`.
- No permite impersonar usuarios desactivados → `409`.

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJ...",
  "expiresIn": 3600,
  "tokenType": "Bearer",
  "cookieName": "vitrina_token",
  "user": { "id": "string", "name": "string", "email": "string" },
  "usage": "Usar como header \"Authorization: Bearer <token>\" o cookie \"vitrina_token\"."
}
```

---

### Estadísticas del Sistema

#### `GET /api/external/stats/overview`

Dashboard completo con todas las métricas del sistema para el período indicado.

| Parámetro | Tipo | Default | Opciones |
|-----------|------|---------|----------|
| `period` | string | `30d` | `7d` `30d` `90d` `1y` |

**Estructura de respuesta:**

La respuesta incluye además `period` y `generatedAt` (ISO) en la raíz.

> ⚠️ **El campo se llama `new`, no `newInPeriod`.** Aplica a `properties`, `leads`,
> `owners`, `buildings`, `tenants` y `rentPayments`.

#### `users`

> Todas las métricas de usuarios **excluyen a los desactivados** (soft delete). El conteo de desactivados se expone aparte en `deactivated`.

```json
{
  "total": 0,
  "active": 0,
  "deactivated": 0,
  "new": 0,
  "growthRate": 0.0,
  "byPlan": { "LAUNCH": 0, "TRIAL": 0, "BASIC": 0, "PRO": 0, "INMOBILIARIA": 0, "ILIMITADO": 0 },
  "byRole": { "ADMIN": 0, "AGENT": 0, "ASSISTANT": 0, "MARKETING": 0 },
  "trials": { "active": 0, "expired": 0 }
}
```

- `total`: usuarios activos.
- `active`: activos con al menos 1 propiedad.
- `deactivated`: desactivados vía soft delete.

> `byPlan` y `byRole` sólo traen las claves con conteo > 0: si no hay ningún
> `ASSISTANT`, la clave no aparece. No asumas que están todas.

#### `properties`
```json
{
  "total": 0,
  "published": 0,
  "highlighted": 0,
  "new": 0,
  "byStatus": { "PUBLISHED": 0, "PAUSED": 0, "DRAFT": 0, "RENTED": 0, "SOLD": 0, "NEGOTIATION": 0 },
  "byOperation": { "SALE": 0, "RENT": 0 }
}
```

#### `leads`
```json
{
  "total": 0,
  "new": 0,
  "conversionRate": 0.0,
  "byStage": { "NEW": 0, "CONTACTED": 0, "VISITED": 0, "NEGOTIATION": 0, "WON": 0, "LOST": 0 }
}
```

#### `owners`

> Sección **ausente por completo** en la versión anterior de este documento.

```json
{
  "total": 0,
  "new": 0,
  "byStage": {
    "PROSPECTO": 0, "CONTACTADO": 0, "INTERESADO": 0,
    "CONTRATADO": 0, "ACTIVO": 0, "INACTIVO": 0
  }
}
```

#### `buildings`
```json
{
  "total": 0,
  "new": 0,
  "byStatus": { "ACTIVE": 0, "INACTIVE": 0 },
  "totalUnits": 0
}
```

#### `tenants`

> Los contratos van **anidados en `contracts`**, no planos como `activeContracts`.

```json
{
  "total": 0,
  "new": 0,
  "byStatus": { "ACTIVO": 0, "PENDIENTE": 0, "INACTIVO": 0 },
  "contracts": { "total": 0, "active": 0 },
  "totalMonthlyRent": 0
}
```

#### `rentPayments`
```json
{
  "total": 0,
  "paid": 0,
  "pending": 0,
  "overdue": 0,
  "new": 0,
  "collectedRent": 0,
  "pendingRent": 0,
  "collectionRate": 0.0
}
```

#### `subscriptions`

> Los campos son **`total`** y **`revenue`**, no `totalActive` ni `revenueInPeriod`.

```json
{
  "total": 0,
  "mrr": 0,
  "arr": 0,
  "revenue": 0,
  "byTier": { "BASIC": 0, "...": 0 },
  "byPeriod": { "MONTHLY": 0, "...": 0 }
}
```

#### `analytics`
```json
{
  "totalPropertyViews": 0,
  "totalWhatsappClicks": 0,
  "totalPhoneClicks": 0,
  "contactRate": 0.0,
  "periodEvents": {
    "PROPERTY_VIEW": 0, "PROFILE_VIEW": 0, "WHATSAPP_CLICK": 0,
    "LEAD_CAPTURE": 0, "LEAD_CONSENT": 0, "PDF_DOWNLOAD": 0
  }
}
```

> `periodEvents` trae **más tipos de evento** de los tres que listaba la doc, y sólo
> incluye los que tuvieron actividad. Tratalo como un diccionario abierto.

#### `trends`

> ⚠️ **`trends` NO es un array.** Es un objeto que envuelve la serie en `data`.
> Hacerle `.map()` directamente revienta.

Serie temporal con granularidad automática según el período:
- `7d` y `30d` → agrupado por **día**
- `90d` → agrupado por **semana**
- `1y` → agrupado por **mes**

```json
{
  "granularity": "day | week | month",
  "periodDays": 30,
  "data": [
    { "date": "2026-06-14", "users": 0, "properties": 0, "leads": 0, "revenue": 0, "buildings": 0, "tenants": 0 }
  ]
}
```

#### `recentRegistrations`

Últimos 20 usuarios registrados en el período:
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "plan": "string",
    "role": "string",
    "registeredAt": "ISO date",
    "slug": "string",
    "phone": "string | null",
    "activity": { "properties": 0, "leads": 0, "buildings": 0, "tenants": 0 }
  }
]
```

#### `rankings` — Top 10 del período

```json
{
  "topViewedProperties": [
    { "propertyId": "string", "count": 0, "title": "string", "code": "string", "slug": "string", "operation": "string", "status": "string", "agent": { "id": "string", "name": "string", "slug": "string" } }
  ],
  "topWhatsappProperties": [ ... ],
  "topVisitedAgents": [
    { "userId": "string", "count": 0, "name": "string", "email": "string", "plan": "string", "slug": "string", "totalProperties": 0 }
  ],
  "topContactedAgents": [ ... ]
}
```

#### `topCities`
```json
[{ "city": "string", "department": "string", "properties": 0 }]
```

---

## API Interna — Estadísticas del Agente

**URL:** `https://vitrinaraiz.com/api/admin/stats`

Usada por el dashboard interno del agente. Autenticación mediante **sesión NextAuth** (cookie HTTP-only), no JWT.

#### `GET /api/admin/stats`

Retorna métricas del agente autenticado filtradas por período.

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `days` | number | `30` | Días a considerar: `7`, `30`, `90`, `365` |

> **Nota:** Todos los contadores de leads, conversiones, analytics y métricas financieras respetan el parámetro `days`. Los contadores de portafolio (`totalProperties`, `publishedProperties`, `featuredProperties`) siempre reflejan el inventario actual total.

**Respuesta:**
```json
{
  "period": 30,
  "totalProperties": 0,
  "publishedProperties": 0,
  "featuredProperties": 0,
  "totalLeads": 0,
  "propertyViews": 0,
  "whatsappClicks": 0,
  "profileViews": 0,
  "leadConversionRate": 0,
  "averagePropertyPrice": 0,
  "monthlyRevenue": 0,
  "propertiesByStatus": [{ "status": "string", "count": 0 }],
  "leadsByStage": [{ "stage": "string", "count": 0 }],
  "monthlyStats": [
    { "month": "ene. 2026", "properties": 0, "leads": 0, "views": 0 }
  ],
  "propertyTypes": [{ "type": "string", "count": 0, "color": "string" }],
  "saleVsRent": { "sale": 0, "rent": 0 },
  "leadSources": [{ "source": "string", "count": 0, "conversion": 0 }],
  "deviceStats": { "mobile": 0, "desktop": 0, "tablet": 0, "unknown": 0 },
  "timeOfDay": [{ "hour": "09:00", "contacts": 0 }],
  "recentActivity": [{ "type": "property | lead", "description": "string", "date": "string" }],
  "financialMetrics": {
    "totalCommissions": 0,
    "projectedRevenue": 0,
    "averageDealSize": 0,
    "roi": 0
  },
  "pipelineMetrics": {
    "averageCycleTime": 0,
    "stageConversion": [{ "from": "string", "to": "string", "rate": 0 }]
  },
  "whatsappAnalytics": {
    "totalClicks": 0,
    "conversionRate": 0,
    "topProperties": [{ "propertyId": "string", "propertyTitle": "string", "propertyCode": "string", "clicks": 0 }],
    "clicksByDay": [{ "date": "string", "clicks": 0 }],
    "averageClicksPerProperty": 0
  }
}
```

> **`clicksByDay`:** Para períodos ≤14 días se agrupa por día; para períodos >14 días se agrupa por semana automáticamente.

---

## Configuración

### Credenciales de acceso (dashboard)

Las credenciales del usuario `ADMIN` para probar la API **no se guardan en este documento**: viven en `package/.env.local`, que está excluido de Git.

```bash
# package/.env.local
VITRINA_API_URL=...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

> Si clonás el proyecto en otra máquina, ese archivo no viene incluido — hay que recrearlo. Pedí las credenciales por un canal privado, nunca por el repo.

### Variables de entorno requeridas (backend)

> Estas son del **backend** de Vitrina Raíz, no del dashboard.

```bash
JWT_SECRET="min-32-chars-random-string"
ADMIN_DASHBOARD_URL="https://admin.vitrinaraiz.com"
```

### Generar `JWT_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Errores comunes

| Código | Mensaje | Causa | Solución |
|--------|---------|-------|----------|
| `400` | Invalid payload | Body no pasa la validación Zod (PATCH / subscription) | Revisar `details` en la respuesta |
| `401` | Missing authentication token | Falta el header `Authorization` | Agregar `Bearer {token}` |
| `401` | Invalid or expired token | JWT expirado (24h) | Hacer login de nuevo |
| `403` | Forbidden / Cannot delete ADMIN / No se puede impersonar ADMIN | Acción no permitida sobre un ADMIN | Solo aplica a usuarios `AGENT` |
| `404` | User not found | El `id` no existe | Verificar el id |
| `409` | Email en uso / User already active / already deactivated | Conflicto de estado o email duplicado | Ajustar el body o el estado del usuario |
| `422` | No se pudo determinar el email original | Reactivar sin email original recuperable | Enviar `email` en el body |
| `429` | Too many login attempts | Rate limit del login (5/5min por IP) | Esperar los segundos de `Retry-After` |
| `500` | Internal server error | 🔴 **Bug abierto en `GET /users/[id]`** — falla siempre, con cualquier id | Usar `GET /users` mientras tanto. Ver el diagnóstico al principio |
| CORS | — | `ADMIN_DASHBOARD_URL` mal configurado | Verificar la variable y reiniciar PM2 |


