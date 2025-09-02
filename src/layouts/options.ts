import type { SidebarMenuType } from '@/types/sidebar'
import {
  Boxes,
  ChartPie,
  CircleDollarSign,
  Cog,
  FileCheck2,
  Lock,
  ScrollText,
  Sparkles,
  Tags,
  User,
  UserStar,
  Wrench,
} from 'lucide-vue-next'

export const sidebarMenuOptions: SidebarMenuType[] = [
  {
    nome: 'Dashboard',
    icone: ChartPie,
    color: 'orange',
    link: '/',
  },
  {
    nome: 'Vendas',
    icone: Tags,
    color: 'green',
    children: [
      {
        nome: 'Painel',
        link: '/vendas/dashboard',
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
    children: [
      {
        nome: 'Painel',
        link: '/produtos/dashboard',
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
    children: [
      {
        nome: 'Painel',
        link: '/financeiro/painel',
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
    color: 'violet',
    link: '/clientes',
  },
  {
    nome: 'Desenvolvimento',
    divisor: true,
  },
  {
    nome: 'Serviços',
    icone: Wrench,
    color: 'yellow',
    children: [
      { nome: 'Ordens', link: '/servicos/ordens', color: 'yellow', icone: ScrollText },
      { nome: 'Serviços', link: '/serviços', color: 'yellow', icone: Wrench },
    ],
  },
  {
    nome: 'Notas Fiscais',
    icone: FileCheck2,
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
  },
  {
    nome: 'Usuários',
    icone: User,
    color: 'purple',
    link: '/usuarios',
  },
  {
    nome: 'Configurações',
    icone: Cog,
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
    link: '/assinatura',
  },
  {
    nome: 'Modo Admin',
    color: 'violet',
    icone: Lock,
    link: '/admin',
  },
  {
    nome: 'Perfil',
    color: 'blue',
    icone: User,
    link: '/usuario/perfil',
  },
]
