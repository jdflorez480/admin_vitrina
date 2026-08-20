'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@iconify/react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginAction, type LoginState } from '@/app/auth/actions'

const SubmitButton = () => {
  const { pending } = useFormStatus()

  return (
    <Button type='submit' className='w-full h-11 shadow-brand' disabled={pending}>
      {pending ? (
        <>
          <Icon icon='solar:refresh-linear' className='animate-spin' />
          Ingresando…
        </>
      ) : (
        <>
          Ingresar
          <Icon icon='solar:arrow-right-linear' />
        </>
      )}
    </Button>
  )
}

/** Lo que el panel permite hacer; se muestra en el panel de marca. */
const HIGHLIGHTS = [
  {
    icon: 'solar:chart-square-bold-duotone',
    title: 'Métricas en vivo',
    text: 'Usuarios, propiedades, leads y MRR en un solo tablero.',
  },
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Gestión de usuarios',
    text: 'Busca, filtra y entra a la cuenta de cualquier agente.',
  },
  {
    icon: 'solar:ranking-bold-duotone',
    title: 'Rankings del período',
    text: 'Las propiedades y agentes que más movimiento generan.',
  },
]

export const Login = () => {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {})
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className='min-h-screen w-full lg:grid lg:grid-cols-[1.05fr_1fr]'>
      {/* Panel de marca — sólo en pantallas grandes: en móvil el formulario
          debe quedar arriba, sin scroll previo. */}
      <div className='relative hidden overflow-hidden bg-brand-gradient p-12 lg:flex lg:flex-col lg:justify-between'>
        {/* El escudo de la marca, gigante y muy tenue, como marca de agua. */}
        <Image
          src='/images/logos/vitrina-glyph.png'
          alt=''
          width={900}
          height={900}
          aria-hidden
          priority
          className='pointer-events-none absolute -bottom-40 -right-40 w-[36rem] opacity-[0.07]'
        />
        <span
          aria-hidden
          className='pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl'
        />

        <div className='relative'>
          <FullLogo variant='light' />
        </div>

        <div className='relative max-w-md'>
          <h2 className='text-3xl font-bold leading-tight text-white'>
            El panel de control de tu plataforma inmobiliaria.
          </h2>
          <p className='mt-3 text-sm leading-relaxed text-white/70'>
            Todo lo que pasa en Vitrina Raíz, medido y ordenado.
          </p>

          <ul className='mt-10 space-y-6'>
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className='flex gap-4'>
                <span className='flex size-10 shrink-0 items-center justify-center rounded-tw bg-white/12 text-white ring-1 ring-white/15'>
                  <Icon icon={item.icon} height={20} width={20} />
                </span>
                <div>
                  <p className='text-sm font-semibold text-white'>{item.title}</p>
                  <p className='mt-0.5 text-xs leading-relaxed text-white/60'>
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className='relative text-xs text-white/50'>
          © {new Date().getFullYear()} Vitrina Raíz
        </p>
      </div>

      {/* Formulario */}
      <div className='flex min-h-screen items-center justify-center bg-background bg-brand-mesh px-6 py-12'>
        <div className='w-full max-w-[400px]'>
          <div className='mb-8 flex justify-center lg:hidden'>
            <FullLogo />
          </div>

          <h1 className='text-2xl font-bold tracking-tight'>Bienvenido de vuelta</h1>
          <p className='mt-1.5 text-sm text-muted-foreground'>
            Ingresa con tu cuenta de administrador para continuar.
          </p>

          <form action={formAction} className='mt-8'>
            {state.error && (
              <div
                role='alert'
                className='mb-6 flex items-start gap-2 rounded-tw bg-lighterror px-4 py-3 text-sm text-error'>
                <Icon
                  icon='solar:danger-triangle-linear'
                  className='mt-0.5 shrink-0 text-base'
                />
                <span>{state.error}</span>
              </div>
            )}

            <div>
              <Label htmlFor='email' className='mb-2 block font-medium'>
                Email
              </Label>
              <div className='relative'>
                <Icon
                  icon='solar:letter-linear'
                  height={18}
                  width={18}
                  className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground'
                />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  placeholder='admin@vitrinaraiz.com'
                  className='h-11 ps-10'
                  required
                />
              </div>
            </div>

            <div className='mt-5'>
              <Label htmlFor='password' className='mb-2 block font-medium'>
                Contraseña
              </Label>
              <div className='relative'>
                <Icon
                  icon='solar:lock-password-linear'
                  height={18}
                  width={18}
                  className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground'
                />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  placeholder='Tu contraseña'
                  className='h-11 ps-10 pe-11'
                  required
                />
                {/* type=button: dentro de un <form> el defecto es submit y
                    mostrar la clave enviaría el formulario. */}
                <button
                  type='button'
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  aria-pressed={showPassword}
                  className='absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
                  <Icon
                    icon={
                      showPassword
                        ? 'solar:eye-closed-linear'
                        : 'solar:eye-linear'
                    }
                    height={18}
                    width={18}
                  />
                </button>
              </div>
            </div>

            <div className='mt-7'>
              <SubmitButton />
            </div>
          </form>

          <p className='mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground'>
            <Icon icon='solar:shield-check-linear' height={14} width={14} />
            Acceso exclusivo para administradores.
          </p>
        </div>
      </div>
    </div>
  )
}
