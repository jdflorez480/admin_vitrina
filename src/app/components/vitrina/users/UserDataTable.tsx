'use client'

import Link from 'next/link'
import CardBox from '../../shared/CardBox'
import Pagination from './Pagination'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/vitrina/format'
import type {
  UserDataType,
  UserDeal,
  UserLead,
  UserProperty,
} from '@/lib/vitrina/types'

const TABS: { value: UserDataType; label: string }[] = [
  { value: 'properties', label: 'Propiedades' },
  { value: 'leads', label: 'Leads' },
  { value: 'deals', label: 'Negocios' },
]

interface Props {
  userId: string
  type: UserDataType
  items: unknown[]
  pagination: { page: number; totalPages: number; total: number }
}

const UserDataTable = ({ userId, type, items, pagination }: Props) => (
  <CardBox className='p-6'>
    {/* Las pestañas son enlaces, no estado local: la vista queda en la URL y se
        puede recargar o compartir. El href no lleva `page`, así que cambiar de
        pestaña vuelve a la primera página en lugar de pedir una que quizá no
        existe en la otra colección. */}
    <div className='mb-6 flex flex-wrap gap-2'>
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={`/usuarios/${userId}?tab=${tab.value}`}
          scroll={false}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab.value === type
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-lightprimary hover:text-primary'
          }`}>
          {tab.label}
        </Link>
      ))}
    </div>

    {items.length === 0 ? (
      <p className='py-12 text-center text-sm text-muted-foreground'>
        Este usuario no tiene {TABS.find((t) => t.value === type)?.label.toLowerCase()}.
      </p>
    ) : (
      <>
        <div className='overflow-x-auto'>
          {type === 'properties' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead className='text-right'>Precio</TableHead>
                  <TableHead className='text-right'>Alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as UserProperty[]).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className='max-w-[280px]'>
                      <p className='truncate font-medium'>{p.title?.trim() || '—'}</p>
                      <p className='text-xs text-muted-foreground'>
                        {p.code ?? '—'} · {p.city ?? 'Sin ciudad'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className='border-0 bg-muted'>{p.status}</Badge>
                    </TableCell>
                    <TableCell className='text-sm'>{p.operation}</TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm'>
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                      {formatDate(p.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {type === 'leads' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead className='text-right'>Alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as UserLead[]).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className='font-medium'>{l.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {l.email ?? l.phone ?? '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className='border-0 bg-muted'>{l.stage}</Badge>
                    </TableCell>
                    <TableCell className='text-sm'>{l.source ?? '—'}</TableCell>
                    <TableCell className='max-w-[200px] truncate text-sm'>
                      {l.property?.title ?? '—'}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                      {formatDate(l.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {type === 'deals' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-right'>Valor</TableHead>
                  <TableHead className='text-right'>Comisión</TableHead>
                  <TableHead className='text-right'>Cierre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(items as UserDeal[]).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='max-w-[240px]'>
                      <p className='truncate font-medium'>
                        {d.property?.title ?? '—'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {d.owner?.name ?? 'Sin propietario'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className='border-0 bg-muted'>{d.status}</Badge>
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm'>
                      {formatCurrency(d.finalValue)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm'>
                      {formatCurrency(d.netFee)}
                    </TableCell>
                    <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                      {d.closeDate ? formatDate(d.closeDate) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className='mt-6'>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            basePath={`/usuarios/${userId}`}
          />
        </div>
      </>
    )}
  </CardBox>
)

export default UserDataTable
