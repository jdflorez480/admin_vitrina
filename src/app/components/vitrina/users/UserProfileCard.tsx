'use client'

import { Icon } from '@iconify/react'
import CardBox from '../../shared/CardBox'
import { Badge } from '@/components/ui/badge'
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatNumber,
  vitrinaUrl,
} from '@/lib/vitrina/format'
import type { User } from '@/lib/vitrina/types'

const Field = ({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) => (
  <div className='flex items-start gap-3 py-2.5'>
    <Icon icon={icon} className='mt-0.5 shrink-0 text-base text-muted-foreground' />
    <div className='min-w-0'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='break-words text-sm font-medium'>{value}</p>
    </div>
  </div>
)

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className='rounded-md border border-border p-3'>
    <p className='text-xs text-muted-foreground'>{label}</p>
    <p className='mt-0.5 text-lg font-semibold'>{value}</p>
  </div>
)

const UserProfileCard = ({ user }: { user: User }) => {
  const { stats, profile, subscription } = user
  const isDeactivated = user.deletedAt !== null

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-12 lg:col-span-4'>
        <CardBox className='h-full p-6'>
          <div className='flex items-center gap-3'>
            <span className='flex size-12 shrink-0 items-center justify-center rounded-full bg-lightprimary text-lg font-semibold text-primary'>
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className='min-w-0'>
              <h5 className='truncate text-lg font-semibold'>{user.name}</h5>
              <p className='truncate text-sm text-muted-foreground'>{user.email}</p>
            </div>
          </div>

          <div className='mt-4 flex flex-wrap gap-2'>
            <Badge className='border-0 bg-lightprimary text-primary'>
              {user.currentPlan}
            </Badge>
            <Badge className='border-0 bg-lightinfo text-info'>{user.role}</Badge>
            {isDeactivated ? (
              <Badge className='border-0 bg-lighterror text-error'>Desactivado</Badge>
            ) : (
              <Badge className='border-0 bg-lightsuccess text-success'>Activo</Badge>
            )}
          </div>

          {isDeactivated && (
            <p className='mt-3 rounded-md bg-lighterror px-3 py-2 text-xs text-error'>
              Desactivado el {formatDate(user.deletedAt!)}. El email fue rotado; al
              reactivarlo se restaura el original.
            </p>
          )}

          {user.trialStatus === 'active' && (
            <p className='mt-3 rounded-md bg-lightwarning px-3 py-2 text-xs text-warning'>
              Trial activo: quedan {user.trialDaysRemaining} día(s).
            </p>
          )}

          {profile?.slug && (
            <a
              href={vitrinaUrl(profile.slug)}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-4 flex items-center justify-center gap-2 rounded-md border border-border py-2 text-sm font-medium hover:border-primary hover:text-primary'>
              <Icon icon='solar:shop-linear' className='text-base' />
              Ver su vitrina pública
              <Icon icon='solar:arrow-right-up-linear' className='text-sm' />
            </a>
          )}

          <div className='mt-4 divide-y divide-border'>
            <Field
              icon='solar:link-linear'
              label='Slug'
              value={profile?.slug ?? '—'}
            />
            <Field
              icon='solar:phone-linear'
              label='Teléfono'
              value={profile?.phone ?? '—'}
            />
            <Field
              icon='solar:chat-round-call-linear'
              label='WhatsApp'
              value={profile?.whatsapp ?? '—'}
            />
            <Field
              icon='solar:calendar-linear'
              label='Registro'
              value={formatDate(user.createdAt)}
            />
          </div>
        </CardBox>
      </div>

      <div className='col-span-12 lg:col-span-8'>
        <CardBox className='h-full p-6'>
          <h5 className='mb-4 text-lg font-semibold'>Actividad</h5>

          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <Stat
              label='Propiedades'
              value={formatNumber(stats.totalProperties)}
            />
            <Stat
              label='Publicadas'
              value={formatNumber(stats.publishedProperties)}
            />
            <Stat label='Vendidas' value={formatNumber(stats.soldProperties)} />
            <Stat label='Leads' value={formatNumber(stats.totalLeads)} />
            <Stat label='Propietarios' value={formatNumber(stats.totalOwners)} />
            <Stat label='Negocios' value={formatNumber(stats.totalDeals)} />
            <Stat
              label='Vistas'
              value={formatNumber(stats.totalPropertyViews)}
            />
            <Stat
              label='Clics WhatsApp'
              value={formatNumber(stats.totalWhatsappClicks)}
            />
            <Stat
              label='Comisiones'
              value={formatCompactCurrency(stats.totalCommissions)}
            />
          </div>

          {(stats.totalBuildings > 0 || stats.totalTenants > 0) && (
            <>
              <h6 className='mt-6 mb-3 text-sm font-semibold text-muted-foreground'>
                Arriendos
              </h6>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
                <Stat label='Edificios' value={formatNumber(stats.totalBuildings)} />
                <Stat
                  label='Inquilinos'
                  value={`${formatNumber(stats.activeTenants)} / ${formatNumber(stats.totalTenants)}`}
                />
                <Stat
                  label='Canon mensual'
                  value={formatCompactCurrency(stats.totalMonthlyRent)}
                />
                <Stat
                  label='Pagos en mora'
                  value={formatNumber(stats.overduePayments)}
                />
              </div>
            </>
          )}

          <h6 className='mt-6 mb-3 text-sm font-semibold text-muted-foreground'>
            Suscripción
          </h6>
          {subscription ? (
            <div className='rounded-md border border-border p-4 text-sm'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <span className='font-medium'>
                  {subscription.tier} · {subscription.billingPeriod}
                </span>
                <Badge className='border-0 bg-lightsuccess text-success'>
                  {subscription.status}
                </Badge>
              </div>
              <p className='mt-2 text-muted-foreground'>
                {formatCurrency(subscription.amount)} · próximo cobro el{' '}
                {formatDate(subscription.nextBillingDate)}
              </p>
            </div>
          ) : (
            <p className='text-sm text-muted-foreground'>
              Sin suscripción activa (plan {user.currentPlan}).
            </p>
          )}
        </CardBox>
      </div>
    </div>
  )
}

export default UserProfileCard
