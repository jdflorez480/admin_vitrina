'use client'

// Cliente por el <Icon> de Iconify, que no puede renderizarse en el servidor.
import { Icon } from '@iconify/react'
import CardBox from './CardBox'
import { formatPercent } from '@/lib/vitrina/format'

export type Tone = 'primary' | 'success' | 'info' | 'warning' | 'secondary' | 'error'

export interface Tile {
  label: string
  value: string
  hint: string
  icon: string
  tone: Tone
  /** Variación porcentual respecto al período anterior, si aplica. */
  delta?: number
}

// Cada tono define el chip del icono y el halo de color de la esquina. Se
// escriben completas para que Tailwind no las pierda al purgar clases.
const TONES: Record<Tone, { chip: string; glow: string }> = {
  primary: { chip: 'bg-lightprimary text-primary', glow: 'bg-primary' },
  success: { chip: 'bg-lightsuccess text-success', glow: 'bg-success' },
  info: { chip: 'bg-lightinfo text-info', glow: 'bg-info' },
  warning: { chip: 'bg-lightwarning text-warning', glow: 'bg-warning' },
  secondary: { chip: 'bg-lightsecondary text-secondary', glow: 'bg-secondary' },
  error: { chip: 'bg-lighterror text-error', glow: 'bg-error' },
}

const StatTile = ({ tile }: { tile: Tile }) => {
  const tone = TONES[tile.tone]

  return (
    <CardBox className='relative overflow-hidden p-5'>
      {/* Halo del color del indicador: identifica la tarjeta de un vistazo
          sin recurrir a bordes fuertes. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-10 -top-12 size-28 rounded-full opacity-10 blur-2xl ${tone.glow}`}
      />

      <div className='relative flex items-start justify-between gap-3'>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-tw ${tone.chip}`}>
          <Icon icon={tile.icon} className='text-xl' />
        </span>

        {tile.delta !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
              tile.delta >= 0
                ? 'bg-lightsuccess text-success'
                : 'bg-lighterror text-error'
            }`}>
            {/* El icono acompaña al color: el signo no se comunica sólo con color. */}
            <Icon
              icon={
                tile.delta >= 0
                  ? 'solar:arrow-right-up-linear'
                  : 'solar:arrow-right-down-linear'
              }
              className='text-sm'
            />
            {formatPercent(Math.abs(tile.delta))}
          </span>
        )}
      </div>

      <div className='relative mt-4 min-w-0'>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          {tile.label}
        </p>
        <h3 className='mt-1.5 text-[28px] font-bold leading-none tracking-tight'>
          {tile.value}
        </h3>
        <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>
          {tile.hint}
        </p>
      </div>
    </CardBox>
  )
}

export default StatTile
