import { NextResponse, type NextRequest } from 'next/server'
import { ApiError, impersonateUser } from '@/lib/vitrina/api'
import { getSession } from '@/lib/vitrina/session'
import { APP_URL, COOKIE_DOMAIN, IMPERSONATION_COOKIE } from '@/lib/vitrina/impersonation'

/**
 * Entrar a la app como un usuario, de un clic.
 *
 * El truco: un servidor en `admin.vitrinaraiz.com` PUEDE emitir una cookie con
 * `Domain=.vitrinaraiz.com` (el dominio padre), y el navegador la enviará luego
 * a `vitrinaraiz.com`. Por eso no hace falta tocar el backend.
 *
 * El formulario que llama aquí usa target="_blank": la pestaña nueva hace el
 * POST, recibe la cookie y sigue el redirect hasta la app, ya autenticada.
 *
 * Sólo funciona con el dashboard servido desde un subdominio de vitrinaraiz.com.
 * En localhost es imposible: un origen no puede escribir cookies de otro dominio.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Un route handler no trae la protección CSRF que sí tienen las Server Actions.
  // Sin esto, una web maliciosa podría hacer que un admin logueado impersonara a
  // alguien con un POST cruzado. El atacante no vería el token (es httpOnly),
  // pero la sesión del admin quedaría suplantada igual.
  const origin = req.headers.get('origin')
  if (origin && origin !== req.nextUrl.origin) {
    return new NextResponse('Origen no permitido', { status: 403 })
  }

  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  if (!COOKIE_DOMAIN) {
    return new NextResponse(
      'Falta VITRINA_COOKIE_DOMAIN. El acceso directo sólo funciona con el panel ' +
        'desplegado en un subdominio de vitrinaraiz.com.',
      { status: 501 },
    )
  }

  const { id } = await params

  let token: string
  let expiresIn: number
  try {
    ;({ token, expiresIn } = await impersonateUser(id))
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : 'No se pudo generar el acceso.'
    const status = err instanceof ApiError ? err.status : 500
    return new NextResponse(message, { status })
  }

  // 303: convierte el POST en un GET al seguir el redirect.
  const res = NextResponse.redirect(APP_URL, 303)

  res.cookies.set(IMPERSONATION_COOKIE, token, {
    domain: COOKIE_DOMAIN,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  })

  return res
}
