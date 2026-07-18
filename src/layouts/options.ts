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
  FilePenLineIcon,
  GitBranchPlus,
  HandCoins,
  Headset,
  Layers3,
  MapPinned,
  MessageCircle,
  Package,
  PackagePlus,
  ReceiptText,
  Store,
  Tags,
  Target,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  User,
  Users,
  UserStar,
  Wrench,
} from 'lucide-vue-next'

export const ROOT_ALWAYS_VISIBLE_MENU_KEYS = ['configuracoes'] as const

export const MAIN_MENU_VISIBILITY_OPTIONS = [
  { key: 'dashboard', nome: 'Dashboard', descricao: 'Painel inicial do sistema.', icon: ChartPie },
  { key: 'metas', nome: 'Metas', descricao: 'Alvos comerciais, financeiros e de serviços.', icon: Target },
  { key: 'vendas', nome: 'Vendas', descricao: 'Painel, vendas e caixas.', icon: HandCoins },
  { key: 'atendimento', nome: 'Atendimento', descricao: 'Central de atendimento e chat via WhatsApp.', icon: Headset },
  { key: 'comandas', nome: 'Comandas', descricao: 'Comandas operacionais e faturamento parcial.', icon: TicketCheck },
  { key: 'financeiro', nome: 'Financeiro', descricao: 'Lançamentos, contas e cobranças.', icon: CircleDollarSign },
  { key: 'produtos', nome: 'Produtos', descricao: 'Cadastro e painel de produtos.', icon: Boxes },
  { key: 'servicos', nome: 'Serviços', descricao: 'Ordens de serviço e cadastro de serviços.', icon: Store },
  { key: 'clientes', nome: 'Clientes', descricao: 'Clientes e fornecedores.', icon: Users },
  { key: 'assinaturas', nome: 'Contratos', descricao: 'Módulo adicional de contratos recorrentes.', icon: FilePenLineIcon },
  { key: 'loja-virtual', nome: 'Loja Virtual', descricao: 'Módulo adicional de vitrine e pedidos online.', icon: Package },
  { key: 'arena', nome: 'Arena', descricao: 'Módulo adicional de quadras, reservas, calendário e comandas.', icon: CalendarCheck },
  { key: 'core-ia', nome: 'Core IA', descricao: 'Módulo adicional de inteligência artificial.', icon: Bot },
  { key: 'whatsapp', nome: 'WhatsApp', descricao: 'Módulo adicional de instâncias e conexão.', icon: MessageCircle },
  { key: 'usuarios', nome: 'Usuários', descricao: 'Administração de usuários.', icon: User },
  { key: 'configuracoes', nome: 'Configurações', descricao: 'Preferências da empresa e do sistema.', icon: Cog },
  { key: 'changelog', nome: 'Atualizações', descricao: 'Histórico de novidades do sistema.', icon: ArrowRightLeft },
  { key: 'perfil', nome: 'Perfil', descricao: 'Dados do usuario logado.', icon: UserStar },
  { key: 'loja', nome: 'App Store', descricao: 'Complementos disponíveis para a conta.', icon: PackagePlus },
] as const

export type MainMenuVisibilityKey = (typeof MAIN_MENU_VISIBILITY_OPTIONS)[number]['key']

export const APP_MENU_MODULE_KEYS: Partial<Record<MainMenuVisibilityKey, string>> = {
  atendimento: 'atendimento',
  assinaturas: 'assinaturas',
  'loja-virtual': 'loja-virtual',
  arena: 'arena',
  'core-ia': 'core-ia',
  whatsapp: 'whatsapp',
}

export function isMainMenuVisibilityOptionAvailable(
  menuKey: MainMenuVisibilityKey,
  appModules: Record<string, boolean> = {},
) {
  const moduleKey = APP_MENU_MODULE_KEYS[menuKey]
  return !moduleKey || Boolean(appModules[moduleKey])
}

