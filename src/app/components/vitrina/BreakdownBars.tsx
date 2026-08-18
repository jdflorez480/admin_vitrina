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
  labels?: Record<string, string>
  /** Nombre de la magnitud; aparece en el tooltip. */
  unit: string
}

/**
 * Ranking de categorías por volumen (etapas de leads, estados de propiedad…).
 *
 * Barras horizontales en vez de donut: acá el trabajo del gráfico es comparar
 * magnitudes y hay categorías con nombres largos, que en un donut no caben.
 * Una sola serie, así que no lleva leyenda: el título ya dice qué se mide.
 */
const BreakdownBars = ({ title, subtitle, breakdown, labels, unit }: Props) => {
  const entries = sortedEntries(breakdown)

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      fontFamily: 'inherit',
      foreColor: '#7C8FAC',
      toolbar: { show: false },
    },
    // El color identifica la categoría, no su posición en el ranking.
    colors: [CHART_COLORS[0]],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '58%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        distributed: false,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value: number) => formatNumber(value),
      offsetX: 26,
      style: { fontSize: '12px', colors: ['#7C8FAC'], fontWeight: 500 },
    },
    grid: {
      borderColor: 'rgba(0,0,0,0.08)',
      strokeDashArray: 3,
      yaxis: { lines: { show: false } },
    },
    xaxis: {
      categories: entries.map(([key]) => labels?.[key] ?? key),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: { show: false },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value: number) => `${formatNumber(value)} ${unit}` },
    },
  }

  if (!entries.length) {
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
        series={[{ name: unit, data: entries.map(([, count]) => count) }]}
        type='bar'
        height={Math.max(240, entries.length * 44)}
        width='100%'
      />
    </CardBox>
  )
}

export default BreakdownBars
