'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Icon } from '@iconify/react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { PLANS, ROLES } from '@/lib/vitrina/types'

const STATUSES = [
  { value: 'active', label: 'Activos' },
  { value: 'deleted', label: 'Desactivados' },
  { value: 'all', label: 'Todos' },
]

/** Valor de los <Select> cuando no hay filtro: Radix no admite un SelectItem con value="". */
const ANY = 'ANY'

const UserFiltersBar = () => {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get('search') ?? '')

  // Los filtros viven en la URL: recargar o compartir el enlace conserva la vista.
  const push = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params)

    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === ANY) next.delete(key)
      else next.set(key, value)
    }
    // Cualquier cambio de filtro invalida la página actual.
    next.delete('page')

    startTransition(() => router.push(`/usuarios?${next}`))
  }

  // Debounce: no dispara una request por tecla.
  useEffect(() => {
    const current = params.get('search') ?? ''
    if (search === current) return

    const timer = setTimeout(() => push({ search }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  // Vista de venta: quién está exprimiendo el plan gratuito. Ordenado por
  // propiedades de mayor a menor, que es a quién conviene llamar primero.
  const upsellHref = '/usuarios?plan=LAUNCH&sort=properties&dir=desc'
  const isUpsellView =
    params.get('plan') === 'LAUNCH' && params.get('sort') === 'properties'

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Link
          href={upsellHref}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            isUpsellView
              ? 'bg-success text-white'
              : 'bg-lightsuccess text-success hover:opacity-80'
          }`}>
          <Icon icon='solar:arrow-up-linear' />
          Candidatos a upgrade
        </Link>

        {(params.get('plan') ||
          params.get('role') ||
          params.get('search') ||
          params.get('sort')) && (
          <Link
            href='/usuarios'
            className='inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-primary'>
            <Icon icon='solar:close-circle-linear' />
            Limpiar filtros
          </Link>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative min-w-[240px] flex-1'>
        <Icon
          icon='solar:magnifer-linear'
          className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Buscar por nombre o email…'
          className='pl-9'
        />
      </div>

      <Select
        value={params.get('plan') ?? ANY}
        onValueChange={(plan) => push({ plan })}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Plan' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Todos los planes</SelectItem>
          {PLANS.map((plan) => (
            <SelectItem key={plan} value={plan}>
              {plan}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get('role') ?? ANY}
        onValueChange={(role) => push({ role })}>
        <SelectTrigger className='w-[170px]'>
          <SelectValue placeholder='Rol' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Todos los roles</SelectItem>
          {ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get('status') ?? 'active'}
        onValueChange={(status) => push({ status })}>
        <SelectTrigger className='w-[150px]'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

        {isPending && (
          <Icon
            icon='solar:refresh-linear'
            className='animate-spin text-muted-foreground'
          />
        )}
      </div>
    </div>
  )
}

export default UserFiltersBar