export function getMainMenuVisibilityOptions(appModules: Record<string, boolean> = {}) {
  return MAIN_MENU_VISIBILITY_OPTIONS.filter((menu) =>
    isMainMenuVisibilityOptionAvailable(menu.key, appModules),
  )
}

// Submenus (filhos) que podem ser ocultados individualmente, agrupados pela key do menu pai.
// As keys usam o formato "pai:filho" (com ":") — o que as distingue das keys de menu de
// topo (sem ":"). Em `menusVisiveis`, keys de topo funcionam como whitelist (presente =
// visível) e keys de submenu como blacklist (presente = OCULTO), mantendo compatibilidade
// com contas antigas que só possuem keys de topo (todos os submenus visíveis por padrão).
export const MENU_SUBMENU_VISIBILITY_OPTIONS: Record<
  string,
  ReadonlyArray<{ key: string; nome: string }>
> = {
  vendas: [
    { key: 'vendas:painel', nome: 'Painel' },
    { key: 'vendas:lista', nome: 'Vendas' },
    { key: 'vendas:caixas', nome: 'Caixas' },
  ],
  financeiro: [
    { key: 'financeiro:painel', nome: 'Painel' },
    { key: 'financeiro:lancamentos', nome: 'Lançamentos' },
    { key: 'financeiro:acompanhamento', nome: 'Acompanhamento' },
    { key: 'financeiro:contas-a-receber', nome: 'Contas a receber' },
    { key: 'financeiro:contas-a-pagar', nome: 'Contas a pagar' },
    { key: 'financeiro:assinaturas-a-pagar', nome: 'Assinaturas' },
    { key: 'financeiro:inadimplencia', nome: 'Inadimplência' },
    { key: 'financeiro:cobrancas', nome: 'Cobranças' },
  ],
  produtos: [
    { key: 'produtos:painel', nome: 'Painel' },
    { key: 'produtos:lista', nome: 'Produtos' },
    { key: 'produtos:reposicao', nome: 'Reposição' },
    { key: 'produtos:movimentacoes', nome: 'Movimentações' },
  ],
  servicos: [
    { key: 'servicos:painel', nome: 'Painel' },
    { key: 'servicos:os', nome: 'Ordens de serviço' },
    { key: 'servicos:lista', nome: 'Serviços' },
  ],
  arena: [
    { key: 'arena:painel', nome: 'Painel' },
    { key: 'arena:calendario', nome: 'Calendário' },
    { key: 'arena:reservas', nome: 'Reservas' },
    { key: 'arena:quadras', nome: 'Quadras' },
    { key: 'arena:comandas', nome: 'Comandas' },
  ],
  assinaturas: [
    { key: 'assinaturas:painel', nome: 'Painel' },
    { key: 'assinaturas:lista', nome: 'Contratos' },
    { key: 'assinaturas:planos', nome: 'Planos' },
    { key: 'assinaturas:cobrancas', nome: 'Cobranças' },
    { key: 'assinaturas:comodatos', nome: 'Comodatos' },
  ],
  atendimento: [
    { key: 'atendimento:painel', nome: 'Painel' },
    { key: 'atendimento:chat', nome: 'Chat' },
    { key: 'atendimento:contatos', nome: 'Contatos' },
    { key: 'atendimento:agentes', nome: 'Agentes' },
    { key: 'atendimento:relatorios', nome: 'Relatórios' },
  ],
}

export const ALL_SUBMENU_VISIBILITY_KEYS = Object.values(
  MENU_SUBMENU_VISIBILITY_OPTIONS,
).flatMap((submenus) => submenus.map((submenu) => submenu.key))

