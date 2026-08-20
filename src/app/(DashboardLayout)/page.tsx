import { redirect } from 'next/navigation'
import { ApiError, getStatsOverview } from '@/lib/vitrina/api'
import { getSession } from '@/lib/vitrina/session'
import { formatDate } from '@/lib/vitrina/format'
import StatTiles from '@/app/components/vitrina/StatTiles'
import TrendsChart from '@/app/components/vitrina/TrendsChart'
import BreakdownDonut from '@/app/components/vitrina/BreakdownDonut'
import BreakdownBars from '@/app/components/vitrina/BreakdownBars'
import RentalsPanel from '@/app/components/vitrina/RentalsPanel'
import RecentRegistrations from '@/app/components/vitrina/RecentRegistrations'
import { TopAgents, TopCities, TopProperties } from '@/app/components/vitrina/Rankings'
import PeriodFilter from '@/app/components/vitrina/PeriodFilter'
import PageHeader from '@/app/components/shared/PageHeader'
import { DEFAULT_PERIOD, isValidPeriod } from '@/lib/vitrina/periods'

// Etiquetas legibles para las claves crudas que devuelve la API.
const PROPERTY_STATUS: Record<string, string> = {
  PUBLISHED: 'Publicada',
  PAUSED: 'Pausada',
  DRAFT: 'Borrador',
  RENTED: 'Arrendada',
  SOLD: 'Vendida',
  NEGOTIATION: 'En negociación',
}

const LEAD_STAGE: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISITED: 'Visitó',
  NEGOTIATION: 'Negociación',
  WON: 'Ganado',
  LOST: 'Perdido',
}

const OWNER_STAGE: Record<string, string> = {
  PROSPECTO: 'Prospecto',
  CONTACTADO: 'Contactado',
  INTERESADO: 'Interesado',
  CONTRATADO: 'Contratado',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
}

const OPERATION: Record<string, string> = { SALE: 'Venta', RENT: 'Arriendo' }

const EVENT: Record<string, string> = {
  PROPERTY_VIEW: 'Vista de propiedad',
  PROFILE_VIEW: 'Vista de perfil',
  WHATSAPP_CLICK: 'Clic a WhatsApp',
  LEAD_CAPTURE: 'Lead capturado',
  LEAD_CONSENT: 'Consentimiento',
  PDF_DOWNLOAD: 'Descarga de PDF',
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: raw } = await searchParams

  // Sólo aceptamos los períodos que la API entiende: un valor arbitrario puesto
  // a mano en la URL no debe llegar al backend.
  const period = isValidPeriod(raw) ? raw! : DEFAULT_PERIOD

  let stats
  try {
    stats = await getStatsOverview(period)
  } catch (err) {
    // El JWT dura 24 h. Si venció, la cookie sigue existiendo (el middleware sólo
    // comprueba que esté) pero la API responde 401: hay que volver al login en
    // lugar de reventar la página.
    if (err instanceof ApiError && err.status === 401) redirect('/auth/login')
    throw err
  }

  const session = await getSession()

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-12'>
        <PageHeader
          icon='solar:chart-square-bold-duotone'
          title={`Hola, ${session?.user.name?.split(' ')[0] ?? 'administrador'}`}
          subtitle={`Métricas de Vitrina Raíz · actualizado el ${formatDate(stats.generatedAt)}`}>
          <PeriodFilter />
        </PageHeader>
      </div>

      <div className='col-span-12'>
        <StatTiles stats={stats} />
      </div>

      <div className='col-span-12 xl:col-span-8'>
        <TrendsChart stats={stats} />
      </div>
      <div className='col-span-12 xl:col-span-4'>
        <BreakdownDonut
          title='Usuarios por plan'
          subtitle={`${stats.users.trials.active} trial(es) activo(s) · ${stats.users.deactivated} desactivado(s)`}
          breakdown={stats.users.byPlan}
        />
      </div>

      <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
        <BreakdownBars
          title='Propiedades por estado'
          subtitle={`${stats.properties.new} nuevas en el período`}
          breakdown={stats.properties.byStatus}
          labels={PROPERTY_STATUS}
          unit='propiedades'
        />
      </div>
      <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
        <BreakdownBars
          title='Leads por etapa'
          subtitle={`${stats.leads.new} nuevos en el período`}
          breakdown={stats.leads.byStage}
          labels={LEAD_STAGE}
          unit='leads'
        />
      </div>
      <div className='col-span-12 xl:col-span-4'>
        <BreakdownDonut
          title='Venta vs. arriendo'
          subtitle='Distribución del inventario'
          breakdown={stats.properties.byOperation}
          labels={OPERATION}
        />
      </div>

      <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
        <BreakdownBars
          title='Propietarios por etapa'
          subtitle={`${stats.owners.total} en total · ${stats.owners.new} nuevos`}
          breakdown={stats.owners.byStage}
          labels={OWNER_STAGE}
          unit='propietarios'
        />
      </div>
      <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
        <RentalsPanel stats={stats} />
      </div>
      <div className='col-span-12 xl:col-span-4'>
        <BreakdownBars
          title='Eventos del período'
          subtitle='Actividad registrada en la plataforma'
          breakdown={stats.analytics.periodEvents}
          labels={EVENT}
          unit='eventos'
        />
      </div>

      <div className='col-span-12 xl:col-span-8'>
        <RecentRegistrations users={stats.recentRegistrations} />
      </div>
      <div className='col-span-12 xl:col-span-4'>
        <TopCities cities={stats.topCities} />
      </div>

      <div className='col-span-12 lg:col-span-6'>
        <TopProperties
          title='Propiedades más vistas'
          subtitle='Top 10 del período'
          properties={stats.rankings.topViewedProperties}
          icon='solar:eye-linear'
        />
      </div>
      <div className='col-span-12 lg:col-span-6'>
        <TopProperties
          title='Propiedades más contactadas'
          subtitle='Top 10 por clics a WhatsApp'
          properties={stats.rankings.topWhatsappProperties}
          icon='solar:chat-round-call-linear'
        />
      </div>

      <div className='col-span-12 lg:col-span-6'>
        <TopAgents
          title='Agentes más visitados'
          subtitle='Top 10 por vistas de perfil'
          agents={stats.rankings.topVisitedAgents}
          icon='solar:eye-linear'
        />
      </div>
      <div className='col-span-12 lg:col-span-6'>
        <TopAgents
          title='Agentes más contactados'
          subtitle='Top 10 por clics a WhatsApp'
          agents={stats.rankings.topContactedAgents}
          icon='solar:chat-round-call-linear'
        />
      </div>
    </div>
  )
}
