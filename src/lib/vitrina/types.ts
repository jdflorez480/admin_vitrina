// Tipos de la API externa de Vitrina Raíz.
//
// Escritos contra la respuesta real de la API, no contra documetacion.md:
// el documento tiene varios campos desactualizados (ver notas abajo).

// Enums confirmados contra la validación real de la API (un PATCH con un valor
// inválido devuelve la lista completa). documetacion.md se queda corta en ambos:
// omite los roles ASSISTANT y MARKETING, y el plan ILIMITADO.
export type Plan =
  | 'LAUNCH'
  | 'TRIAL'
  | 'BASIC'
  | 'PRO'
  | 'INMOBILIARIA'
  | 'ILIMITADO'

export type Role = 'AGENT' | 'ADMIN' | 'ASSISTANT' | 'MARKETING'

export const PLANS: Plan[] = [
  'LAUNCH',
  'TRIAL',
  'BASIC',
  'PRO',
  'INMOBILIARIA',
  'ILIMITADO',
]

export const ROLES: Role[] = ['AGENT', 'ADMIN', 'ASSISTANT', 'MARKETING']

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  expiresIn: number
  user: AdminUser
}

/** Conteos por clave; la API puede añadir claves nuevas (estados, planes, eventos). */
type Breakdown = Record<string, number>

export interface StatsOverview {
  period: string
  generatedAt: string

  users: {
    total: number
    /** Activos = con al menos 1 propiedad (no es "no desactivados"). */
    active: number
    deactivated: number
    new: number
    growthRate: number
    byPlan: Breakdown
    byRole: Breakdown
    trials: { active: number; expired: number }
  }

  properties: {
    total: number
    published: number
    highlighted: number
    // La doc lo llama `newInPeriod`; la API devuelve `new`.
    new: number
    byStatus: Breakdown
    byOperation: Breakdown
  }

  leads: {
    total: number
    new: number
    conversionRate: number
    byStage: Breakdown
  }

  /** Sección ausente por completo en documetacion.md. */
  owners: {
    total: number
    new: number
    byStage: Breakdown
  }

  buildings: {
    total: number
    new: number
    byStatus: Breakdown
    totalUnits: number
  }

  tenants: {
    total: number
    new: number
    byStatus: Breakdown
    // La doc dice `activeContracts` plano; la API anida en `contracts`.
    contracts: { total: number; active: number }
    totalMonthlyRent: number
  }

  rentPayments: {
    total: number
    paid: number
    pending: number
    overdue: number
    new: number
    collectedRent: number
    pendingRent: number
    collectionRate: number
  }

  subscriptions: {
    // La doc dice `totalActive` y `revenueInPeriod`.
    total: number
    mrr: number
    arr: number
    revenue: number
    byTier: Breakdown
    byPeriod: Breakdown
  }

  analytics: {
    totalPropertyViews: number
    totalWhatsappClicks: number
    totalPhoneClicks: number
    contactRate: number
    periodEvents: Breakdown
  }

  /** La doc dice que `trends` es un array. En realidad envuelve la serie en `data`. */
  trends: {
    granularity: 'day' | 'week' | 'month'
    periodDays: number
    data: TrendPoint[]
  }

  recentRegistrations: RecentRegistration[]
  rankings: {
    topViewedProperties: PropertyRanking[]
    topWhatsappProperties: PropertyRanking[]
    topVisitedAgents: AgentRanking[]
    topContactedAgents: AgentRanking[]
  }
  topCities: TopCity[]
}

export interface TrendPoint {
  date: string
  users: number
  properties: number
  leads: number
  revenue: number
  buildings: number
  tenants: number
}

export interface RecentRegistration {
  id: string
  name: string
  email: string
  plan: Plan
  role: Role
  registeredAt: string
  slug: string
  phone: string | null
  activity: {
    properties: number
    leads: number
    buildings: number
    tenants: number
  }
}

