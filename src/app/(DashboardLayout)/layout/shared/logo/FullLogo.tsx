import Image from 'next/image'

interface FullLogoProps {
  /** `light` invierte el texto para usarlo sobre fondos oscuros o de marca. */
  variant?: 'default' | 'light'
  /** Oculta el texto y deja sólo el escudo (útil en anchos muy reducidos). */
  markOnly?: boolean
  className?: string
}

/**
 * Bloque de marca de Vitrina Raíz: el escudo sobre el degradado corporativo
 * más el texto. El escudo se compone aquí (degradado + glifo blanco) en lugar
 * de usar el PNG plano para que el mosaico herede los colores del tema y se
 * vea nítido en cualquier tamaño.
 */
const FullLogo = ({
  variant = 'default',
  markOnly = false,
  className = '',
}: FullLogoProps) => {
  const isLight = variant === 'light'

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span className='relative flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-gradient shadow-brand'>
        <Image
          src='/images/logos/vitrina-glyph.png'
          alt='Vitrina Raíz'
          width={22}
          height={22}
          priority
          className='size-[22px] object-contain'
        />
      </span>

      {!markOnly && (
        <span className='flex min-w-0 flex-col leading-none'>
          <span
            className={`text-[17px] font-bold tracking-tight ${
              isLight ? 'text-white' : 'text-foreground'
            }`}>
            Vitrina
            <span className={isLight ? 'text-white/65' : 'text-secondary'}>
              {' '}
              Raíz
            </span>
          </span>
          <span
            className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isLight ? 'text-white/60' : 'text-muted-foreground'
            }`}>
            Panel admin
          </span>
        </span>
      )}
    </span>
  )
}

export default FullLogo
