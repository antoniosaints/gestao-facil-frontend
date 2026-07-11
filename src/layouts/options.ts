import { type Permissoes } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'
import {
  ArrowRightLeft,
  Bot,
  Box,
  Boxes,
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  ChartPie,
  CircleDollarSign,
  ClipboardList,
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
  PackagePlus,
  ReceiptText,
  Sparkles,
  Store,
  Tags,
  Target,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  User,
  UserStar,
  Wrench,
} from 'lucide-vue-next'

export const ROOT_ALWAYS_VISIBLE_MENU_KEYS = ['configuracoes'] as const

export const MAIN_MENU_VISIBILITY_OPTIONS = [
  { key: 'dashboard', nome: 'Dashboard', descricao: 'Painel inicial do sistema.' },
  { key: 'metas', nome: 'Metas', descricao: 'Alvos comerciais, financeiros e de serviços.' },
  { key: 'vendas', nome: 'Vendas', descricao: 'Painel, vendas e caixas.' },
  { key: 'comandas', nome: 'Comandas', descricao: 'Comandas operacionais e faturamento parcial.' },
  { key: 'financeiro', nome: 'Financeiro', descricao: 'Lançamentos, contas e cobranças.' },
  { key: 'produtos', nome: 'Produtos', descricao: 'Cadastro e painel de produtos.' },
  { key: 'servicos', nome: 'Serviços', descricao: 'Ordens de serviço e cadastro de serviços.' },
  { key: 'clientes', nome: 'Clientes', descricao: 'Clientes e fornecedores.' },
  { key: 'assinaturas', nome: 'Assinaturas', descricao: 'Módulo adicional de assinaturas.' },
  { key: 'core-ia', nome: 'Core IA', descricao: 'Módulo adicional de inteligência artificial.' },
  { key: 'whatsapp', nome: 'WhatsApp', descricao: 'Módulo adicional de atendimento.' },
  { key: 'usuarios', nome: 'Usuários', descricao: 'Administração de usuários.' },
  { key: 'configuracoes', nome: 'Configurações', descricao: 'Preferências da empresa e do sistema.' },
  { key: 'changelog', nome: 'Atualizações', descricao: 'Histórico de novidades do sistema.' },
  { key: 'perfil', nome: 'Perfil', descricao: 'Dados do usuario logado.' },
  { key: 'loja', nome: 'App Store', descricao: 'Complementos disponíveis para a conta.' },
] as const

export type MainMenuVisibilityKey = (typeof MAIN_MENU_VISIBILITY_OPTIONS)[number]['key']

export function filterSidebarMenuByVisibility(
  menu: SidebarMenuType[],
  visibleMenuKeys: string[] | null | undefined,
  isRoot = false,
): SidebarMenuType[] {
  if (!Array.isArray(visibleMenuKeys)) return menu

  const visibleSet = new Set(visibleMenuKeys)
  const rootAlwaysVisible = new Set<string>(isRoot ? ROOT_ALWAYS_VISIBLE_MENU_KEYS : [])
  return menu.filter((item) => {
    if (item.divisor) return false
    if (!item.key) return true
    return visibleSet.has(item.key) || rootAlwaysVisible.has(item.key)
  })
}

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
      key: 'dashboard',
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
      key: 'metas',
      nome: 'Metas',
      icone: Target,
      color: 'yellow',
      link: '/metas',
    },
    {
      key: 'vendas',
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
        {
          nome: 'Caixas',
          link: '/vendas/caixas',
          show: permissions.vendas.visualizar,
          icone: HandCoins,
          color: 'green',
        },
      ],
    },
    {
      key: 'comandas',
      nome: 'Comandas',
      icone: ClipboardList,
      color: 'cyan',
      show: permissions.vendas.visualizar,
      link: '/comandas',
    },
    {
      key: 'financeiro',
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
          nome: 'Assinaturas',
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
      key: 'produtos',
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
        {
          nome: 'Reposição',
          link: '/produtos/reposicao',
          icone: PackagePlus,
          color: 'blue',
        },
        {
          nome: 'Movimentações',
          link: '/produtos/movimentacoes',
          icone: ArrowRightLeft,
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
      key: 'servicos',
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
      key: 'clientes',
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
      key: 'assinaturas',
      nome: 'Assinaturas',
      icone: FileCheck2,
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
      key: 'core-ia',
      nome: 'Core IA',
      icone: Bot,
      show: permissions.vendas.visualizar && hasCoreIaApp,
      color: 'purple',
      link: '/chat/ia',
    },
    {
      key: 'whatsapp',
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
      key: 'usuarios',
      nome: 'Usuários',
      icone: User,
      show: permissions.admin,
      color: 'purple',
      link: '/administracao/usuarios',
    },
    {
      key: 'configuracoes',
      nome: 'Configurações',
      icone: Cog,
      show: permissions.configuracoes.visualizar,
      color: 'indigo',
      link: '/configuracoes',
    },
    {
      key: 'changelog',
      nome: 'Atualizações',
      color: 'blue',
      show: true,
      icone: GitBranchPlus,
      link: '/changelog',
    },
    {
      key: 'perfil',
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
      key: 'loja',
      nome: 'App Store',
      color: 'blue',
      icone: Store,
      link: '/loja',
    },
  ]
}
