'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Icon } from '@iconify/react'
import CardBox from '../../shared/CardBox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  changePlanAction,
  deactivateUserAction,
  hardDeleteUserAction,
  impersonateAction,
  reactivateUserAction,
  updateUserAction,
  type ActionState,
} from '@/app/(DashboardLayout)/usuarios/actions'
import { PLANS, ROLES, type User } from '@/lib/vitrina/types'

const PERIODS = ['MONTHLY', 'SEMIANNUAL', 'ANNUAL']

const Submit = ({
  children,
  variant,
}: {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline'
}) => {
  const { pending } = useFormStatus()

  return (
    <Button type='submit' variant={variant} disabled={pending}>
      {pending && <Icon icon='solar:refresh-linear' className='animate-spin' />}
      {children}
    </Button>
  )
}

const Feedback = ({ state }: { state: ActionState }) => {
  if (!state.error && !state.success) return null

  const isError = Boolean(state.error)

  return (
    <div
      role='alert'
      className={`mt-4 flex items-start gap-2 rounded-md px-3 py-2.5 text-sm ${
        isError ? 'bg-lighterror text-error' : 'bg-lightsuccess text-success'
      }`}>
      <Icon
        icon={isError ? 'solar:danger-triangle-linear' : 'solar:check-circle-linear'}
        className='mt-0.5 shrink-0 text-base'
      />
      <span>{state.error ?? state.success}</span>
    </div>
  )
}

/** Editar datos básicos. */
const EditForm = ({ user }: { user: User }) => {
  const [state, action] = useActionState<ActionState, FormData>(updateUserAction, {})

  return (
    <CardBox className='p-6'>
      <h5 className='mb-4 text-lg font-semibold'>Datos del usuario</h5>

      <form action={action} className='space-y-4'>
        <input type='hidden' name='id' value={user.id} />
        {/* Comparamos contra el original para enviar sólo lo que cambió. */}
        <input type='hidden' name='original_name' value={user.name} />
        <input type='hidden' name='original_email' value={user.email} />
        <input type='hidden' name='original_role' value={user.role} />
        <input type='hidden' name='original_currentPlan' value={user.currentPlan} />

        <div>
          <Label htmlFor='name'>Nombre</Label>
          <Input id='name' name='name' defaultValue={user.name} className='mt-1.5' />
        </div>

        <div>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            name='email'
            type='email'
            defaultValue={user.email}
            className='mt-1.5'
          />
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label htmlFor='role'>Rol</Label>
            <Select name='role' defaultValue={user.role}>
              <SelectTrigger id='role' className='mt-1.5 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor='currentPlan'>Plan</Label>
            <Select name='currentPlan' defaultValue={user.currentPlan}>
              <SelectTrigger id='currentPlan' className='mt-1.5 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor='password'>Nueva contraseña</Label>
          <Input
            id='password'
            name='password'
            type='password'
            placeholder='Dejar vacío para no cambiarla'
            className='mt-1.5'
          />
          <p className='mt-1 text-xs text-muted-foreground'>Mínimo 8 caracteres.</p>
        </div>

        <Submit>Guardar cambios</Submit>
        <Feedback state={state} />
      </form>
    </CardBox>
  )
}

