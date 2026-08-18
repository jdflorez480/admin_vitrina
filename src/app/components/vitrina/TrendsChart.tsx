'use client'

import dynamic from 'next/dynamic'
import { ApexOptions } from 'apexcharts'
import CardBox from '../shared/CardBox'
import { CHART_COLORS, formatTrendLabel } from '@/lib/vitrina/format'
import type { StatsOverview } from '@/lib/vitrina/types'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const GRANULARITY_LABEL: Record<string, string> = {
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
}

/**
 * Altas de usuarios, propiedades y leads a lo largo del período.
 *
 * Las tres series comparten un solo eje Y porque son la misma unidad (altas).
 * Los ingresos NO se grafican acá: están en pesos y meterlos exigiría un segundo
 * eje, que distorsiona la comparación. Van en su propia tarjeta.
 */
const TrendsChart = ({ stats }: { stats: StatsOverview }) => {
  const { data, granularity } = stats.trends

  const options: ApexOptions = {
    chart: {
      type: 'line',
      fontFamily: 'inherit',
      foreColor: '#7C8FAC',
      height: 320,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [CHART_COLORS[0], CHART_COLORS[1], CHART_COLORS[2]],
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 0, hover: { size: 6 } },
    grid: {
      borderColor: 'rgba(0,0,0,0.08)',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      markers: { width: 10, height: 10, radius: 10 },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.map((p) => formatTrendLabel(p.date, granularity)),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tickAmount: 8,
    },
    yaxis: { min: 0, forceNiceScale: true },
    tooltip: { shared: true, intersect: false, theme: 'dark' },
  }

  const series = [
    { name: 'Usuarios', data: data.map((p) => p.users) },
    { name: 'Propiedades', data: data.map((p) => p.properties) },
    { name: 'Leads', data: data.map((p) => p.leads) },
  ]

  return (
    <CardBox className='p-6'>
      <div className='mb-4'>
        <h5 className='text-lg font-semibold'>Altas en el período</h5>
        <p className='text-sm text-muted-foreground'>
          Nuevos registros {GRANULARITY_LABEL[granularity] ?? ''}
        </p>
      </div>
      <Chart options={options} series={series} type='line' height={320} width='100%' />
    </CardBox>
  )
}

export default TrendsChart
