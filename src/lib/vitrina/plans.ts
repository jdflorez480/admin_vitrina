import type { Plan, Subscription, User } from './types'

/** Planes sin cobro: LAUNCH es el gratuito y TRIAL es la prueba. */
export const FREE_PLANS: Plan[] = ['LAUNCH', 'TRIAL']

/** Planes que generan ingreso. TRIAL queda fuera: todavía no paga. */
export const PAID_PLANS: Plan[] = ['BASIC', 'PRO', 'INMOBILIARIA', 'ILIMITADO']

export const isPaidPlan = (plan: Plan) => PAID_PLANS.includes(plan)

/**
 * Precios mensuales de lista, en COP.
 *
 * Lo que se ponga acá gana sobre el precio deducido de las suscripciones
 * (`derivePlanPrices`), pero no sobre la suscripción propia de un usuario: si
 * alguien tiene un monto pactado distinto, ese sigue mandando.
 *
 * Los planes que no figuren acá se deducen solos, así que basta con listar los
 * que no tienen ninguna suscripción registrada de la que sacar la tarifa.
 */
export const PLAN_PRICES: Partial<Record<Plan, number>> = {
  PRO: 49_900,
  INMOBILIARIA: 149_000,
}

/**
 * Precios pactados con un usuario concreto, en COP mensuales.
 *
 * Para descuentos negociados que no se reflejan en ninguna suscripción. Gana
 * sobre todo lo demás: es lo que un humano afirma que esa persona paga.
 *
 * La clave puede ser el id del usuario o su email — se prueba con los dos. El
 * email es más legible, pero si le cambiás el correo a alguien desde el panel
 * hay que actualizarlo también acá, o volverá a la tarifa de lista.
 */
export const USER_PRICES: Record<string, number> = {
  // Batteca Group — INMOBILIARIA con descuento (lista: $149.000).
  'battecagroup@gmail.com': 65_900,
}

/**
 * Monto mensual de una suscripción.
 *
 * Las anuales se dividen entre 12: mezclar un cobro anual con mensuales en la
 * misma suma daría un MRR inflado por doce.
 */
export function monthlyFromSubscription(sub: Subscription | null): number | null {
  if (!sub || !sub.amount) return null

  const period = (sub.billingPeriod ?? '').toUpperCase()
  const isAnnual = period.startsWith('ANNUAL') || period.startsWith('YEAR')

  return isAnnual ? sub.amount / 12 : sub.amount
}

/**
 * Tarifa de referencia por plan, deducida de las suscripciones que sí existen.
 *
 * Los planes se asignan a mano, así que la mayoría de usuarios de pago no tiene
 * registro de suscripción y por tanto no tiene monto. Pero los pocos que sí lo
 * tienen delatan cuánto vale cada plan: se toma el monto más repetido de cada
 * uno (la moda, no el promedio — un descuento puntual no debe mover la tarifa).
 */
export function derivePlanPrices(users: User[]): Partial<Record<Plan, number>> {
  const seen = new Map<Plan, Map<number, number>>()

  for (const user of users) {
    for (const sub of user.subscriptions ?? []) {
      const amount = monthlyFromSubscription(sub)
      if (!amount) continue

      // El `tier` de la suscripción es el plan; puede diferir del currentPlan si
      // el usuario cambió de plan después.
      const plan = sub.tier as Plan
      if (!isPaidPlan(plan)) continue

      const counts = seen.get(plan) ?? new Map<number, number>()
      counts.set(amount, (counts.get(amount) ?? 0) + 1)
      seen.set(plan, counts)
    }
  }

  const prices: Partial<Record<Plan, number>> = {}

  for (const [plan, counts] of seen) {
    let best = 0
    let bestCount = 0

    for (const [amount, count] of counts) {
      // Empate: gana el monto más alto, que suele ser la tarifa de lista.
      if (count > bestCount || (count === bestCount && amount > best)) {
        best = amount
        bestCount = count
      }
    }

    if (best > 0) prices[plan] = best
  }

  return prices
}

/** De dónde salió el monto que se le atribuye a un usuario. */
export type PriceSource =
  /** Precio pactado a mano con esa persona (descuento negociado). */
  | 'override'
  /** Tiene suscripción activa: es el monto que realmente factura. */
  | 'subscription'
  /** Tarifa fijada a mano en PLAN_PRICES. */
  | 'config'
  /** Tarifa deducida de las suscripciones de otros usuarios del mismo plan. */
  | 'derived'
  /** No hay forma de saber cuánto paga. */
  | 'unknown'

export interface PricedUser {
  user: User
  /** Monto mensual en COP, o null si no se pudo determinar. */
  monthly: number | null
  source: PriceSource
  /**
   * Tarifa de lista del plan, presente sólo cuando el usuario paga menos que
   * ella. Sirve para mostrar el descuento en vez de un número suelto.
   */
  listPrice?: number
}

/**
 * Le pone precio mensual a un usuario, en orden de confianza: el precio pactado
 * con él, su propia suscripción, la tarifa configurada del plan y por último la
 * deducida de las suscripciones de otros.
 */
export function priceUser(
  user: User,
  derived: Partial<Record<Plan, number>>,
): PricedUser {
  const list = PLAN_PRICES[user.currentPlan] ?? derived[user.currentPlan]

  /** Marca el descuento cuando el monto real queda por debajo de la lista. */
  const withList = (priced: PricedUser): PricedUser =>
    list && priced.monthly !== null && priced.monthly < list
      ? { ...priced, listPrice: list }
      : priced

  const pacted = USER_PRICES[user.id] ?? USER_PRICES[user.email]
  if (pacted) return withList({ user, monthly: pacted, source: 'override' })

  const own = monthlyFromSubscription(user.subscription)
  if (own) return withList({ user, monthly: own, source: 'subscription' })

  const configured = PLAN_PRICES[user.currentPlan]
  if (configured) return { user, monthly: configured, source: 'config' }

  const guess = derived[user.currentPlan]
  if (guess) return { user, monthly: guess, source: 'derived' }

  return { user, monthly: null, source: 'unknown' }
}
