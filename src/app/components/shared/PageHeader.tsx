'use client'

// Cliente por el <Icon> de Iconify. Recibe el bloque de acciones como
// children, así que las páginas servidor pueden seguir componiéndolo.
import { Icon } from '@iconify/react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Icono de Iconify mostrado en la pastilla de marca. */
  icon: string
  /** Controles alineados a la derecha (filtros, botones…). */
  children?: React.ReactNode
}

const PageHeader = ({ title, subtitle, icon, children }: PageHeaderProps) => (
  <div className='flex flex-wrap items-center justify-between gap-4'>
    <div className='flex items-center gap-3.5'>
      <span className='flex size-11 shrink-0 items-center justify-center rounded-tw bg-brand-gradient text-white shadow-brand'>
        <Icon icon={icon} height={24} width={24} />
      </span>
      <div className='min-w-0'>
        <h1 className='text-xl font-bold tracking-tight'>{title}</h1>
        {subtitle && (
          <p className='mt-0.5 text-sm text-muted-foreground'>{subtitle}</p>
        )}
      </div>
    </div>

    {children && <div className='flex items-center gap-2'>{children}</div>}
  </div>
)

export default PageHeader
