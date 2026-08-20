import StatTile, { type Tile } from '../shared/StatTile'
import {
  formatCompactCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/vitrina/format'
import type { StatsOverview } from '@/lib/vitrina/types'

const StatTiles = ({ stats }: { stats: StatsOverview }) => {
  const tiles: Tile[] = [
    {
      label: 'Usuarios',
      value: formatNumber(stats.users.total),
      hint: `${formatNumber(stats.users.new)} nuevos en el período`,
      delta: stats.users.growthRate,
      icon: 'solar:users-group-rounded-bold-duotone',
      tone: 'primary',
    },
    {
      label: 'Propiedades',
      value: formatNumber(stats.properties.total),
      hint: `${formatNumber(stats.properties.published)} publicadas · ${formatNumber(stats.properties.highlighted)} destacadas`,
      icon: 'solar:home-2-bold-duotone',
      tone: 'success',
    },
    {
      label: 'Leads',
      value: formatNumber(stats.leads.total),
      hint: `${formatPercent(stats.leads.conversionRate)} de conversión`,
      icon: 'solar:user-speak-bold-duotone',
      tone: 'info',
    },
    {
      label: 'MRR',
      value: formatCompactCurrency(stats.subscriptions.mrr),
      hint: `${formatCompactCurrency(stats.subscriptions.arr)} anual · ${formatNumber(stats.subscriptions.total)} suscripción(es)`,
      icon: 'solar:wallet-money-bold-duotone',
      tone: 'warning',
    },
    {
      label: 'Vistas',
      value: formatNumber(stats.analytics.totalPropertyViews),
      hint: `${formatPercent(stats.analytics.contactRate)} termina en contacto`,
      icon: 'solar:eye-bold-duotone',
      tone: 'secondary',
    },
    {
      label: 'WhatsApp',
      value: formatNumber(stats.analytics.totalWhatsappClicks),
      hint: `${formatNumber(stats.analytics.totalPhoneClicks)} clics a teléfono`,
      icon: 'solar:chat-round-call-bold-duotone',
      tone: 'error',
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
