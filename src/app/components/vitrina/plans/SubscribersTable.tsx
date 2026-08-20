'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, formatNumber, vitrinaUrl } from '@/lib/vitrina/format'
import type { PriceSource } from '@/lib/vitrina/plans'
import type { Plan, Role } from '@/lib/vitrina/types'

/** Sólo lo que la tabla necesita: la fila viaja del servidor al cliente. */
export interface SubscriberRow {
  id: string
  name: string
  email: string
  role: Role
  plan: Plan
  slug: string | null
  monthly: number | null
  source: PriceSource
  /** Tarifa de lista, sólo si el usuario paga menos que ella. */
  listPrice: number | null
  properties: number
  leads: number
  createdAt: string
  /** Fin del ciclo vigente, si hay suscripción registrada. */
  renewsAt: string | null
}

const PLAN_STYLE: Partial<Record<Plan, string>> = {
  BASIC: 'bg-lightinfo text-info',
  PRO: 'bg-lightsuccess text-success',
  INMOBILIARIA: 'bg-lightsecondary text-secondary',
  ILIMITADO: 'bg-lighterror text-error',
}

/** Cómo se marca el monto según de dónde salió. */
const SOURCE_HINT: Record<PriceSource, { label: string; title: string } | null> = {
  override: {
    label: 'precio pactado',
    title: 'Monto acordado con este usuario, distinto a la tarifa de lista de su plan',
  },
  subscription: null,
  config: { label: 'tarifa fija', title: 'Monto tomado de la tarifa configurada del plan' },
  derived: {
    label: 'estimado',
    title:
      'Este usuario no tiene registro de suscripción: se le aplica la tarifa deducida de las suscripciones reales de su plan',
  },
  unknown: { label: 'sin monto', title: 'No hay forma de saber cuánto paga este usuario' },
}

const SubscribersTable = ({ rows }: { rows: SubscriberRow[] }) => {
  if (!rows.length) {
    return (
      <p className='py-16 text-center text-sm text-muted-foreground'>
        Todavía no hay usuarios en un plan de pago.
      </p>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className='text-right'>Mensual</TableHead>
            <TableHead className='text-right'>Props.</TableHead>
            <TableHead className='text-right'>Leads</TableHead>
            <TableHead className='text-right'>Alta</TableHead>
            <TableHead className='text-right'>Renueva</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((row) => {
            const hint = SOURCE_HINT[row.source]

            return (
              <TableRow key={row.id}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <p className='font-medium'>{row.name}</p>
                    {row.role !== 'AGENT' && (
                      <Badge className='border-0 bg-lighterror text-error'>
                        {row.role}
                      </Badge>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>{row.email}</p>

                  {row.slug && (
                    <a
                      href={vitrinaUrl(row.slug)}
                      target='_blank'
                      rel='noopener noreferrer'
                      title='Abrir su vitrina pública'
                      className='mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:text-primaryemphasis'>
                      <Icon icon='solar:shop-linear' className='text-sm' />
                      /{row.slug}
                      <Icon icon='solar:arrow-right-up-linear' className='text-xs' />
                    </a>
                  )}
                </TableCell>

                <TableCell>
                  <Badge
                    className={`${
                      PLAN_STYLE[row.plan] ?? 'bg-muted text-muted-foreground'
                    } border-0`}>
                    {row.plan}
                  </Badge>
                </TableCell>

                <TableCell className='whitespace-nowrap text-right'>
                  {row.monthly !== null ? (
                    <span className='inline-flex items-baseline gap-1.5'>
                      {/* La tarifa tachada da contexto: sin ella, un monto por
                          debajo del plan parece un dato mal cargado. */}
                      {row.listPrice !== null && (
                        <span
                          title={`Tarifa de lista del plan: ${formatCurrency(row.listPrice)}`}
                          className='text-xs text-muted-foreground line-through'>
                          {formatCurrency(row.listPrice)}
                        </span>
                      )}
                      <span className='font-semibold'>{formatCurrency(row.monthly)}</span>
                    </span>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  )}
                  {hint && (
                    <span
                      title={hint.title}
                      className='mt-0.5 block text-xs text-muted-foreground'>
                      {hint.label}
                    </span>
                  )}
                </TableCell>

                <TableCell className='text-right font-medium'>
                  {formatNumber(row.properties)}
                </TableCell>
                <TableCell className='text-right'>{formatNumber(row.leads)}</TableCell>
                <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                  {formatDate(row.createdAt)}
                </TableCell>
                <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                  {row.renewsAt ? formatDate(row.renewsAt) : '—'}
                </TableCell>

                <TableCell className='text-right'>
                  <Link
                    href={`/usuarios/${row.id}`}
                    className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primaryemphasis'>
                    Ver
                    <Icon icon='solar:alt-arrow-right-linear' />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default SubscribersTable
