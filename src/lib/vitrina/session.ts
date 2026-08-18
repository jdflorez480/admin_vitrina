import 'server-only'

import { cookies } from 'next/headers'
import type { AdminUser } from './types'

export const SESSION_COOKIE = 'vr_admin_session'

interface SessionPayload {
  token: string
  user: AdminUser
}

/**
 * El JWT vive en una cookie httpOnly: nunca es legible desde JavaScript del
 * navegador. Es un token de ADMIN capaz de borrar usuarios, así que no puede
 * acabar en localStorage ni en el bundle del cliente.
 */
export async function createSession(payload: SessionPayload, expiresIn: number) {
  const store = await cookies()

  store.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: expiresIn,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionPayload
  } catch {
    // Cookie corrupta o de un formato viejo: se trata como sesión inexistente.
    return null
  }
}

export async function destroySession() {
  ;(await cookies()).delete(SESSION_COOKIE)
}