/** Plan y suscripción (override manual, no pasa por MercadoPago). */
const PlanForm = ({ user }: { user: User }) => {
  const [state, action] = useActionState<ActionState, FormData>(changePlanAction, {})
  const [mode, setMode] = useState('set-plan')

  return (
    <CardBox className='p-6'>
      <h5 className='mb-1 text-lg font-semibold'>Suscripción</h5>
      <p className='mb-4 text-sm text-muted-foreground'>
        Cambio administrativo directo: no pasa por el checkout de MercadoPago.
      </p>

      <form action={action} className='space-y-4'>
        <input type='hidden' name='id' value={user.id} />
        <input type='hidden' name='action' value={mode} />

        <div>
          <Label>Operación</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className='mt-1.5 w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='set-plan'>Asignar / cambiar plan</SelectItem>
              <SelectItem value='extend-trial'>Extender trial</SelectItem>
              <SelectItem value='cancel'>Cancelar suscripción</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === 'set-plan' && (
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='plan'>Plan</Label>
              <Select name='plan' defaultValue={user.currentPlan}>
                <SelectTrigger id='plan' className='mt-1.5 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan} value={plan}>
                      {plan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor='billingPeriod'>Facturación</Label>
              <Select name='billingPeriod' defaultValue='MONTHLY'>
                <SelectTrigger id='billingPeriod' className='mt-1.5 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {mode === 'extend-trial' && (
          <div>
            <Label htmlFor='days'>Días a extender</Label>
            <Input
              id='days'
              name='days'
              type='number'
              min={1}
              defaultValue={15}
              className='mt-1.5'
            />
            <p className='mt-1 text-xs text-muted-foreground'>
              Extiende desde hoy o desde el fin del trial actual, lo que sea mayor. Pone el plan en TRIAL.
            </p>
          </div>
        )}

        {mode === 'cancel' && (
          <div>
            <Label htmlFor='downgradeTo'>Bajar al plan</Label>
            <Select name='downgradeTo' defaultValue='BASIC'>
              <SelectTrigger id='downgradeTo' className='mt-1.5 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLANS.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Submit>Aplicar</Submit>
        <Feedback state={state} />
      </form>
    </CardBox>
  )
}

/** Impersonar: genera un token de 1 h para entrar como el usuario. */
const ImpersonateBox = ({
  user,
  directAccess,
}: {
  user: User
  directAccess: boolean
}) => {
  const [state, action] = useActionState<ActionState & { token?: string }, FormData>(
    impersonateAction,
    {},
  )
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!state.token) return
    await navigator.clipboard.writeText(state.token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Acceso de un clic: form normal (no Server Action) porque necesitamos que
          la navegación con target="_blank" reciba la cookie y siga el redirect. */}
      {directAccess && (
        <div className='mb-6'>
          <form
            method='POST'
            action={`/api/impersonate/${user.id}`}
            target='_blank'
            rel='noopener'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='font-medium'>Entrar a la cuenta</p>
                <p className='text-sm text-muted-foreground'>
                  Abre la app en otra pestaña, ya dentro de la cuenta de {user.name}.
                  Dura 1 hora y queda registrado que fuiste vos.
                </p>
              </div>
              <Button type='submit'>
                <Icon icon='solar:login-3-linear' />
                Ir a la cuenta
              </Button>
            </div>
          </form>

          {/* La cookie vive 1 h en todo el dominio: sin esto seguirías navegando
              la app como el usuario aunque cerraras la pestaña. */}
          <form method='POST' action='/api/impersonate/exit' className='mt-3'>
            <button
              type='submit'
              className='text-xs text-muted-foreground underline hover:text-primary'>
              Salir de la impersonación
            </button>
          </form>
        </div>
      )}

      <form action={action}>
        <input type='hidden' name='id' value={user.id} />

        <div className='flex items-start justify-between gap-4'>
          <div>
            <p className='font-medium'>
              {directAccess ? 'Generar token manualmente' : 'Entrar como este usuario'}
            </p>
            <p className='text-sm text-muted-foreground'>
              Token de soporte válido por 1 hora, para usar contra la API. Queda
              registrado quién lo pidió.
            </p>
          </div>
          <Submit variant='outline'>Generar token</Submit>
        </div>

        {state.token && (
        <div className='mt-4 rounded-md border border-warning/30 bg-lightwarning/40 p-4'>
          <p className='flex items-center gap-2 text-sm font-medium text-warning'>
            <Icon icon='solar:key-linear' />
            Token de sesión de {user.name}
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Da acceso a la cuenta de esta persona. Caduca en 1 hora y lleva tu id en el
            claim <code>impersonatedBy</code>, así que el uso queda trazado. No lo
            compartas.
          </p>

          <div className='mt-3 flex items-start gap-2'>
            <code className='min-w-0 flex-1 break-all rounded-md border border-border bg-card p-2 font-mono text-xs'>
              {state.token}
            </code>
            <Button type='button' variant='outline' size='sm' onClick={copy}>
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

            <p className='mt-3 text-xs text-muted-foreground'>
              Usalo contra la app como cabecera{' '}
              <code>Authorization: Bearer …</code> o como cookie{' '}
              <code>vitrina_token</code> en <code>vitrinaraiz.com</code>.
            </p>
          </div>
        )}

        <Feedback state={state} />
      </form>
    </>
  )
}

