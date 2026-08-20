'use client'

import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { logoutAction } from '@/app/auth/actions'
import type { AdminUser } from '@/lib/vitrina/types'

/** Iniciales del nombre; si no hay nombre, la primera letra del correo. */
const initials = (user: AdminUser) => {
  const parts = (user.name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return (user.email?.[0] || '?').toUpperCase()
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

const Avatar = ({ user, size = 36 }: { user: AdminUser; size?: number }) => (
  <span
    aria-hidden
    style={{ width: size, height: size, fontSize: size * 0.36 }}
    className='flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-semibold text-white'>
    {initials(user)}
  </span>
)

const Profile = ({ user }: { user: AdminUser }) => {
  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label='Abrir menú de la cuenta'
            className='flex items-center gap-2 rounded-full p-0.5 ring-2 ring-transparent transition-all hover:ring-lightprimary focus-visible:outline-none focus-visible:ring-primary'>
            <Avatar user={user} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[260px] pb-4 pt-2 rounded-tw'>
          <div className='flex items-center gap-3 px-4 py-3'>
            <Avatar user={user} size={44} />
            <div className='min-w-0'>
              <h5 className='mb-0 truncate text-sm font-semibold'>{user.name}</h5>
              <p className='truncate text-xs text-muted-foreground'>{user.email}</p>
            </div>
          </div>

          <div className='px-4'>
            <span className='inline-flex items-center gap-1 rounded-full bg-lightprimary px-2 py-0.5 text-xs font-medium text-primary'>
              <Icon icon='solar:shield-user-linear' height={13} width={13} />
              {user.role}
            </span>
          </div>

          <DropdownMenuSeparator className='my-3' />

          <div className='px-4'>
            {/* Server Action: la cookie es httpOnly, así que sólo el servidor
                puede borrarla — un logout hecho en el cliente no la alcanzaría. */}
            <form action={logoutAction}>
              <Button type='submit' variant='outline' className='w-full rounded-md'>
                <Icon icon='solar:logout-2-linear' height={16} width={16} />
                Cerrar sesión
              </Button>
            </form>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
