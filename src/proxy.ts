import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/vitrina/session'

/**
  * Puerta de entrada: sin cookie de sesión no se ve el panel.
 *
 * Sólo comprueba que la cookie exista — no valida el JWT. La validación real la
 * hace la API en cada request (responde 401 si el token venció o es falso); acá
 * únicamente evitamos renderizar el panel a quien claramente no inició sesión.
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE)
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth')

  if (!hasSession && !isAuthPage) {
    const url = new URL('/auth/login', req.url)
    return NextResponse.redirect(url)
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Excluye assets y rutas internas de Next; el resto pasa por la puerta.
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.svg|manifest.json|sw.js).*)'],
}
