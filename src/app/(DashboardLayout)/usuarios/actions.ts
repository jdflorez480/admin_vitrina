'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  ApiError,
  changeSubscription,
  deactivateUser,
  hardDeleteUser,
  impersonateUser,
  invalidateUsersCache,
  reactivateUser,
  updateUser,
  type SubscriptionAction,
} from '@/lib/vitrina/api'

export interface ActionState {
  error?: string
  success?: string
}

/**
 * Tras cualquier cambio: tirar la caché del escaneo de usuarios y refrescar las
 * vistas. Sin lo primero, el admin guardaría un cambio y seguiría viendo los
 * datos viejos hasta que expire el TTL.
 */
function refreshUsers(id?: string) {
  invalidateUsersCache()
  revalidatePath('/usuarios')
  if (id) revalidatePath(`/usuarios/${id}`)
}

/** Traduce los errores de la API a algo que un admin pueda entender. */
function toMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return 'No se permite esta acción sobre un ADMIN.'
    if (err.status === 404) return 'El usuario ya no existe.'
    if (err.status === 409) return err.message || 'Conflicto: revisá el estado o el email.'
    if (err.status === 422) return 'No se pudo recuperar el email original. Indicá uno.'
    return err.message
  }
  return 'No se pudo conectar con la API.'
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id'))

  // Sólo mandamos los campos que el admin realmente tocó: un PATCH con el email
  // sin cambiar daría 409 contra sí mismo.
  const patch: Record<string, string> = {}
  for (const field of ['name', 'email', 'role', 'currentPlan'] as const) {
    const value = String(formData.get(field) ?? '').trim()
    const original = String(formData.get(`original_${field}`) ?? '')
    if (value && value !== original) patch[field] = value
  }

  const password = String(formData.get('password') ?? '')
  if (password) {
    if (password.length < 8) {
      return { error: 'La contraseña debe tener al menos 8 caracteres.' }
    }
    patch.password = password
  }

  if (!Object.keys(patch).length) {
    return { error: 'No cambiaste ningún campo.' }
  }

  try {
    await updateUser(id, patch)
  } catch (err) {
    return { error: toMessage(err) }
  }

  refreshUsers(id)
  return { success: 'Usuario actualizado.' }
}

export async function deactivateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id'))

  try {
    await deactivateUser(id)
  } catch (err) {
    return { error: toMessage(err) }
  }

  refreshUsers(id)
  return { success: 'Usuario desactivado. Se puede reactivar cuando quieras.' }
}

export async function reactivateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id'))
  const email = String(formData.get('email') ?? '').trim()

  try {
    await reactivateUser(id, email || undefined)
  } catch (err) {
    return { error: toMessage(err) }
  }

  refreshUsers(id)
  return {
    success: 'Usuario reactivado. Deberá restablecer su contraseña (se anuló al desactivar).',
  }
}

/**
 * Borrado FÍSICO: no hay vuelta atrás — se lleva propiedades, leads y deals en
 * cascada. Exige que el admin escriba el email exacto del usuario; un clic
 * accidental no puede disparar esto.
 */
export async function hardDeleteUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id'))
  const email = String(formData.get('email'))
  const confirmation = String(formData.get('confirmation') ?? '').trim()

  if (confirmation !== email) {
    return { error: 'El email no coincide. No se borró nada.' }
  }

  try {
    await hardDeleteUser(id)
  } catch (err) {
    return { error: toMessage(err) }
  }

  refreshUsers()
  redirect('/usuarios')
}

export async function changePlanAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get('id'))
  const action = String(formData.get('action'))

  let payload: SubscriptionAction

  if (action === 'set-plan') {
    payload = {
      action: 'set-plan',
      plan: String(formData.get('plan')),
      billingPeriod: String(formData.get('billingPeriod') || 'MONTHLY'),
    }
  } else if (action === 'extend-trial') {
    const days = Number(formData.get('days'))
    if (!Number.isFinite(days) || days <= 0) {
      return { error: 'Indicá un número de días válido.' }
    }
    payload = { action: 'extend-trial', days }
  } else if (action === 'cancel') {
    payload = {
      action: 'cancel',
      downgradeTo: String(formData.get('downgradeTo') || 'BASIC'),
    }
  } else {
    return { error: 'Acción desconocida.' }
  }

  try {
    const res = await changeSubscription(id, payload)
    refreshUsers(id)
    return { success: res.message ?? 'Suscripción actualizada.' }
  } catch (err) {
    return { error: toMessage(err) }
  }
}

/**
 * Genera un token para entrar a la app como ese usuario (soporte). Dura 1 h y
 * lleva el claim `impersonatedBy`, así que queda trazado quién lo hizo.
 *
 * El token se devuelve para copiarlo a mano: NO lo escribimos en una cookie ni
 * lo mandamos a ningún lado automáticamente.
 */
export async function impersonateAction(
  _prev: ActionState & { token?: string },
  formData: FormData,
): Promise<ActionState & { token?: string }> {
  const id = String(formData.get('id'))

  try {
    const res = await impersonateUser(id)
    return { success: 'Token generado. Válido por 1 hora.', token: res.token }
  } catch (err) {
    return { error: toMessage(err) }
  }
}
