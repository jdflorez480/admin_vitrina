'use client'

// Cliente por el <Icon> de Iconify (ver StatTiles).
import { Icon } from '@iconify/react'
import CardBox from '../shared/CardBox'
import { formatNumber } from '@/lib/vitrina/format'
import type { AgentRanking, PropertyRanking, TopCity } from '@/lib/vitrina/types'

const Rank = ({ position }: { position: number }) => (
  <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-lightprimary text-xs font-semibold text-primary'>
    {position}
  </span>
)

const Metric = ({ value, icon }: { value: number; icon: string }) => (
  <span className='flex shrink-0 items-center gap-1 text-sm font-medium'>
    <Icon icon={icon} className='text-base text-muted-foreground' />
    {formatNumber(value)}
  </span>
)

export const TopProperties = ({
  title,
  subtitle,
  properties,
  icon,
}: {
  title: string
  subtitle: string
  properties: PropertyRanking[]
  icon: string
}) => (
  <CardBox className='h-full p-6'>
    <div className='mb-4'>
      <h5 className='text-lg font-semibold'>{title}</h5>
      <p className='text-sm text-muted-foreground'>{subtitle}</p>
    </div>

    {properties.length === 0 ? (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        Sin datos en este período.
      </p>
    ) : (
      <ul className='divide-y divide-border'>
        {properties.map((p, i) => (
          <li key={p.propertyId} className='flex items-center gap-3 py-3'>
            <Rank position={i + 1} />
            <div className='min-w-0 flex-1'>
              {/* truncate: los títulos son largos y no deben romper la tarjeta. */}
              <p className='truncate text-sm font-medium'>{p.title?.trim() || p.code}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {p.agent?.name ?? 'Sin agente'} · {p.operation}
              </p>
            </div>
            <Metric value={p.count} icon={icon} />
          </li>
        ))}
      </ul>
    )}
  </CardBox>
)

export const TopAgents = ({
  title,
  subtitle,
  agents,
  icon,
}: {
  title: string
  subtitle: string
  agents: AgentRanking[]
  icon: string
}) => (
  <CardBox className='h-full p-6'>
    <div className='mb-4'>
      <h5 className='text-lg font-semibold'>{title}</h5>
      <p className='text-sm text-muted-foreground'>{subtitle}</p>
    </div>

    {agents.length === 0 ? (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        Sin datos en este período.
      </p>
    ) : (
      <ul className='divide-y divide-border'>
        {agents.map((a, i) => (
          <li key={a.userId} className='flex items-center gap-3 py-3'>
            <Rank position={i + 1} />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-medium'>{a.name}</p>
              <p className='truncate text-xs text-muted-foreground'>
                {a.plan} · {formatNumber(a.totalProperties)} propiedades
              </p>
            </div>
            <Metric value={a.count} icon={icon} />
          </li>
        ))}
      </ul>
    )}
  </CardBox>
)

export const TopCities = ({ cities }: { cities: TopCity[] }) => {
  const max = Math.max(...cities.map((c) => c.properties), 1)

  return (
    <CardBox className='h-full p-6'>
      <div className='mb-4'>
        <h5 className='text-lg font-semibold'>Ciudades con más propiedades</h5>
        <p className='text-sm text-muted-foreground'>Inventario por ubicación</p>
      </div>

      <ul className='space-y-4'>
        {cities.map((c) => (
          <li key={`${c.city}-${c.department}`}>
            <div className='flex items-baseline justify-between gap-3'>
              <span className='truncate text-sm font-medium'>{c.city}</span>
              <span className='shrink-0 text-sm text-muted-foreground'>
                {formatNumber(c.properties)}
              </span>
            </div>
            <p className='mb-1.5 text-xs text-muted-foreground'>{c.department}</p>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-lightprimary'>
              <div
                className='h-full rounded-full bg-primary'
                style={{ width: `${(c.properties / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </CardBox>
  )
}
