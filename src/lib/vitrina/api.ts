import 'server-only'

import { getSession } from './session'
import { SORT_VALUES } from './types'
import type {
  LoginResponse,
  StatsOverview,
  User,
  UserDataResponse,
  UserDataType,
  UserFilters,
  UsersResponse,
} from './types'

const API_URL = process.env.VITRINA_API_URL

/**
 * Todas las llamadas salen del servidor de Next, nunca del navegador.
 *
 * La API sólo permite CORS desde https://admin.vitrinaraiz.com, así que un fetch
 * directo desde el cliente sería bloqueado por el navegador en cualquier otro
 * origen. Servidor a servidor no aplica CORS, y de paso el JWT no se expone.
 */
async function request<T>(
  path: string,
  { token, ...init }: RequestInit & { token?: string } = {},
): Promise<T> {
  if (!API_URL) {
    throw new ApiError('Falta la variable VITRINA_API_URL (definila en .env.local)', 500)
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: 'no-store',
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(
      body?.error ?? body?.message ?? `La API respondió ${res.status}`,
      res.status,
      // El login devuelve Retry-After al pasarse del rate limit (5 intentos / 5 min).
      res.headers.get('retry-after'),
    )
  }

  return body as T
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter?: string | null,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

/** Llamada autenticada con el token de la sesión actual. */
async function authed<T>(path: string): Promise<T> {
  const session = await getSession()
  if (!session) throw new ApiError('No hay sesión activa', 401)

  return request<T>(path, { token: session.token })
}

export function getStatsOverview(period: string) {
  return authed<StatsOverview>(`/stats/overview?period=${period}`)
}

export const PAGE_SIZE = 20

/**
 * Listado de usuarios: filtra, ordena y pagina.
 *
 * Trabaja sobre el listado COMPLETO en vez de delegar en la paginación de la API,
 * porque la API no sabe ordenar (ignora sort/sortBy/orderBy). Ordenar sólo la
 * página que vino del servidor respondería "el que más propiedades tiene de estos
 * 20", que no es la pregunta que hace un admin.
 *
 * El escaneo va cacheado 30 s. Con ~200 usuarios es barato; con miles habría que
 * pedirle al backend un `sort` de verdad.
 */
export async function listUsers(filters: UserFilters = {}): Promise<UsersResponse> {
  const all = await scanAllUsers()

  const counts = {
    active: all.filter((u) => !u.deletedAt).length,
    deactivated: all.filter((u) => u.deletedAt).length,
    total: all.length,
  }

  const status = filters.status ?? 'active'
  const term = filters.search?.trim().toLowerCase()

  let rows = all.filter((u) => {
    if (status === 'active' && u.deletedAt) return false
    if (status === 'deleted' && !u.deletedAt) return false

    if (filters.plan && u.currentPlan !== filters.plan) return false
    if (filters.role && u.role !== filters.role) return false

    if (term) {
      const haystack = `${u.name} ${u.email}`.toLowerCase()
      if (!haystack.includes(term)) return false
    }

    return true
  })

  const sort = filters.sort ?? 'created'
  const dir = filters.dir ?? 'desc'
  const value = SORT_VALUES[sort]

  rows = [...rows].sort((a, b) => {
    const av = value(a)
    const bv = value(b)

    const cmp =
      typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv, 'es')
        : Number(av) - Number(bv)

    return dir === 'asc' ? cmp : -cmp
  })

  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages)
  const start = (page - 1) * PAGE_SIZE

  return {
    users: rows.slice(start, start + PAGE_SIZE),
    counts,
    filter: { status },
    pagination: { page, limit: PAGE_SIZE, total, totalPages },
  }
}

/**
 * Trae un usuario por id.
 *
 * NO usa `GET /users/[id]`: ese endpoint responde 500 para cualquier id — probado
 * con varios usuarios reales y con un id inexistente (que debería dar 404), así
 * que está roto del lado del servidor, no es un problema de datos.
 *
 * Mientras tanto lo sacamos del listado, que devuelve exactamente los mismos
 * campos (perfil, stats, subscription) y sí funciona. Recorre las páginas hasta
 * encontrarlo: con ~200 usuarios son 2 o 3 requests. Si la base crece mucho esto
 * se vuelve caro — cuando arreglen el endpoint, esta función se reduce a una línea:
 *
 *     return authed<User>(`/users/${id}`)
 */
