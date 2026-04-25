import { type Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'
import {
  Bot,
  Box,
  Boxes,
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  Cog,
  FileBox,
  FileCheck2,
  FileDigit,
  GitBranchPlus,
  HandCoins,
  Layers3,
  MapPinned,
  MessageCircle,
  Package,
  ReceiptText,
  Sparkles,
  Store,
  Tags,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  User,
  UserStar,
  Wrench,
} from 'lucide-vue-next'

export const sidebarMenuOptions = (
  permissions: Permissoes,
  appModules: Record<string, boolean> = {},
): SidebarMenuType[] => {
  const hasAssinaturasApp = Boolean(appModules.assinaturas)
  const hasCoreIaApp = Boolean(appModules['core-ia'])
  const hasWhatsappApp = Boolean(appModules.whatsapp)
  const hasVisibleAppsSection =
    (permissions.financeiro.visualizar && hasAssinaturasApp) ||
    (permissions.vendas.visualizar && hasCoreIaApp) ||
    (permissions.configuracoes.visualizar && hasWhatsappApp)

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
        {
          nome: 'Acompanhamento',
          link: '/financeiro/acompanhamento',
          icone: CalendarClock,
          color: 'emerald',
        },
        {
          nome: 'Contas a receber',
          link: '/financeiro/contas-a-receber',
          icone: TrendingUp,
          color: 'emerald',
        },
        {
          nome: 'Contas a pagar',
          link: '/financeiro/contas-a-pagar',
          icone: TrendingDown,
          color: 'emerald',
        },
        {
          nome: 'Assinaturas a pagar',
          link: '/financeiro/assinaturas-a-pagar',
          icone: ReceiptText,
          color: 'emerald',
        },
        {
          nome: 'Cobranças',
          link: '/financeiro/cobrancas',
          icone: HandCoins,
          show: permissions.admin,
          color: 'emerald',
        },
      ],
    },
    {
      nome: 'Produtos',
      icone: Box,
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
      nome: 'Desenvolvimento',
      divisor: true,
      show: false,
    },
    {
      nome: 'Serviços',
      icone: FileBox,
      show: permissions.servicos.visualizar,
      color: 'yellow',
      children: [
        {
          nome: 'Painel',
          show: permissions.admin,
          link: '/servicos/painel',
          color: 'yellow',
          icone: ChartPie,
        },
        { nome: 'Ordens de serviço', link: '/servicos/os', color: 'yellow', icone: FileDigit },
        { nome: 'Serviços', link: '/servicos', color: 'yellow', icone: Wrench },
      ],
    },
    {
      nome: 'Notas Fiscais',
      icone: FileCheck2,
      show: false,
      color: 'cyan',
      link: '/notas-fiscais',
      children: [],
    },
    {
      nome: 'Clientes',
      icone: UserStar,
      show: permissions.clientes.visualizar,
      color: 'violet',
      link: '/clientes',
    },
    {
      nome: 'Apps',
      divisor: true,
      show: hasVisibleAppsSection,
    },
    {
      nome: 'Assinaturas',
      icone: Sparkles,
      color: 'violet',
      show: permissions.financeiro.visualizar && hasAssinaturasApp,
      children: [
        {
          nome: 'Painel',
          link: '/assinaturas/painel',
          icone: ChartPie,
          color: 'violet',
        },
        {
          nome: 'Assinaturas',
          link: '/assinaturas/assinaturas',
          icone: Sparkles,
          color: 'violet',
        },
        {
          nome: 'Planos',
          link: '/assinaturas/planos',
          icone: Layers3,
          color: 'violet',
        },
        {
          nome: 'Cobranças',
          link: '/assinaturas/cobrancas',
          icone: ReceiptText,
          color: 'violet',
        },
        {
          nome: 'Comodatos',
          link: '/assinaturas/comodatos',
          icone: Package,
          color: 'violet',
        },
      ],
    },
    {
      nome: 'Core IA',
      icone: Bot,
      show: permissions.vendas.visualizar && hasCoreIaApp,
      color: 'purple',
      link: '/chat/ia',
    },
    {
      nome: 'WhatsApp',
      icone: MessageCircle,
      show: permissions.configuracoes.visualizar && hasWhatsappApp,
      color: 'green',
      link: '/whatsapp',
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
      show: permissions.configuracoes.visualizar,
      color: 'indigo',
      link: '/configuracoes',
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
    {
      nome: 'Complementos',
      divisor: true,
      show: true,
    },
    {
      nome: 'App Store',
      color: 'blue',
      icone: Store,
      link: '/loja',
    },
  ]
}