export function filterSidebarMenuByVisibility(
  menu: SidebarMenuType[],
  visibleMenuKeys: string[] | null | undefined,
  isRoot = false,
  hiddenSubmenuKeys: string[] | null | undefined = [],
): SidebarMenuType[] {
  const hiddenSubmenus = new Set(hiddenSubmenuKeys ?? [])

  const applyHiddenSubmenus = (item: SidebarMenuType): SidebarMenuType => {
    if (!item.children || hiddenSubmenus.size === 0) return item
    return {
      ...item,
      children: item.children.filter(
        (child) => !child.key || !hiddenSubmenus.has(child.key),
      ),
    }
  }

  if (!Array.isArray(visibleMenuKeys)) return menu.map(applyHiddenSubmenus)

  const visibleSet = new Set(visibleMenuKeys)
  const rootAlwaysVisible = new Set<string>(isRoot ? ROOT_ALWAYS_VISIBLE_MENU_KEYS : [])
  return menu
    .filter((item) => {
      if (item.divisor) return false
      if (!item.key) return true
      return visibleSet.has(item.key) || rootAlwaysVisible.has(item.key)
    })
    .map(applyHiddenSubmenus)
}

export const sidebarMenuOptions = (
  permissions: Permissoes,
  appModules: Record<string, boolean> = {},
): SidebarMenuType[] => {
  const hasAssinaturasApp = Boolean(appModules.assinaturas)
  const hasCoreIaApp = Boolean(appModules['core-ia'])
  const hasWhatsappApp = Boolean(appModules.whatsapp)
  const hasAtendimentoApp = Boolean(appModules.atendimento)
  const hasLojaApp = Boolean(appModules['loja-virtual'])
  const hasArenaApp = Boolean(appModules.arena)
  const hasVisibleAppsSection =
    (permissions.financeiro.visualizar && hasAssinaturasApp) ||
    (permissions.vendas.visualizar && hasCoreIaApp) ||
    (permissions.configuracoes.visualizar && hasWhatsappApp) ||
    (permissions.configuracoes.visualizar && hasAtendimentoApp) ||
    (permissions.produtos.visualizar && hasLojaApp)

  return [
    {
      key: 'dashboard',
      nome: 'Dashboard',
      icone: ChartPie,
      color: 'orange',
      link: '/',
    },
      {
      key: 'atendimento',
      nome: 'Atendimento',
      icone: Headset,
      color: 'green',
      show: permissions.configuracoes.visualizar && hasAtendimentoApp,
      children: [
        {
          key: 'atendimento:painel',
          nome: 'Painel',
          link: '/atendimento/painel',
          icone: ChartPie,
          color: 'green',
        },
        {
          key: 'atendimento:chat',
          nome: 'Chat',
          link: '/atendimento',
          icone: MessageCircle,
          color: 'green',
        },
        {
          key: 'atendimento:contatos',
          nome: 'Contatos',
          link: '/atendimento/contatos',
          icone: Users,
          color: 'green',
        },
        {
          key: 'atendimento:agentes',
          nome: 'Agentes',
          link: '/atendimento/agentes',
          icone: Bot,
          color: 'green',
        },
        {
          key: 'atendimento:relatorios',
          nome: 'Relatórios',
          link: '/atendimento/relatorios',
          icone: FileDigit,
          color: 'green',
        },
      ],
    },
    {
      key: 'arena',
      nome: 'Arena',
      icone: CalendarCheck,
      show: permissions.vendas.visualizar && hasArenaApp,
      color: 'blue',
      children: [
        {
          key: 'arena:painel',
          nome: 'Painel',
          link: '/arena/painel',
          icone: ChartPie,
          color: 'blue',
        },
        {
          key: 'arena:calendario',
          nome: 'Calendário',
          link: '/arena/calendario',
          icone: CalendarCheck2,
          color: 'blue',
        },
        {
          key: 'arena:reservas',
          nome: 'Reservas',
          link: '/arena/reservas',
          icone: TicketCheck,
          color: 'blue',
        },
        {
          key: 'arena:quadras',
          nome: 'Quadras',
          link: '/arena/quadras',
          icone: MapPinned,
          color: 'blue',
        },
        {
          key: 'arena:comandas',
          nome: 'Comandas',
          link: '/arena/comandas',
          icone: ClipboardList,
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
          key: 'vendas:painel',
          nome: 'Painel',
          link: '/vendas/dashboard',
          show: permissions.vendas.painel,
          icone: ChartPie,
          color: 'green',
        },
        {
          key: 'vendas:lista',
          nome: 'Vendas',
          link: '/vendas',
          icone: Tags,
          color: 'green',
        },
        {
          key: 'vendas:caixas',
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
          key: 'financeiro:painel',
          nome: 'Painel',
          link: '/financeiro/painel',
          show: permissions.financeiro.painel,
          icone: ChartPie,
          color: 'emerald',
        },
        {
          key: 'financeiro:lancamentos',
          nome: 'Lançamentos',
          link: '/financeiro/lancamentos',
          icone: CircleDollarSign,
          color: 'emerald',
        },
        {
          key: 'financeiro:acompanhamento',
          nome: 'Acompanhamento',
          link: '/financeiro/acompanhamento',
          icone: CalendarClock,
          color: 'emerald',
        },
        {
          key: 'financeiro:contas-a-receber',
          nome: 'Contas a receber',
          link: '/financeiro/contas-a-receber',
          icone: TrendingUp,
          color: 'emerald',
        },
        {
          key: 'financeiro:contas-a-pagar',
          nome: 'Contas a pagar',
          link: '/financeiro/contas-a-pagar',
          icone: TrendingDown,
          color: 'emerald',
        },
        {
          key: 'financeiro:assinaturas-a-pagar',
          nome: 'Assinaturas',
          link: '/financeiro/assinaturas-a-pagar',
          icone: ReceiptText,
          color: 'emerald',
        },
        {
          key: 'financeiro:inadimplencia',
          nome: 'Inadimplência',
          link: '/financeiro/inadimplencia',
          icone: TriangleAlert,
          color: 'emerald',
        },
        {
          key: 'financeiro:cobrancas',
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
          key: 'produtos:painel',
          nome: 'Painel',
          link: '/produtos/dashboard',
          show: permissions.produtos.painel,
          icone: ChartPie,
          color: 'blue',
        },
        {
          key: 'produtos:lista',
          nome: 'Produtos',
          link: '/produtos',
          icone: Boxes,
          color: 'blue',
        },
        {
          key: 'produtos:reposicao',
          nome: 'Reposição',
          link: '/produtos/reposicao',
          icone: PackagePlus,
          color: 'blue',
        },
        {
          key: 'produtos:movimentacoes',
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
          key: 'servicos:painel',
          nome: 'Painel',
          show: permissions.admin,
          link: '/servicos/painel',
          color: 'yellow',
          icone: ChartPie,
        },
        { key: 'servicos:os', nome: 'Ordens de serviço', link: '/servicos/os', color: 'yellow', icone: FileDigit },
        { key: 'servicos:lista', nome: 'Serviços', link: '/servicos', color: 'yellow', icone: Wrench },
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
      nome: 'Contratos',
      icone: FileCheck2,
      color: 'violet',
      show: permissions.financeiro.visualizar && hasAssinaturasApp,
      children: [
        {
          key: 'assinaturas:painel',
          nome: 'Painel',
          link: '/assinaturas/painel',
          icone: ChartPie,
          color: 'violet',
        },
        {
          key: 'assinaturas:lista',
          nome: 'Contratos',
          link: '/assinaturas/assinaturas',
          icone: FilePenLineIcon,
          color: 'violet',
        },
        {
          key: 'assinaturas:planos',
          nome: 'Planos',
          link: '/assinaturas/planos',
          icone: Layers3,
          color: 'violet',
        },
        {
          key: 'assinaturas:cobrancas',
          nome: 'Cobranças',
          link: '/assinaturas/cobrancas',
          icone: ReceiptText,
          color: 'violet',
        },
        {
          key: 'assinaturas:comodatos',
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
      key: 'loja-virtual',
      nome: 'Loja Virtual',
      icone: Store,
      show: permissions.produtos.visualizar && hasLojaApp,
      color: 'blue',
      link: '/loja-virtual',
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
