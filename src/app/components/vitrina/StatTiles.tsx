'use client'

// Cliente por el <Icon> de Iconify, que no puede renderizarse en el servidor.
// Recibe sólo datos ya serializados, así que no arrastra nada más al bundle.
import { Icon } from '@iconify/react'
import CardBox from '../shared/CardBox'
import {
  formatCompactCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/vitrina/format'
import type { StatsOverview } from '@/lib/vitrina/types'

interface Tile {
  label: string
  value: string
  hint: string
  icon: string
  color: string
  bg: string
  /** Variación porcentual; sólo la trae "Usuarios". */
  delta?: number
}

const StatTile = ({ tile }: { tile: Tile }) => (
  <CardBox className='p-6'>
    <div className='flex items-start justify-between gap-4'>
      <div className='min-w-0'>
        <p className='text-sm text-muted-foreground'>{tile.label}</p>
        <h3 className='mt-1 text-2xl font-semibold tracking-tight'>{tile.value}</h3>

        <div className='mt-2 flex flex-wrap items-center gap-2'>
          {tile.delta !== undefined && (
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                tile.delta >= 0
                  ? 'bg-lightsuccess text-success'
                  : 'bg-lighterror text-error'
              }`}>
              {/* El icono acompaña al color: el signo no se comunica sólo con color. */}
              <Icon
                icon={tile.delta >= 0 ? 'solar:arrow-up-linear' : 'solar:arrow-down-linear'}
                className='text-sm'
              />
              {formatPercent(Math.abs(tile.delta))}
            </span>
          )}
          <p className='text-xs text-muted-foreground'>{tile.hint}</p>
        </div>
      </div>

      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full ${tile.bg}`}>
        <Icon icon={tile.icon} className={`text-xl ${tile.color}`} />
      </span>
    </div>
  </CardBox>
)

const StatTiles = ({ stats }: { stats: StatsOverview }) => {
  const tiles: Tile[] = [
    {
      label: 'Usuarios',
      value: formatNumber(stats.users.total),
      hint: `${formatNumber(stats.users.new)} nuevos en el período`,
      delta: stats.users.growthRate,
      icon: 'solar:users-group-rounded-linear',
      color: 'text-primary',
      bg: 'bg-lightprimary',
    },
    {
      label: 'Propiedades',
      value: formatNumber(stats.properties.total),
      hint: `${formatNumber(stats.properties.published)} publicadas · ${formatNumber(stats.properties.highlighted)} destacadas`,
      icon: 'solar:home-2-linear',
      color: 'text-success',
      bg: 'bg-lightsuccess',
    },
    {
      label: 'Leads',
      value: formatNumber(stats.leads.total),
      hint: `${formatPercent(stats.leads.conversionRate)} de conversión`,
      icon: 'solar:user-speak-linear',
      color: 'text-info',
      bg: 'bg-lightinfo',
    },
    {
      label: 'MRR',
      value: formatCompactCurrency(stats.subscriptions.mrr),
      hint: `${formatCompactCurrency(stats.subscriptions.arr)} anual · ${formatNumber(stats.subscriptions.total)} suscripción(es)`,
      icon: 'solar:wallet-money-linear',
      color: 'text-warning',
      bg: 'bg-lightwarning',
    },
    {
      label: 'Vistas de propiedades',
      value: formatNumber(stats.analytics.totalPropertyViews),
      hint: `${formatPercent(stats.analytics.contactRate)} termina en contacto`,
      icon: 'solar:eye-linear',
      color: 'text-secondary',
      bg: 'bg-lightsecondary',
    },
    {
      label: 'Clics a WhatsApp',
      value: formatNumber(stats.analytics.totalWhatsappClicks),
      hint: `${formatNumber(stats.analytics.totalPhoneClicks)} clics a teléfono`,
      icon: 'solar:chat-round-call-linear',
      color: 'text-error',
      bg: 'bg-lighterror',
    },
  ]

  return (
    <div className='grid grid-cols-12 gap-6'>
      {tiles.map((tile) => (
        <div key={tile.label} className='col-span-12 sm:col-span-6 xl:col-span-4 2xl:col-span-2'>
          <StatTile tile={tile} />
        </div>
      ))}
    </div>
  )
}

export default StatTiles
