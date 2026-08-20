'use client'

import { Icon } from '@iconify/react'
import CardBox from '../../shared/CardBox'
import { formatCurrency, formatNumber } from '@/lib/vitrina/format'
import type { PriceSource } from '@/lib/vitrina/plans'
import type { Plan } from '@/lib/vitrina/types'

export interface PlanRow {
  plan: Plan
  users: number
  /** Tarifa mensual aplicada al plan, o null si no se pudo determinar. */
  price: number | null
  /** Suma mensual del plan, contando los montos reales de cada usuario. */
  subtotal: number
  /** Usuarios del plan sin monto conocido. */
  unpriced: number
  /** De dónde salió la tarifa mostrada. */
  source: PriceSource
}

const PLAN_STYLE: Partial<Record<Plan, string>> = {
  BASIC: 'bg-lightinfo text-info',
  PRO: 'bg-lightsuccess text-success',
  INMOBILIARIA: 'bg-lightsecondary text-secondary',
  ILIMITADO: 'bg-lighterror text-error',
}

const SOURCE_LABEL: Record<PriceSource, string> = {
  override: 'Incluye precios pactados con usuarios concretos',
  subscription: 'Según suscripciones reales',
  config: 'Tarifa fijada a mano',
  derived: 'Deducida de suscripciones existentes',
  unknown: 'Sin tarifa conocida',
}

const PlanBreakdown = ({ rows }: { rows: PlanRow[] }) => (
  <CardBox className='p-6' static>
    <div className='mb-5'>
      <h2 className='card-title'>Ingreso por plan</h2>
      <p className='text-sm text-muted-foreground'>
        Cuánto aporta cada plan al mes
      </p>
    </div>

    {rows.length === 0 ? (
      <p className='py-10 text-center text-sm text-muted-foreground'>
        Ningún usuario activo en un plan de pago.
      </p>
    ) : (
      <ul className='space-y-4'>
        {rows.map((row) => (
          <li key={row.plan}>
            <div className='flex flex-wrap items-baseline justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    PLAN_STYLE[row.plan] ?? 'bg-muted text-muted-foreground'
                  }`}>
                  {row.plan}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {formatNumber(row.users)} usuario(s)
                </span>
              </div>

              {/* Un plan sin tarifa conocida aporta "desconocido", no cero:
                  mostrar $0 lo haría pasar por gratuito. */}
              {row.subtotal > 0 ? (
                <span className='text-sm font-semibold'>
                  {formatCurrency(row.subtotal)}
                  <span className='font-normal text-muted-foreground'> /mes</span>
                </span>
              ) : (
                <span className='text-sm text-muted-foreground'>Sin calcular</span>
              )}
            </div>

            <div className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
              <span title={SOURCE_LABEL[row.source]}>
                {row.price !== null
                  ? `${formatCurrency(row.price)} por usuario`
                  : 'Sin tarifa conocida'}
              </span>

              {/* El icono acompaña al texto: la advertencia no depende del color. */}
              {row.unpriced > 0 && (
                <span className='inline-flex items-center gap-1 text-warning'>
                  <Icon icon='solar:danger-triangle-linear' />
                  {formatNumber(row.unpriced)} sin monto
                </span>
              )}

              {row.source === 'derived' && (
                <span className='inline-flex items-center gap-1'>
                  <Icon icon='solar:info-circle-linear' />
                  estimado
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}
  </CardBox>
)

export default PlanBreakdown
