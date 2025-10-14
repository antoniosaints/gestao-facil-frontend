import { useUiStore, type Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'
import {
  Boxes,
  CalendarCheck,
  CalendarCheck2,
  ChartPie,
  CircleDollarSign,
  Cog,
  FileCheck2,
  GitBranchPlus,
  Lock,
  MapPinned,
  ScrollText,
  Sparkles,
  Tags,
  TicketCheck,
  User,
  UserStar,
  Wrench,
} from 'lucide-vue-next'

export const sidebarMenuOptions = (permissions: Permissoes): SidebarMenuType[] => {
  return [
    {
      nome: 'Dashboard',
      icone: ChartPie,
      color: 'orange',
      link: '/',
    },
    {
      nome: 'Arena',
      icone: CalendarCheck,
      show: false,
      color: 'blue',
      children: [
        {
          nome: 'Painel',
          link: '/vendas/dashboard',
          icone: ChartPie,
          color: 'blue',
        },
        {
          nome: 'Calendário',
          link: '/vendas',
          icone: CalendarCheck2,
          color: 'blue',
        },
        {
          nome: 'Reservas',
          link: '/vendas/dashboard',
          icone: TicketCheck,
          color: 'blue',
        },
        {
          nome: 'Quadras',
          link: '/vendas/dashboard',
          icone: MapPinned,
          color: 'blue',
        },
      ],
    },
    {
      nome: 'Vendas',
      icone: Tags,
      color: 'green',
      show: permissions.vendas.visualizar,
      children: [
        {
          nome: 'Painel',
          link: '/vendas/dashboard',
          show: permissions.vendas.painel,
          icone: ChartPie,
          color: 'green',
        },
        {
          nome: 'Vendas',
          link: '/vendas',
          icone: Tags,
          color: 'green',
        },
      ],
    },
    {
      nome: 'Produtos',
      icone: Boxes,
      color: 'blue',
      show: permissions.produtos.visualizar,
      children: [
        {
          nome: 'Painel',
          link: '/produtos/dashboard',
          show: permissions.produtos.painel,
          icone: ChartPie,
          color: 'blue',
        },
        {
          nome: 'Produtos',
          link: '/produtos',
          icone: Boxes,
          color: 'blue',
        },
      ],
    },
    {
      nome: 'Financeiro',
      icone: CircleDollarSign,
      color: 'emerald',
      show: permissions.financeiro.visualizar,
      children: [
        {
          nome: 'Painel',
          link: '/financeiro/painel',
          show: permissions.financeiro.painel,
          icone: ChartPie,
          color: 'emerald',
        },
        {
          nome: 'Lançamentos',
          link: '/financeiro/lancamentos',
          icone: CircleDollarSign,
          color: 'emerald',
        },
      ],
    },
    {
      nome: 'Clientes',
      icone: UserStar,
      show: permissions.clientes.visualizar,
      color: 'violet',
      link: '/clientes',
    },
    {
      nome: 'Desenvolvimento',
      divisor: true,
      show: false,
    },
    {
      nome: 'Serviços',
      icone: Wrench,
      show: permissions.servicos.visualizar && false,
      color: 'yellow',
      children: [
        { nome: 'Painel', link: '/servicos/painel', color: 'yellow', icone: ChartPie },
        { nome: 'Ordens', link: '/servicos/ordens', color: 'yellow', icone: ScrollText },
        { nome: 'Serviços', link: '/serviços', color: 'yellow', icone: Wrench },
      ],
    },
    {
      nome: 'Notas Fiscais',
      icone: FileCheck2,
      show: false,
      color: 'cyan',
      link: '/notas-fiscais',
      children: [
        // { nome: "Painel", link: "/financeiro/painel", icone: "fa-solid fa-chart-pie" },
        // { nome: "Lançamentos", link: "/financeiro/lancamentos", icone: "fa-solid fa-coins" },
      ],
    },
    {
      nome: 'Administração',
      divisor: true,
      show: permissions.admin,
    },
    {
      nome: 'Usuários',
      icone: User,
      show: permissions.admin,
      color: 'purple',
      link: '/administracao/usuarios',
    },
    {
      nome: 'Configurações',
      icone: Cog,
      show: permissions.admin,
      color: 'indigo',
      link: '/configuracoes',
    },
    {
      nome: 'Assinatura',
      divisor: true,
    },
    {
      nome: 'Assinatura',
      color: 'orange',
      icone: Sparkles,
      link: '/assinatura/resumo',
    },
    {
      nome: 'Modo Admin',
      color: 'violet',
      icone: Lock,
      show: permissions.superadmin,
      link: '/admin',
    },
    {
      nome: 'Atualizações',
      color: 'blue',
      icone: GitBranchPlus,
      link: '/changelog',
    },
    {
      nome: 'Perfil',
      color: 'blue',
      icone: User,
      link: '/usuario/perfil',
    },
  ]
}
