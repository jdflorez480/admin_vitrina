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
import SortableHeader from './SortableHeader'
import { formatDate, formatNumber, vitrinaUrl } from '@/lib/vitrina/format'
import type { Plan, User } from '@/lib/vitrina/types'

const PLAN_STYLE: Record<Plan, string> = {
  LAUNCH: 'bg-lightprimary text-primary',
  TRIAL: 'bg-lightwarning text-warning',
  BASIC: 'bg-lightinfo text-info',
  PRO: 'bg-lightsuccess text-success',
  INMOBILIARIA: 'bg-lightsecondary text-secondary',
  ILIMITADO: 'bg-lighterror text-error',
}

/** Planes sin pago: son a quienes tiene sentido ofrecerles un upgrade. */
const FREE_PLANS: Plan[] = ['LAUNCH', 'TRIAL']

/** A partir de acá, un usuario en plan gratuito ya le está sacando jugo al producto. */
const UPSELL_MIN_PROPERTIES = 5

/** Sólo dígitos: los enlaces tel:/wa.me no toleran espacios ni guiones. */
const toDigits = (phone: string) => phone.replace(/\D/g, '')

/**
 * Número en formato internacional para wa.me.
 *
 * No se puede anteponer 57 a ciegas: en la base hay números ya internacionales
 * (p. ej. +1809… de República Dominicana), y prefijarlos daría un enlace muerto.
 * Sólo se asume Colombia cuando el número tiene la pinta de un móvil local:
 * 10 dígitos y sin prefijo explícito.
 */
function toWhatsappNumber(phone: string) {
  const digits = toDigits(phone)

  const alreadyInternational = phone.trim().startsWith('+')
  const looksColombianMobile = digits.length === 10 && digits.startsWith('3')

  if (!alreadyInternational && looksColombianMobile) return `57${digits}`
  return digits
}

const ContactLinks = ({ user }: { user: User }) => {
  const phone = user.profile?.phone
  const whatsapp = user.profile?.whatsapp

  if (!phone && !whatsapp) {
    return <span className='text-xs text-muted-foreground'>Sin teléfono</span>
  }

  return (
    <div className='flex items-center gap-2'>
      {phone && (
        <a
          href={`tel:${toDigits(phone)}`}
          title={`Llamar a ${phone}`}
          className='inline-flex items-center gap-1 text-sm hover:text-primary'>
          <Icon icon='solar:phone-linear' className='text-base' />
          {phone}
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${toWhatsappNumber(whatsapp)}`}
          target='_blank'
          rel='noopener noreferrer'
          title={`WhatsApp a ${whatsapp}`}
          className='text-success hover:opacity-70'>
          <Icon icon='solar:chat-round-call-linear' className='text-base' />
        </a>
      )}
    </div>
  )
}

const UsersTable = ({ users }: { users: User[] }) => {
  if (!users.length) {
    return (
      <p className='py-16 text-center text-sm text-muted-foreground'>
        Ningún usuario coincide con estos filtros.
      </p>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column='name' label='Usuario' />
            <TableHead>Contacto</TableHead>
            <TableHead>Plan</TableHead>
            <SortableHeader column='properties' label='Props.' numeric />
            <SortableHeader column='published' label='Public.' numeric />
            <SortableHeader column='leads' label='Leads' numeric />
            <SortableHeader column='views' label='Vistas' numeric />
            <SortableHeader column='whatsapp' label='WhatsApp' numeric />
            <SortableHeader column='created' label='Alta' numeric />
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            const isDeactivated = user.deletedAt !== null

            // Candidato a upgrade: usa mucho el producto y no paga.
            const isUpsell =
              !isDeactivated &&
              FREE_PLANS.includes(user.currentPlan) &&
              user.stats.totalProperties >= UPSELL_MIN_PROPERTIES

            return (
              <TableRow key={user.id} className={isDeactivated ? 'opacity-60' : ''}>
                <TableCell>
                  <div className='flex items-center gap-2'>
                    <p className='font-medium'>{user.name}</p>
                    {user.role !== 'AGENT' && (
                      <Badge className='border-0 bg-lighterror text-error'>
                        {user.role}
                      </Badge>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>{user.email}</p>

                  {user.profile?.slug && (
                    <a
                      href={vitrinaUrl(user.profile.slug)}
                      target='_blank'
                      rel='noopener noreferrer'
                      title='Abrir su vitrina pública'
                      className='mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:text-primaryemphasis'>
                      <Icon icon='solar:shop-linear' className='text-sm' />
                      /{user.profile.slug}
                      <Icon icon='solar:arrow-right-up-linear' className='text-xs' />
                    </a>
                  )}
                </TableCell>

                <TableCell>
                  <ContactLinks user={user} />
                </TableCell>

                <TableCell>
                  <div className='flex flex-wrap items-center gap-1.5'>
                    <Badge className={`${PLAN_STYLE[user.currentPlan]} border-0`}>
                      {user.currentPlan}
                    </Badge>
                    {/* El icono acompaña al color: la señal no se transmite sólo con color. */}
                    {isUpsell && (
                      <span
                        title={`Plan gratuito con ${user.stats.totalProperties} propiedades: buen candidato a upgrade`}
                        className='inline-flex items-center gap-0.5 rounded-full bg-lightsuccess px-1.5 py-0.5 text-xs font-medium text-success'>
                        <Icon icon='solar:arrow-up-linear' />
                        Upgrade
                      </span>
                    )}
                  </div>
                  {user.trialStatus === 'active' && (
                    <p className='mt-1 text-xs text-warning'>
                      Trial: {user.trialDaysRemaining} día(s)
                    </p>
                  )}
                  {isDeactivated && (
                    <span className='mt-1 flex items-center gap-1 text-xs text-error'>
                      <Icon icon='solar:close-circle-linear' />
                      Desactivado
                    </span>
                  )}
                </TableCell>

                <TableCell className='text-right font-medium'>
                  {formatNumber(user.stats.totalProperties)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatNumber(user.stats.publishedProperties)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatNumber(user.stats.totalLeads)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatNumber(user.stats.totalPropertyViews)}
                </TableCell>
                <TableCell className='text-right'>
                  {formatNumber(user.stats.totalWhatsappClicks)}
                </TableCell>
                <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                  {formatDate(user.createdAt)}
                </TableCell>

                <TableCell className='text-right'>
                  <Link
                    href={`/usuarios/${user.id}`}
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

export default UsersTable