/** Zona de peligro: desactivar (reversible) y borrar (irreversible). */
const DangerZone = ({
  user,
  directAccess,
}: {
  user: User
  directAccess: boolean
}) => {
  const [deactivateState, deactivate] = useActionState<ActionState, FormData>(
    deactivateUserAction,
    {},
  )
  const [reactivateState, reactivate] = useActionState<ActionState, FormData>(
    reactivateUserAction,
    {},
  )
  const [deleteState, hardDelete] = useActionState<ActionState, FormData>(
    hardDeleteUserAction,
    {},
  )

  const [confirmation, setConfirmation] = useState('')
  const isDeactivated = user.deletedAt !== null
  const isAdmin = user.role === 'ADMIN'

  if (isAdmin) {
    return (
      <CardBox className='p-6'>
        <h5 className='mb-1 text-lg font-semibold'>Estado de la cuenta</h5>
        <p className='text-sm text-muted-foreground'>
          Las cuentas ADMIN no se pueden desactivar, borrar ni impersonar. La API lo
          rechaza.
        </p>
      </CardBox>
    )
  }

  return (
    <CardBox className='p-6'>
      <h5 className='mb-4 text-lg font-semibold'>Estado de la cuenta</h5>

      <div className='space-y-6'>
        <ImpersonateBox user={user} directAccess={directAccess} />

        <hr className='border-border' />

        {isDeactivated ? (
          <form action={reactivate}>
            <input type='hidden' name='id' value={user.id} />
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='font-medium'>Reactivar usuario</p>
                <p className='text-sm text-muted-foreground'>
                  Restaura el email original. Tendrá que restablecer su contraseña.
                </p>
              </div>
              <Submit>Reactivar</Submit>
            </div>
            <Feedback state={reactivateState} />
          </form>
        ) : (
          <form action={deactivate}>
            <input type='hidden' name='id' value={user.id} />
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='font-medium'>Desactivar usuario</p>
                <p className='text-sm text-muted-foreground'>
                  No podrá iniciar sesión, pero sus datos se conservan. Es reversible.
                </p>
              </div>
              <Submit variant='outline'>Desactivar</Submit>
            </div>
            <Feedback state={deactivateState} />
          </form>
        )}

        <hr className='border-border' />

        <div className='rounded-md border border-error/30 bg-lighterror/40 p-4'>
          <p className='flex items-center gap-2 font-medium text-error'>
            <Icon icon='solar:danger-triangle-linear' />
            Borrado permanente
          </p>
          <p className='mt-1 text-sm text-muted-foreground'>
            Elimina al usuario y <strong>todos</strong> sus datos en cascada:{' '}
            {user._count.properties} propiedad(es), {user._count.leads} lead(s),{' '}
            {user._count.deals} negocio(s), {user._count.buildings} edificio(s) y{' '}
            {user._count.tenants} inquilino(s). <strong>No se puede deshacer.</strong>
          </p>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant='destructive' className='mt-3'>
                Borrar permanentemente
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Borrar a {user.name}</DialogTitle>
                <DialogDescription>
                  Esta acción es irreversible y arrastra todos sus datos. Para confirmar,
                  escribí el email exacto del usuario.
                </DialogDescription>
              </DialogHeader>

              <form action={hardDelete}>
                <input type='hidden' name='id' value={user.id} />
                <input type='hidden' name='email' value={user.email} />

                <Label htmlFor='confirmation'>
                  Escribí <code className='text-error'>{user.email}</code>
                </Label>
                <Input
                  id='confirmation'
                  name='confirmation'
                  autoComplete='off'
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className='mt-1.5'
                />

                <Feedback state={deleteState} />

                <DialogFooter className='mt-4'>
                  {/* El botón sólo se habilita con el email exacto: un clic
                      accidental no puede disparar un borrado en cascada. */}
                  <Button
                    type='submit'
                    variant='destructive'
                    disabled={confirmation !== user.email}>
                    Entiendo las consecuencias, borrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CardBox>
  )
}

const UserActions = ({
  user,
  directAccess,
}: {
  user: User
  /** El acceso de un clic sólo existe si el panel corre bajo *.vitrinaraiz.com. */
  directAccess: boolean
}) => (
  <div className='grid grid-cols-12 gap-6'>
    <div className='col-span-12 lg:col-span-6'>
      <EditForm user={user} />
    </div>
    <div className='col-span-12 lg:col-span-6'>
      <PlanForm user={user} />
    </div>
    <div className='col-span-12'>
      <DangerZone user={user} directAccess={directAccess} />
    </div>
  </div>
)

export default UserActions
