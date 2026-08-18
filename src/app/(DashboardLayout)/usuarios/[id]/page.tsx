import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ApiError, getUserById, getUserData } from '@/lib/vitrina/api'
import { canImpersonateDirectly } from '@/lib/vitrina/impersonation'
import type { UserDataType } from '@/lib/vitrina/types'
import UserProfileCard from '@/app/components/vitrina/users/UserProfileCard'
import UserActions from '@/app/components/vitrina/users/UserActions'
import UserDataTable from '@/app/components/vitrina/users/UserDataTable'

const TABS: UserDataType[] = ['properties', 'leads', 'deals']

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; page?: string }>
}) {
  const { id } = await params
  const { tab, page: rawPage } = await searchParams

  const type: UserDataType = TABS.includes(tab as UserDataType)
    ? (tab as UserDataType)
    : 'properties'

  const page = Math.max(1, Number(rawPage) || 1)

  let user
  let data
  try {
    // En paralelo: los datos no dependen del usuario, sólo del id que ya tenemos.
    ;[user, data] = await Promise.all([
      getUserById(id),
      getUserData(id, type, page),
    ])
    if (!user) notFound()
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/auth/login')
    throw err
  }

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-12'>
        {/* Flecha en SVG y no con <Icon> de Iconify: esta página es un componente
            de servidor, e Iconify sólo funciona en el cliente. */}
        <Link
          href='/usuarios'
          className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary'>
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='size-4'
            aria-hidden='true'>
            <path d='M15 6l-6 6 6 6' />
          </svg>
          Volver a usuarios
        </Link>
      </div>

      <div className='col-span-12'>
        <UserProfileCard user={user} />
      </div>

      <div className='col-span-12'>
        <UserDataTable
          userId={id}
          type={type}
          items={data.items}
          pagination={data.pagination}
        />
      </div>

      <div className='col-span-12'>
        <UserActions user={user} directAccess={canImpersonateDirectly()} />
      </div>
    </div>
  )
}
