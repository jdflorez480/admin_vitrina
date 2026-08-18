/**
 * Paleta categórica de las gráficas.
 *
 * Derivada de los tokens del template, pero con el turquesa y el ámbar
 * oscurecidos: los originales (#13deb9, #f6b51e) quedaban por debajo de 3:1 de
 * contraste sobre fondo claro — se desvanecían. Estos seis pasan las cuatro
 * comprobaciones (banda de luminosidad, croma, separación para daltonismo y
 * contraste) tanto en tema claro como oscuro, así que sirve una sola lista.
 *
 * El orden es fijo: cada serie conserva su color aunque se filtren otras.
 */
export const CHART_COLORS = [
  '#5d87ff', // azul
  '#0f9e86', // verde
  '#8754ec', // violeta
  '#b07c04', // ámbar
  '#ef4444', // rojo
  '#1f9ae0', // celeste
] as const

/**
 * Origen público de la app. Constante, no variable de entorno: este módulo lo
 * importan componentes de cliente, donde una env sin prefijo NEXT_PUBLIC_ sería
 * `undefined` y caería al valor por defecto sin avisar.
 */
export const VITRINA_APP_ORIGIN = 'https://vitrinaraiz.com'

/**
 * Vitrina pública del agente: está a nivel raíz, `vitrinaraiz.com/<slug>`.
 *
 * Verificado contra la app: un slug real devuelve su página ("Rafael Salamanca —
 * Asesor Inmobiliario") y uno inexistente devuelve 404.
 */
export const vitrinaUrl = (slug: string) => `${VITRINA_APP_ORIGIN}/${slug}`

const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const decimal = new Intl.NumberFormat('es-CO')

export const formatCurrency = (value: number) => cop.format(value)

export const formatNumber = (value: number) => decimal.format(value)

/** Cifras grandes en las tarjetas: 29.330.000 → $29,3 M */
export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace('.', ',')} M`
  }
  if (Math.abs(value) >= 1_000) {
    return `$${Math.round(value / 1_000)} K`
  }
  return cop.format(value)
}

export const formatPercent = (value: number) =>
  `${value.toFixed(1).replace('.', ',')} %`

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Etiqueta corta del eje X, según cómo agrupó la API la serie temporal. */
export function formatTrendLabel(date: string, granularity: string) {
  const d = new Date(date)
  if (granularity === 'month') {
    return d.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
  }
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
}

/** Ordena un objeto de conteos de mayor a menor y descarta los ceros. */
export function sortedEntries(breakdown: Record<string, number>) {
  return Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
}
