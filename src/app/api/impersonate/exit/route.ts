import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_DOMAIN, IMPERSONATION_COOKIE } from '@/lib/vitrina/impersonation'

/**
 * Termina la impersonación borrando la cookie del dominio padre.
 *
 * Hace falta porque la cookie vive 1 hora en todo `.vitrinaraiz.com`: sin esto,
 * el admin seguiría navegando la app como el usuario suplantado aunque cerrara
 * la pestaña.
 *
 * Sólo borra la cookie de impersonación; la sesión del panel (`vr_admin_session`)
 * no se toca.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')
  if (origin && origin !== req.nextUrl.origin) {
    return new NextResponse('Origen no permitido', { status: 403 })
  }

  const res = NextResponse.redirect(new URL('/usuarios', req.url), 303)

  res.cookies.set(IMPERSONATION_COOKIE, '', {
    domain: COOKIE_DOMAIN || undefined,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return res
}
