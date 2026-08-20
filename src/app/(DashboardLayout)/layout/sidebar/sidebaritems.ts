import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  item?: unknown
  url?: string
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: string
  id?: number | string
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: string
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

// Sólo lo que existe en el panel. Las secciones demo del template (blog, notas,
// tickets, enlaces a la web del theme) se quitaron junto con sus páginas.
const SidebarContent: MenuItem[] = [
  {
    heading: 'Panel',
    children: [
      {
        name: 'Métricas',
        icon: 'solar:chart-square-linear',
        id: uniqueId(),
        url: '/',
      },
    ],
  },
  {
    heading: 'Administración',
    children: [
      {
        name: 'Usuarios',
        icon: 'solar:users-group-rounded-linear',
        id: uniqueId(),
        url: '/usuarios',
      },
      {
        name: 'Planes de pago',
        icon: 'solar:crown-linear',
        id: uniqueId(),
        url: '/planes-pago',
      },
    ],
  },
]

export default SidebarContent
