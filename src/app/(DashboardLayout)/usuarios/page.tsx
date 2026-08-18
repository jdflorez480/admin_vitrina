import { redirect } from 'next/navigation'
import { ApiError, listUsers } from '@/lib/vitrina/api'
import { SORT_VALUES, type SortKey } from '@/lib/vitrina/types'
import { formatNumber } from '@/lib/vitrina/format'
import CardBox from '@/app/components/shared/CardBox'
import UserFiltersBar from '@/app/components/vitrina/users/UserFiltersBar'
import UsersTable from '@/app/components/vitrina/users/UsersTable'
import Pagination from '@/app/components/vitrina/users/Pagination'

interface SearchParams {
  search?: string
  plan?: string
  role?: string
  status?: string
  page?: string
  sort?: string
  dir?: string
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const page = Number(filters.page) || 1

  // Un `sort` inventado en la URL no debe llegar al comparador.
  const sort = (
    filters.sort && filters.sort in SORT_VALUES ? filters.sort : 'created'
  ) as SortKey
  const dir = filters.dir === 'asc' ? 'asc' : 'desc'

  let data
  try {
    data = await listUsers({ ...filters, page, sort, dir })
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect('/auth/login')
    throw err
  }

  const { users, counts, pagination } = data

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-12'>
        <h1 className='text-xl font-semibold'>Usuarios</h1>
        <p className='text-sm text-muted-foreground'>
          {formatNumber(counts.active)} activo(s) · {formatNumber(counts.deactivated)}{' '}
          desactivado(s) · {formatNumber(counts.total)} en total
        </p>
      </div>

      <div className='col-span-12'>
        <CardBox className='p-6'>
          <UserFiltersBar />

          <div className='mt-6'>
            <UsersTable users={users} />
          </div>

          <div className='mt-6'>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              basePath='/usuarios'
            />
          </div>
        </CardBox>
      </div>
    </div>
  )
}
