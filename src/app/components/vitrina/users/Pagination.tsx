'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@iconify/react'
import { formatNumber } from '@/lib/vitrina/format'

interface Props {
  page: number
  totalPages: number
  total: number
  /** Ruta base a la que volver; los demás filtros de la URL se conservan. */
  basePath: string
}

const Pagination = ({ page, totalPages, total, basePath }: Props) => {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const goTo = (next: number) => {
    const query = new URLSearchParams(params)
    if (next <= 1) query.delete('page')
    else query.set('page', String(next))

    startTransition(() => router.push(`${basePath}?${query}`))
  }

  if (totalPages <= 1) {
    return (
      <p className='text-sm text-muted-foreground'>
        {formatNumber(total)} resultado(s)
      </p>
    )
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <p className='text-sm text-muted-foreground'>
        Página {page} de {totalPages} · {formatNumber(total)} resultado(s)
      </p>

      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={page <= 1 || isPending}
          onClick={() => goTo(page - 1)}>
          <Icon icon='solar:alt-arrow-left-linear' />
          Anterior
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={page >= totalPages || isPending}
          onClick={() => goTo(page + 1)}>
          Siguiente
          <Icon icon='solar:alt-arrow-right-linear' />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
