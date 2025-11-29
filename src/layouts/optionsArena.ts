import { type Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'
import {
  Boxes,
  CalendarCheck,
  CalendarClock,
  ChartPie,
  Cog,
  FileCheck,
  FileText,
  GitBranchPlus,
  Lock,
  MapPinned,
  Pen,
  ShoppingBag,
  Sparkles,
  Tags,
  TicketCheck,
  User,
  UserStar,
} from 'lucide-vue-next'

export const sidebarMenuArenaOptions = (permissions: Permissoes): SidebarMenuType[] => {
  return [
    {
      nome: 'Painel',
      link: '/arena',
      icone: ChartPie,
      color: 'blue',
    },
    {
      nome: 'Reservas',
      icone: TicketCheck,
      color: 'blue',
      children: [
        {
          nome: 'Reservas',
          link: '/arena/reservas',
          icone: CalendarClock,
          color: 'blue',
        },
        {
          nome: 'Calendário',
          link: '/arena/calendario',
          icone: CalendarCheck,
          color: 'blue',
        },
      ],
    },
    {
      nome: 'Vendas',
      icone: ShoppingBag,
      color: 'blue',
      children: [
        {
          nome: 'Vendas',
          link: '/arena/vendas',
          icone: Tags,
          color: 'blue',
        },
        {
          nome: 'Comandas',
          link: '/arena/comandas',
          icone: FileText,
          color: 'blue',
        },
      ],
    },
    {
      nome: 'Quadras',
      link: '/arena/quadras',
      icone: MapPinned,
      color: 'blue',
    },
    {
      nome: 'Cadastros',
      icone: Pen,
      children: [
        {
          nome: 'Produtos',
          link: '/produtos',
          show: permissions.produtos.visualizar,
          icone: Boxes,
          color: 'blue',
        },
        {
          nome: 'Serviços',
          link: '/servicos',
          show: permissions.servicos.visualizar,
          icone: FileCheck,
          color: 'blue',
        },
        {
          nome: 'Clientes',
          icone: UserStar,
          show: permissions.clientes.visualizar,
          color: 'violet',
          link: '/clientes',
        },
        {
          nome: 'Usuários',
          icone: User,
          show: permissions.admin,
          color: 'purple',
          link: '/administracao/usuarios',
        },
      ],
    },
    {
      nome: 'Administração',
      divisor: true,
      show: permissions.admin,
    },
    {
      nome: 'Configurações',
      icone: Cog,
      show: permissions.configuracoes.visualizar,
      color: 'indigo',
      link: '/configuracoes',
    },
    {
      nome: 'Assinatura',
      divisor: true,
      show: permissions.financeiro.visualizar,
    },
    {
      nome: 'Assinatura',
      color: 'orange',
      show: permissions.financeiro.visualizar,
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
      show: true,
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
