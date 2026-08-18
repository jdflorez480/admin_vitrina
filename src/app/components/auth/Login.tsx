'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@iconify/react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginAction, type LoginState } from '@/app/auth/actions'

const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <Button type='submit' className='w-full' disabled={pending}>
      {pending ? (
        <>
          <Icon icon='solar:refresh-linear' className='animate-spin' />
          Ingresando…
        </>
      ) : (
        'Ingresar'
      )}
    </Button>
  )
}

export const Login = () => {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {})

  return (
    <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
      <div className='md:min-w-[450px] min-w-max'>
        <CardBox>
          <div className='flex justify-center mb-4'>
            <FullLogo />
          </div>
          <p className='text-sm text-muted-foreground text-center mb-6'>
            Panel de administración · Vitrina Raíz
          </p>

          <form action={formAction}>
            {state.error && (
              <div
                role='alert'
                className='mb-6 flex items-start gap-2 rounded-md bg-lighterror px-4 py-3 text-sm text-error'>
                <Icon
                  icon='solar:danger-triangle-linear'
                  className='mt-0.5 shrink-0 text-base'
                />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <div className='mb-2 block'>
                <Label htmlFor='email' className='font-medium'>
                  Email
                </Label>
              </div>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='admin@vitrinaraiz.com'
                required
              />
            </div>

            <div className='mt-6'>
              <div className='mb-2 block'>
                <Label htmlFor='password' className='font-medium'>
                  Contraseña
                </Label>
              </div>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                placeholder='Tu contraseña'
                required
              />
            </div>

            <div className='mt-6'>
              <SubmitButton />
            </div>
          </form>

          <p className='mt-6 text-center text-xs text-muted-foreground'>
            Acceso exclusivo para administradores.
          </p>
        </CardBox>
      </div>
    </div>
  )
}
