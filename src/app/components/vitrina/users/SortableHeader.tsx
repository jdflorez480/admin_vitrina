'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { TableHead } from '@/components/ui/table'
import type { SortKey } from '@/lib/vitrina/types'

interface Props {
  column: SortKey
  label: string
  /** Métricas alineadas a la derecha; texto a la izquierda. */
  numeric?: boolean
}

const SortableHeader = ({ column, label, numeric }: Props) => {
  const params = useSearchParams()

  const activeSort = params.get('sort') ?? 'created'
  const activeDir = params.get('dir') ?? 'desc'
  const isActive = activeSort === column

  // Primer clic en una métrica: de mayor a menor. Es lo que se busca al ordenar
  // por "propiedades" — quién tiene más, no quién tiene cero.
  const nextDir = isActive && activeDir === 'desc' ? 'asc' : 'desc'

  const query = new URLSearchParams(params)
  query.set('sort', column)
  query.set('dir', nextDir)
  query.delete('page') // otro orden ⇒ otra página 1

  return (
    <TableHead className={numeric ? 'text-right' : undefined}>
      <Link
        href={`/usuarios?${query}`}
        scroll={false}
        className={`inline-flex items-center gap-1 hover:text-primary ${
          isActive ? 'font-semibold text-primary' : ''
        }`}>
        {label}
        <Icon
          icon={
            !isActive
              ? 'solar:sort-vertical-linear'
              : activeDir === 'desc'
                ? 'solar:alt-arrow-down-linear'
                : 'solar:alt-arrow-up-linear'
          }
          className={isActive ? 'text-sm' : 'text-sm opacity-40'}
        />
      </Link>
    </TableHead>
  )
}

export default SortableHeader
