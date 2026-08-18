// Módulo neutro (ni 'use client' ni 'server-only') a propósito.
//
// Estas constantes las necesitan tanto la página (servidor, para validar el
// ?period= antes de llamar a la API) como el selector (cliente). Si vivieran en
// el archivo 'use client', el servidor recibiría una referencia al cliente en
// lugar del array, y PERIODS.some() reventaría.

export const PERIODS = [
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: '1y', label: 'Último año' },
] as const

export const DEFAULT_PERIOD = '30d'

export const isValidPeriod = (value?: string) =>
  PERIODS.some((p) => p.value === value)
