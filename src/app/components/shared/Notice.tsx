'use client'

// Cliente por el <Icon> de Iconify.
import { Icon } from '@iconify/react'

type Variant = 'info' | 'warning' | 'error'

const VARIANTS: Record<Variant, { box: string; icon: string }> = {
  info: { box: 'bg-lightinfo text-infoemphasis', icon: 'solar:info-circle-linear' },
  warning: {
    box: 'bg-lightwarning text-warningemphasis',
    icon: 'solar:danger-triangle-linear',
  },
  error: {
    box: 'bg-lighterror text-erroremphasis',
    icon: 'solar:close-circle-linear',
  },
}

/** Aviso en línea. El icono acompaña al color: el mensaje no depende del tono. */
const Notice = ({
  variant = 'info',
  children,
}: {
  variant?: Variant
  children: React.ReactNode
}) => {
  const style = VARIANTS[variant]

  return (
    <div
      className={`flex items-start gap-3 rounded-tw border border-border px-4 py-3 text-sm ${style.box}`}>
      <Icon icon={style.icon} className='mt-0.5 shrink-0 text-base' />
      <div className='min-w-0'>{children}</div>
    </div>
  )
}

export default Notice
