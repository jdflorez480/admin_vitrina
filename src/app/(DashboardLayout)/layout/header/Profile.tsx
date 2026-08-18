'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { logoutAction } from '@/app/auth/actions'
import type { AdminUser } from '@/lib/vitrina/types'

const Profile = ({ user }: { user: AdminUser }) => {
  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary'>
            <Image
              src='/images/profile/user-1.jpg'
              alt='Perfil'
              height={35}
              width={35}
              className='rounded-full'
            />
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[240px] pb-4 pt-2 rounded-sm'>
          <div className='px-4 py-2'>
            <h5 className='mb-0 text-sm font-medium'>{user.name}</h5>
            <p className='text-xs text-muted-foreground break-all'>{user.email}</p>
            <span className='mt-2 inline-block rounded-full bg-lightprimary px-2 py-0.5 text-xs font-medium text-primary'>
              {user.role}
            </span>
          </div>

          <DropdownMenuSeparator className='my-2' />

          <div className='px-4'>
            {/* Server Action: la cookie es httpOnly, así que sólo el servidor
                puede borrarla — un logout hecho en el cliente no la alcanzaría. */}
            <form action={logoutAction}>
              <Button type='submit' variant='outline' className='w-full rounded-md'>
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
