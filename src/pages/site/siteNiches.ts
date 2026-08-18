export type SiteNicheFeature = {
  title: string
  description: string
  icon: 'UtensilsCrossed' | 'Gem' | 'Store' | 'Headset' | 'ShoppingBag' | 'Trophy'
}

export type SiteNiche = {
  slug: string
  label: string
  kicker: string
  title: string
  description: string
  accent: string
  accentSoft: string
  accentText: string
  icon: SiteNicheFeature['icon']
  metrics: Array<{ value: string; label: string }>
  features: SiteNicheFeature[]
}

export const SITE_NICHES: SiteNiche[] = [
  {
    slug: 'restaurante-delivery',
    label: 'Restaurante & delivery',
    kicker: 'Operação em movimento',
    title: 'Da comanda ao delivery, sem perder o ritmo.',
    description:
      'Organize salão, pedidos, cozinha e entregas na mesma operação — com a velocidade que o horário de pico exige.',
    accent: '#ea580c',
    accentSoft: '#fff0e8',
    accentText: '#9a3412',
    icon: 'UtensilsCrossed',
    metrics: [
      { value: 'KDS', label: 'produção conectada' },
      { value: 'QZ', label: 'impressão térmica' },
      { value: '1 tela', label: 'salão e delivery' },
    ],
    features: [
      {
        title: 'Pedidos e salão',
        description: 'Mesas, comandas e pedidos manuais em um fluxo único.',
        icon: 'UtensilsCrossed',
      },
      {
        title: 'Cozinha em tempo real',
        description: 'KDS por ponto de produção, com status e prioridade.',
        icon: 'UtensilsCrossed',
      },
      {
        title: 'Delivery completo',
        description: 'Cardápio, checkout, zonas de entrega e acompanhamento.',
        icon: 'ShoppingBag',
      },
    ],
  },
  {
    slug: 'ourives',
    label: 'Ourives',
    kicker: 'Precisão em cada etapa',
    title: 'Controle o valor do metal e o valor do seu trabalho.',
    description:
      'Uma operação desenhada para joalherias e ourivesarias acompanharem peças, materiais, serviços e clientes com segurança.',
    accent: '#a16207',
    accentSoft: '#fdf7df',
    accentText: '#854d0e',
    icon: 'Gem',
    metrics: [
      { value: 'OS', label: 'por peça e cliente' },
      { value: '360°', label: 'histórico da joia' },
      { value: '1 lugar', label: 'produção e caixa' },
    ],
    features: [
      {
        title: 'Ordens por peça',
        description: 'Registre solicitações, materiais, garantias e etapas do serviço.',
        icon: 'Gem',
      },
      {
        title: 'Clientes e histórico',
        description: 'Acesse peças, serviços e negociações em uma visão completa.',
        icon: 'Headset',
      },
      {
        title: 'Financeiro integrado',
        description: 'Transforme orçamento aprovado em cobrança e faturamento.',
        icon: 'Store',
      },
    ],
  },
  {
    slug: 'lojas-varejo',
    label: 'Lojas & varejo',
    kicker: 'Venda com clareza',
    title: 'Seu balcão mais rápido. Sua gestão mais nítida.',
    description:
      'PDV, estoque e financeiro conectados para transformar cada venda em uma visão real do negócio.',
    accent: '#2563eb',
    accentSoft: '#edf4ff',
    accentText: '#1d4ed8',
    icon: 'Store',
    metrics: [
      { value: 'PDV', label: 'ágil no balcão' },
      { value: 'Estoque', label: 'em tempo real' },
      { value: 'ROI', label: 'visível no painel' },
    ],
    features: [
      {
        title: 'PDV sem atrito',
        description: 'Venda, receba e imprima com uma experiência direta.',
        icon: 'Store',
      },
      {
        title: 'Estoque confiável',
        description: 'Entradas, saídas, reposição e alertas na hora certa.',
        icon: 'ShoppingBag',
      },
      {
        title: 'Decisões melhores',
        description: 'Indicadores, ticket médio e produtos que realmente giram.',
        icon: 'Trophy',
      },
    ],
  },
  {
    slug: 'atendimento-suporte',
    label: 'Atendimento & suporte',
    kicker: 'Conversas que avançam',
    title: 'Cada atendimento com contexto, dono e próximo passo.',
    description:
      'Centralize conversas, filas e equipe para responder melhor sem perder o histórico que importa.',
    accent: '#7c3aed',
    accentSoft: '#f4efff',
    accentText: '#6d28d9',
    icon: 'Headset',
    metrics: [
      { value: 'Inbox', label: 'conversas unificadas' },
      { value: 'Filas', label: 'equipe organizada' },
      { value: 'CRM', label: 'cliente no contexto' },
    ],
    features: [
      {
        title: 'Central de conversas',
        description: 'WhatsApp e atendimentos organizados em uma fila viva.',
        icon: 'Headset',
      },
      {
        title: 'Distribuição de equipe',
        description: 'Atribua responsáveis e acompanhe o que precisa de ação.',
        icon: 'Trophy',
      },
      {
        title: 'Histórico de cliente',
        description: 'Veja conversas e dados sem sair do atendimento.',
        icon: 'ShoppingBag',
      },
    ],
  },
  {
    slug: 'loja-virtual',
    label: 'Loja virtual',
    kicker: 'Sua vitrine, sempre aberta',
    title: 'Venda online sem desconectar da sua operação.',
    description:
      'Crie uma loja com sua identidade e acompanhe pedidos, clientes e pagamentos no mesmo ecossistema.',
    accent: '#0f766e',
    accentSoft: '#e8fbf6',
    accentText: '#0f766e',
    icon: 'ShoppingBag',
    metrics: [
      { value: '24/7', label: 'vitrine disponível' },
      { value: 'Checkout', label: 'integrado' },
      { value: 'Marca', label: 'personalizável' },
    ],
    features: [
      {
        title: 'Vitrine com identidade',
        description: 'Banners, cores e catálogo adaptados à sua marca.',
        icon: 'ShoppingBag',
      },
      {
        title: 'Pedidos centralizados',
        description: 'Acompanhe cada venda sem exportar ou duplicar dados.',
        icon: 'Store',
      },
      {
        title: 'Clientes recorrentes',
        description: 'Conta, endereços e histórico para uma compra mais simples.',
        icon: 'Headset',
      },
    ],
  },
  {
    slug: 'arenas-esportivas',
    label: 'Arenas esportivas',
    kicker: 'Agenda que joga junto',
    title: 'Mais quadra ocupada. Menos operação manual.',
    description:
      'Controle reservas, comandas, horários e pagamentos para deixar sua arena sempre em movimento.',
    accent: '#16a34a',
    accentSoft: '#ecfdf2',
    accentText: '#15803d',
    icon: 'Trophy',
    metrics: [
      { value: 'Agenda', label: 'sem conflitos' },
      { value: 'Quadras', label: 'na mesma visão' },
      { value: 'Caixa', label: 'junto da reserva' },
    ],
    features: [
      {
        title: 'Reservas inteligentes',
        description: 'Disponibilidade, horários e gestão de recursos em poucos cliques.',
        icon: 'Trophy',
      },
      {
        title: 'Comandas da arena',
        description: 'Consumo, cobranças e fechamento ligados à experiência do cliente.',
        icon: 'UtensilsCrossed',
      },
      {
        title: 'Visão operacional',
        description: 'Acompanhe ocupação e receita para planejar a próxima jogada.',
        icon: 'Store',
      },
    ],
  },
]

export function getSiteNiche(slug?: string | string[]) {
  const value = Array.isArray(slug) ? slug[0] : slug
  return SITE_NICHES.find((niche) => niche.slug === value) || SITE_NICHES[0]
}
