import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ApiError, getSubscribers } from '@/lib/vitrina/api'
import {
  PAID_PLANS,
  derivePlanPrices,
  priceUser,
  type PriceSource,
} from '@/lib/vitrina/plans'
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/vitrina/format'
import type { Plan } from '@/lib/vitrina/types'
import CardBox from '@/app/components/shared/CardBox'
import Notice from '@/app/components/shared/Notice'
import PageHeader from '@/app/components/shared/PageHeader'
import StatTile, { type Tile } from '@/app/components/shared/StatTile'
import PlanBreakdown, {
  type PlanRow,
} from '@/app/components/vitrina/plans/PlanBreakdown'
import SubscribersTable, {
  type SubscriberRow,
} from '@/app/components/vitrina/plans/SubscribersTable'

export const metadata: Metadata = { title: 'Planes de pago' }

export default async function PaidPlansPage() {
  let data
  try {
    data = await getSubscribers()
  } catch (err) {
    // El JWT dura 24 h: si venció, la cookie sigue ahí pero la API responde 401.
    if (err instanceof ApiError && err.status === 401) redirect('/auth/login')
    throw err
  }

  const { paid, trials, churned, activeTotal } = data

  // Los planes se asignan a mano, así que casi nadie tiene registro de
  // suscripción. La tarifa de cada plan se deduce de los pocos que sí lo tienen.
  const reference = derivePlanPrices([...paid, ...churned])
  const priced = paid.map((user) => priceUser(user, reference))

  const mrr = priced.reduce((sum, p) => sum + (p.monthly ?? 0), 0)
  const withPrice = priced.filter((p) => p.monthly !== null)
  const unpriced = priced.length - withPrice.length
  const average = withPrice.length ? mrr / withPrice.length : 0

  // Ingreso mensual que se fue con los usuarios desactivados que pagaban.
  const churnedMrr = churned
    .map((user) => priceUser(user, reference))
    .reduce((sum, p) => sum + (p.monthly ?? 0), 0)

  const tiles: Tile[] = [
    {
      label: 'Usuarios de pago',
      value: formatNumber(paid.length),
      hint: `de ${formatNumber(activeTotal)} activos · ${formatNumber(trials.length)} en trial`,
      icon: 'solar:users-group-two-rounded-bold-duotone',
      tone: 'primary',
    },
    {
      label: 'Ingreso mensual',
      value: formatCompactCurrency(mrr),
      hint:
        unpriced > 0
          ? `${formatNumber(unpriced)} usuario(s) sin monto conocido`
          : 'Todos los usuarios tienen monto',
      icon: 'solar:wallet-money-bold-duotone',
      tone: 'success',
    },
    {
      label: 'Ingreso anual',
      value: formatCompactCurrency(mrr * 12),
      hint: 'Proyección del mensual actual a 12 meses',
      icon: 'solar:calendar-bold-duotone',
      tone: 'info',
    },
    {
      label: 'Ticket promedio',
      value: average ? formatCurrency(Math.round(average)) : '—',
      hint: churnedMrr
        ? `${formatCompactCurrency(churnedMrr)} perdidos por desactivación`
        : 'Sin bajas registradas',
      icon: 'solar:tag-price-bold-duotone',
      tone: 'warning',
    },
  ]

  // Desglose por plan, de mayor a menor aporte.
  const planRows: PlanRow[] = PAID_PLANS.map((plan): PlanRow => {
    const inPlan = priced.filter((p) => p.user.currentPlan === plan)
    const subtotal = inPlan.reduce((sum, p) => sum + (p.monthly ?? 0), 0)
    const missing = inPlan.filter((p) => p.monthly === null).length

    // El origen del plan es el de mayor confianza que aparezca entre sus usuarios.
    const order: PriceSource[] = [
      'override',
      'subscription',
      'config',
      'derived',
      'unknown',
    ]
    const source =
      order.find((s) => inPlan.some((p) => p.source === s)) ?? 'unknown'

    const known = inPlan.length - missing

    return {
      plan: plan as Plan,
      users: inPlan.length,
      // Tarifa representativa: lo que paga en promedio quien sí tiene monto.
      price: known ? Math.round(subtotal / known) : null,
      subtotal,
      unpriced: missing,
      source,
    }
  })
    .filter((row) => row.users > 0)
    .sort((a, b) => b.subtotal - a.subtotal)

  const rows: SubscriberRow[] = priced
    .map(({ user, monthly, source, listPrice }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.currentPlan,
      slug: user.profile?.slug ?? null,
      monthly,
      source,
      listPrice: listPrice ?? null,
      properties: user.stats.totalProperties,
      leads: user.stats.totalLeads,
      createdAt: user.createdAt,
      renewsAt: user.subscription?.nextBillingDate ?? null,
    }))
    // Primero quien más aporta; a igual monto, el más nuevo.
    .sort(
      (a, b) =>
        (b.monthly ?? 0) - (a.monthly ?? 0) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

  const estimated = priced.filter((p) => p.source === 'derived').length

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-12'>
        <PageHeader
          icon='solar:crown-bold-duotone'
          title='Planes de pago'
          subtitle={`${formatNumber(paid.length)} usuario(s) activos en BASIC, PRO, INMOBILIARIA o ILIMITADO`}
        />
      </div>

      {/* Los planes se asignan a mano: hay que decir de dónde salen las cifras
          antes de que alguien las tome por facturación confirmada. */}
      {(estimated > 0 || unpriced > 0) && (
        <div className='col-span-12'>
          <Notice variant='warning'>
            {estimated > 0 && (
              <>
                {formatNumber(estimated)} usuario(s) no tienen registro de
                suscripción: se les aplica la tarifa deducida de las suscripciones
                reales de su plan.{' '}
              </>
            )}
            {unpriced > 0 && (
              <>
                Otros {formatNumber(unpriced)} no suman al total porque no hay
                ninguna suscripción de su plan de la que deducir el precio: fijá su
                tarifa en <code>PLAN_PRICES</code> (src/lib/vitrina/plans.ts).
              </>
            )}
          </Notice>
        </div>
      )}

      {tiles.map((tile) => (
        <div key={tile.label} className='col-span-12 sm:col-span-6 xl:col-span-3'>
          <StatTile tile={tile} />
        </div>
      ))}

      <div className='col-span-12 xl:col-span-4'>
        <PlanBreakdown rows={planRows} />
      </div>

      <div className='col-span-12 xl:col-span-8'>
        <CardBox className='p-6' static>
          <div className='mb-5'>
            <h2 className='card-title'>Usuarios en plan de pago</h2>
            <p className='text-sm text-muted-foreground'>
              Ordenados por lo que aportan al mes
            </p>
          </div>

          <SubscribersTable rows={rows} />
        </CardBox>
      </div>
    </div>
  )
}
