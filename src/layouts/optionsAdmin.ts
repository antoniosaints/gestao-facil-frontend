import { type Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'
import {
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  Cog,
  FileSliders,
  GitBranchPlus,
  HandCoins,
  Lock,
  ServerCog,
  Sparkles,
  User,
  UserStar,
} from 'lucide-vue-next'

export const sidebarMenuOptionsAdmin = (permissions: Permissoes): SidebarMenuType[] => {
  return [
    {
      nome: 'Dashboard',
      icone: ChartPie,
      color: 'orange',
      link: '/admin',
    },
    {
      nome: 'Financeiro',
      icone: CircleDollarSign,
      color: 'emerald',
      show: permissions.financeiro.visualizar,
      children: [
        {
          nome: 'Painel',
          link: '/admin/financeiro/painel',
          show: permissions.financeiro.painel,
          icone: ChartPie,
          color: 'emerald',
        },
        {
          nome: 'Faturas',
          link: '/admin/faturas',
          icone: CircleDollarSign,
          color: 'emerald',
        },
      ],
    },
    {
      nome: 'Assinantes',
      icone: UserStar,
      show: permissions.clientes.visualizar,
      color: 'violet',
      link: '/admin/assinantes',
    },
    {
      nome: 'Configurações',
      icone: Cog,
      show: permissions.configuracoes.visualizar,
      color: 'indigo',
      link: '/admin/configuracoes',
    },
    {
      nome: 'Monitoramento',
      icone: ServerCog,
      color: 'orange',
      link: '/admin/insights',
    },
    {
      nome: 'ERP',
      divisor: true,
      show: permissions.financeiro.visualizar,
    },
    {
      nome: 'Modo ERP',
      color: 'violet',
      icone: FileSliders,
      show: permissions.superadmin,
      link: '/',
    },
  ]
}