export interface PropertyRanking {
  propertyId: string
  count: number
  title: string
  code: string
  slug: string
  operation: string
  status: string
  agent: { id: string; name: string; slug: string } | null
}

export interface AgentRanking {
  userId: string
  count: number
  name: string
  email: string
  plan: Plan
  slug: string
  totalProperties: number
}

export interface TopCity {
  city: string
  department: string
  properties: number
}

// ---------------------------------------------------------------- Usuarios

export interface Subscription {
  id: string
  tier: string
  status: string
  billingPeriod: string
  amount: number
  nextBillingDate: string
  startDate: string
  endDate: string
}

export interface UserStats {
  totalProperties: number
  publishedProperties: number
  soldProperties: number
  totalLeads: number
  totalOwners: number
  totalDeals: number
  totalCommissions: number
  totalWhatsappClicks: number
  totalPropertyViews: number
  totalBuildings: number
  totalTenants: number
  activeTenants: number
  overduePayments: number
  totalMonthlyRent: number
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  currentPlan: Plan
  trialStartedAt: string | null
  trialEndsAt: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
  /** No nulo ⇒ el usuario está desactivado (soft delete). */
  deletedAt: string | null
  profile: {
    slug: string
    phone: string | null
    whatsapp: string | null
    bio: string | null
    logoUrl: string | null
  } | null
  /** null cuando no tiene trial (la doc decía 0). */
  trialDaysRemaining: number | null
  trialStatus: 'active' | 'expired' | 'none'
  /** Suscripción vigente, o null. La API además expone `subscriptions[]` con el historial. */
  subscription: Subscription | null
  subscriptions: Subscription[]
  stats: UserStats
  _count: {
    properties: number
    leads: number
    owners: number
    deals: number
    buildings: number
    tenants: number
  }
}

export interface UsersResponse {
  users: User[]
  /** Global: no depende de la página ni del filtro de estado. */
  counts: { active: number; deactivated: number; total: number }
  filter: { status: string }
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface UserFilters {
  search?: string
  plan?: string
  role?: string
  status?: string
  page?: number
  sort?: SortKey
  dir?: 'asc' | 'desc'
}

/**
 * Criterios de orden.
 *
 * La API **ignora** cualquier parámetro de orden (probado con sort, sortBy,
 * orderBy…): siempre devuelve la misma secuencia. Así que ordenamos acá, sobre
 * el listado completo — nunca sólo sobre la página visible, que daría "el que
 * más propiedades tiene de estos 20" en vez de "de todos".
 */
export type SortKey =
  | 'properties'
  | 'published'
  | 'leads'
  | 'views'
  | 'whatsapp'
  | 'rent'
  | 'created'
  | 'name'

export const SORT_VALUES: Record<SortKey, (u: User) => number | string> = {
  properties: (u) => u.stats.totalProperties,
  published: (u) => u.stats.publishedProperties,
  leads: (u) => u.stats.totalLeads,
  views: (u) => u.stats.totalPropertyViews,
  whatsapp: (u) => u.stats.totalWhatsappClicks,
  rent: (u) => u.stats.totalMonthlyRent,
  created: (u) => new Date(u.createdAt).getTime(),
  name: (u) => u.name.toLowerCase(),
}

// Registros asociados a un usuario (GET /users/[id]/data)

export type UserDataType = 'properties' | 'leads' | 'deals'

export interface UserProperty {
  id: string
  code: string | null
  title: string | null
  slug: string | null
  status: string
  operation: string
  price: number
  isHighlighted: boolean
  rooms: number
  baths: number
  city: string | null
  createdAt: string
}

export interface UserLead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  stage: string
  property: { id: string; title: string; code: string } | null
  createdAt: string
}

export interface UserDeal {
  id: string
  status: string
  closeDate: string | null
  finalValue: number
  grossFee: number
  netFee: number
  property: { id: string; title: string; code: string } | null
  owner: { id: string; name: string } | null
  createdAt: string
}

export interface UserDataResponse<T> {
  type: UserDataType
  items: T[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}
