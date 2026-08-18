import CardBox from '../shared/CardBox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatNumber } from '@/lib/vitrina/format'
import type { Plan, RecentRegistration } from '@/lib/vitrina/types'

const PLAN_STYLE: Record<Plan, string> = {
  LAUNCH: 'bg-lightprimary text-primary',
  TRIAL: 'bg-lightwarning text-warning',
  BASIC: 'bg-lightinfo text-info',
  PRO: 'bg-lightsuccess text-success',
  INMOBILIARIA: 'bg-lightsecondary text-secondary',
  ILIMITADO: 'bg-lighterror text-error',
}

const RecentRegistrations = ({ users }: { users: RecentRegistration[] }) => (
  <CardBox className='h-full p-6'>
    <div className='mb-4'>
      <h5 className='text-lg font-semibold'>Registros recientes</h5>
      <p className='text-sm text-muted-foreground'>
        Últimos {users.length} usuarios del período
      </p>
    </div>

    {/* La tabla se desborda a lo ancho en móvil: scrollea sola, sin arrastrar la página. */}
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className='text-right'>Props.</TableHead>
            <TableHead className='text-right'>Leads</TableHead>
            <TableHead className='text-right'>Registro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <p className='font-medium'>{user.name}</p>
                <p className='text-xs text-muted-foreground'>{user.email}</p>
              </TableCell>
              <TableCell>
                <Badge className={`${PLAN_STYLE[user.plan]} border-0`}>
                  {user.plan}
                </Badge>
              </TableCell>
              <TableCell className='text-right'>
                {formatNumber(user.activity.properties)}
              </TableCell>
              <TableCell className='text-right'>
                {formatNumber(user.activity.leads)}
              </TableCell>
              <TableCell className='whitespace-nowrap text-right text-sm text-muted-foreground'>
                {formatDate(user.registeredAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardBox>
)

export default RecentRegistrations
