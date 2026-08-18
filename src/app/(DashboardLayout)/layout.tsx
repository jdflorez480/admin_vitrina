import { redirect } from 'next/navigation'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import { getSession } from '@/lib/vitrina/session'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // El middleware ya bloquea el acceso sin cookie. Esta segunda comprobación
  // cubre el caso de una cookie presente pero ilegible (corrupta o vieja), que
  // el middleware deja pasar porque sólo mira si existe.
  const session = await getSession()
  if (!session) redirect('/auth/login')

  return (
    <div className='flex w-full min-h-screen'>
      <div className='page-wrapper flex w-full'>
        {/* Header/sidebar */}
        <div className='xl:block hidden'>
          <Sidebar />
        </div>
        <div className='body-wrapper w-full bg-background'>
          {/* Top Header  */}
          <Header user={session.user} />
          {/* Body Content  */}
          <div className={`container mx-auto px-6 py-30`}>{children}</div>
        </div>
      </div>
    </div>
  )
}