/**
 * Caché en memoria del escaneo completo de usuarios.
 *
 * Sin esto, cada clic en la paginación o en una pestaña de la ficha vuelve a
 * recorrer el listado entero (varias llamadas a la API remota, ~1,8 s). El TTL
 * es corto y las mutaciones lo invalidan a mano, así que un admin nunca ve sus
 * propios cambios desactualizados.
 *
 * Desaparece entero cuando arreglen `GET /users/[id]`.
 */
let usersCache: { at: number; users: User[] } | null = null
const CACHE_TTL_MS = 30_000

export function invalidateUsersCache() {
  usersCache = null
}

async function scanAllUsers(): Promise<User[]> {
  if (usersCache && Date.now() - usersCache.at < CACHE_TTL_MS) {
    return usersCache.users
  }

  const LIMIT = 100

  // La primera página nos dice cuántas hay; el resto se piden en paralelo.
  const first = await authed<UsersResponse>(
    `/users?status=all&limit=${LIMIT}&page=1`,
  )

  const { totalPages } = first.pagination
  const rest =
    totalPages > 1
      ? await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            authed<UsersResponse>(
              `/users?status=all&limit=${LIMIT}&page=${i + 2}`,
            ),
          ),
        )
      : []

  const users = [first, ...rest].flatMap((res) => res.users)
  usersCache = { at: Date.now(), users }

  return users
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await scanAllUsers()
  return users.find((u) => u.id === id) ?? null
}

export function getUserData<T>(id: string, type: UserDataType, page = 1) {
  return authed<UserDataResponse<T>>(
    `/users/${id}/data?type=${type}&page=${page}&limit=${PAGE_SIZE}`,
  )
}

// ------------------------------------------------------- Acciones sobre usuarios
//
// Quedan registradas en el log de auditoría del backend (evento ADMIN_ACTION con
// el id del admin que las ejecuta).

/** Llamada autenticada con método y cuerpo. */
async function mutate<T>(path: string, method: string, body?: unknown): Promise<T> {
  const session = await getSession()
  if (!session) throw new ApiError('No hay sesión activa', 401)

  return request<T>(path, {
    method,
    token: session.token,
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

export interface UserPatch {
  name?: string
  email?: string
  role?: string
  currentPlan?: string
  password?: string
}

export function updateUser(id: string, patch: UserPatch) {
  return mutate<{ success: boolean; message: string }>(`/users/${id}`, 'PATCH', patch)
}

/** Desactiva (reversible): marca deletedAt, rota el email y revoca sesiones. */
export function deactivateUser(id: string) {
  return mutate<{ success: boolean; mode: string; affectedData: Record<string, number> }>(
    `/users/${id}`,
    'DELETE',
  )
}

/** Borrado FÍSICO e irreversible: arrastra propiedades, leads, deals… en cascada. */
export function hardDeleteUser(id: string) {
  return mutate<{ success: boolean; mode: string; deletedData: Record<string, number> }>(
    `/users/${id}?hard=true`,
    'DELETE',
  )
}

export function reactivateUser(id: string, email?: string) {
  return mutate<{ success: boolean; message: string; note?: string }>(
    `/users/${id}/reactivate`,
    'POST',
    email ? { email } : undefined,
  )
}

export type SubscriptionAction =
  | { action: 'set-plan'; plan: string; billingPeriod?: string }
  | { action: 'extend-trial'; days: number }
  | { action: 'cancel'; downgradeTo?: string }

export function changeSubscription(id: string, payload: SubscriptionAction) {
  return mutate<{ success: boolean; message: string }>(
    `/users/${id}/subscription`,
    'POST',
    payload,
  )
}

export function impersonateUser(id: string) {
  return mutate<{ success: boolean; token: string; expiresIn: number }>(
    `/users/${id}/impersonate`,
    'POST',
  )
}
