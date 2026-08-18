'use server'

import { redirect } from 'next/navigation'
import { ApiError, login } from '@/lib/vitrina/api'
import { createSession, destroySession } from '@/lib/vitrina/session'

export interface LoginState {
  error?: string
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Ingresá tu email y contraseña.' }
  }

  try {
    const { token, user, expiresIn } = await login(email, password)

    // El panel es sólo para administradores. Un AGENT con credenciales válidas
    // recibe un token, pero la API le negaría cada endpoint: mejor cortarlo acá
    // con un mensaje claro que dejarlo entrar a un dashboard que fallará entero.
    if (user.role !== 'ADMIN') {
      return { error: 'Esta cuenta no tiene permisos de administrador.' }
    }

    await createSession({ token, user }, expiresIn)
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        return { error: 'Email o contraseña incorrectos.' }
      }
      if (err.status === 429) {
        const secs = Number(err.retryAfter)
        const espera = Number.isFinite(secs)
          ? `Esperá ${Math.ceil(secs / 60)} minuto(s).`
          : 'Esperá unos minutos.'
        return { error: `Demasiados intentos fallidos. ${espera}` }
      }
      return { error: err.message }
    }

    return { error: 'No se pudo conectar con la API. Revisá tu conexión.' }
  }

  // redirect() lanza una excepción de control interna de Next: va fuera del try
  // para que el catch de arriba no la confunda con un error real.
  redirect('/')
}

export async function logoutAction() {
  await destroySession()
  redirect('/auth/login')
}
