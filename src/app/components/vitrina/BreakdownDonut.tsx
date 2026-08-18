'use client'

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import CardBox from '../shared/CardBox'
import { CHART_COLORS, formatNumber, sortedEntries } from '@/lib/vitrina/format'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  title: string
  subtitle?: string
  breakdown: Record<string, number>
  /** Traduce las claves crudas de la API (LAUNCH, PUBLISHED…) a texto legible. */
  labels?: Record<string, string>
}

/**
 * Composición de un total en categorías (planes, tipos de operación…).
 *
 * El donut sólo funciona con pocas categorías. La API nunca devuelve más de 6
 * en estos desgloses, pero si algún día crece, el resto se agrupa en "Otros"
 * en vez de inventar colores nuevos fuera de la paleta.
 */
const BreakdownDonut = ({ title, subtitle, breakdown, labels }: Props) => {
  const entries = sortedEntries(breakdown)
  const visible = entries.slice(0, CHART_COLORS.length - 1)
  const rest = entries.slice(CHART_COLORS.length - 1)

  const slices = [...visible]
  if (rest.length) {
    slices.push(['Otros', rest.reduce((sum, [, count]) => sum + count, 0)])
  }

  const total = slices.reduce((sum, [, count]) => sum + count, 0)

  const options: ApexOptions = {
    chart: { type: 'donut', fontFamily: 'inherit', foreColor: '#7C8FAC' },
    colors: [...CHART_COLORS],
    labels: slices.map(([key]) => labels?.[key] ?? key),
    stroke: { width: 2, colors: ['var(--color-card)'] },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      markers: { width: 10, height: 10, radius: 10 },
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              fontSize: '13px',
              formatter: () => formatNumber(total),
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value: number) => formatNumber(value) },
    },
  }

  if (!total) {
    return (
      <CardBox className='flex h-full flex-col p-6'>
        <h5 className='text-lg font-semibold'>{title}</h5>
        <p className='mt-auto mb-auto text-center text-sm text-muted-foreground'>
          Sin datos en este período.
        </p>
      </CardBox>
    )
  }

  return (
    <CardBox className='h-full p-6'>
      <div className='mb-2'>
        <h5 className='text-lg font-semibold'>{title}</h5>
        {subtitle && <p className='text-sm text-muted-foreground'>{subtitle}</p>}
      </div>
      <Chart
        options={options}
        series={slices.map(([, count]) => count)}
        type='donut'
        height={300}
        width='100%'
      />
    </CardBox>
  )
}

export default BreakdownDonut
