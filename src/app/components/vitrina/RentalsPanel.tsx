'use client'

// Cliente por el <Icon> de Iconify (ver StatTiles).
import { Icon } from '@iconify/react'
import CardBox from '../shared/CardBox'
import { Progress } from '@/components/ui/progress'
import {
  formatCompactCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/vitrina/format'
import type { StatsOverview } from '@/lib/vitrina/types'

const Row = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) => (
  <div className='flex items-center justify-between gap-3 py-2.5'>
    <span className='flex items-center gap-2 text-sm text-muted-foreground'>
      <Icon icon={icon} className='text-base' />
      {label}
    </span>
    <span className='text-sm font-medium'>{value}</span>
  </div>
)

/** Arriendos: edificios, inquilinos, recaudo y mora. */
const RentalsPanel = ({ stats }: { stats: StatsOverview }) => {
  const { buildings, tenants, rentPayments } = stats

  return (
    <CardBox className='h-full p-6'>
      <div className='mb-4'>
        <h5 className='text-lg font-semibold'>Arriendos</h5>
        <p className='text-sm text-muted-foreground'>
          Edificios, inquilinos y recaudo
        </p>
      </div>

      <div className='rounded-md bg-lightprimary/60 p-4'>
        <p className='text-xs text-muted-foreground'>Tasa de recaudo</p>
        <div className='mt-1 flex items-baseline gap-2'>
          <span className='text-2xl font-semibold'>
            {formatPercent(rentPayments.collectionRate)}
          </span>
          <span className='text-xs text-muted-foreground'>
            {formatNumber(rentPayments.paid)} de {formatNumber(rentPayments.total)} pagos
          </span>
        </div>
        <Progress value={rentPayments.collectionRate} className='mt-3 h-2' />
      </div>

      {rentPayments.overdue > 0 && (
        <div className='mt-4 flex items-start gap-2 rounded-md bg-lighterror px-3 py-2.5 text-sm text-error'>
          <Icon
            icon='solar:danger-triangle-linear'
            className='mt-0.5 shrink-0 text-base'
          />
          <span>
            <strong>{formatNumber(rentPayments.overdue)}</strong> pago(s) en mora ·{' '}
            {formatCompactCurrency(rentPayments.pendingRent)} pendiente(s)
          </span>
        </div>
      )}

      <div className='mt-2 divide-y divide-border'>
        <Row
          icon='solar:buildings-3-linear'
          label='Edificios'
          value={`${formatNumber(buildings.total)} · ${formatNumber(buildings.totalUnits)} unidades`}
        />
        <Row
          icon='solar:users-group-two-rounded-linear'
          label='Inquilinos'
          value={formatNumber(tenants.total)}
        />
        <Row
          icon='solar:document-text-linear'
          label='Contratos activos'
          value={`${formatNumber(tenants.contracts.active)} de ${formatNumber(tenants.contracts.total)}`}
        />
        <Row
          icon='solar:banknote-2-linear'
          label='Canon mensual'
          value={formatCompactCurrency(tenants.totalMonthlyRent)}
        />
        <Row
          icon='solar:hand-money-linear'
          label='Recaudado'
          value={formatCompactCurrency(rentPayments.collectedRent)}
        />
      </div>
    </CardBox>
  )
}

export default RentalsPanel
