// Módulo neutro: lo leen el route handler (servidor) y la ficha de usuario
// (servidor) para decidir si mostrar el botón de acceso directo.

/** Nombre de la cookie de sesión que espera la app de Vitrina Raíz. */
export const IMPERSONATION_COOKIE = 'vitrina_token'

export const APP_URL = process.env.VITRINA_APP_URL ?? 'https://vitrinaraiz.com'

/**
 * Dominio padre para la cookie, p. ej. `.vitrinaraiz.com`.
 *
 * Sin esto, el acceso de un clic no es posible: sólo se pueden escribir cookies
 * del propio dominio o de un ancestro suyo. Por eso en localhost queda desactivado
 * y la UI cae al método manual (copiar el token).
 */
export const COOKIE_DOMAIN = process.env.VITRINA_COOKIE_DOMAIN ?? ''

export const canImpersonateDirectly = () => Boolean(COOKIE_DOMAIN)
