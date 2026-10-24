export type SiteHeroStat = {
  value: string
  label: string
}

export type SiteFeatureConfig = {
  title: string
  description: string
  icon: string
}

export type SiteAppConfig = {
  title: string
  category: string
  description: string
  price: number
  icon: string
}

export type SiteFaqConfig = {
  q: string
  a: string
}

export type SitePublicConfig = {
  hero: {
    badge: string
    title: string
    highlight: string
    subtitle: string
    monthlyPrice: number
    trialDays: number
    imageUrl: string
    imageAlt: string
    stats: SiteHeroStat[]
  }
  features: SiteFeatureConfig[]
  apps: SiteAppConfig[]
  benefits: string[]
  adaptBenefits: string[]
  included: string[]
  faqs: SiteFaqConfig[]
}

export const DEFAULT_SITE_CONFIG: SitePublicConfig = {
  hero: {
    badge: '7 dias grátis · sem cartão de crédito',
    title: 'Mais clareza para gerir seu negócio',
    highlight: 'gerir seu negócio',
    subtitle:
      'Vendas, clientes, estoque e financeiro conectados à sua operação. Conte como você trabalha e comece com um painel organizado para o seu negócio.',
    monthlyPrice: 70,
    trialDays: 7,
    imageUrl: '/imgs/dashboard.png',
    imageAlt: 'Dashboard do Gestão Fácil',
    stats: [
      { value: 'Web + PWA', label: 'no computador e celular' },
      { value: '7 dias', label: 'grátis' },
      { value: 'R$ 70', label: 'por mês' },
    ],
  },
  features: [
    {
      title: 'Vendas e PDV',
      description:
        'Frente de caixa rápida com leitor de código de barras, cupom e impressão térmica.',
      icon: 'ScanLine',
    },
    {
      title: 'Controle de estoque',
      description: 'Entradas e saídas em tempo real, alertas de estoque mínimo e histórico.',
      icon: 'Box',
    },
    {
      title: 'Financeiro completo',
      description: 'Fluxo de caixa, contas a pagar e receber, categorias e relatórios gerenciais.',
      icon: 'Wallet',
    },
    {
      title: 'Recorrências operacionais',
      description:
        'Controle assinaturas a pagar, links úteis, ciclos recorrentes e lançamentos vinculados.',
      icon: 'Repeat',
    },
    {
      title: 'Clientes',
      description: 'Cadastro completo, histórico de compras e cadastro público por link.',
      icon: 'UsersRound',
    },
    {
      title: 'Relatórios e dashboards',
      description:
        'Vendas, ticket médio, produtos mais vendidos, estoque e saldo mensal em painéis claros.',
      icon: 'FileBarChart',
    },
    {
      title: 'Ordens de serviço',
      description:
        'Abertura, acompanhamento e faturamento de OS com garantia e assinatura do cliente.',
      icon: 'Wrench',
    },
    {
      title: 'Catálogo público',
      description:
        'Compartilhe produtos por link público. Se precisar vender online, ative a Loja Virtual.',
      icon: 'Store',
    },
  ],
  apps: [
    {
      title: 'CORE IA',
      category: 'Chat inteligente',
      description: 'Chat inteligente que auxilia na produtividade do time.',
      price: 9.9,
      icon: 'Bot',
    },
    {
      title: 'WhatsApp',
      category: 'Notificações',
      description: 'Integração com WhatsApp para comunicação e notificações.',
      price: 19.9,
      icon: 'MessageCircle',
    },
    {
      title: 'Atendimento',
      category: 'Central de conversas',
      description: 'Chat via WhatsApp com conversas, filas, atendentes e vínculo com clientes.',
      price: 29.9,
      icon: 'Headset',
    },
    {
      title: 'Loja Virtual',
      category: 'Vendas online',
      description:
        'Vitrine online personalizável com cores, banners, login e cadastro de clientes.',
      price: 39.9,
      icon: 'Store',
    },
    {
      title: 'Contratos',
      category: 'Recorrência',
      description: 'Gestão de contratos recorrentes, ciclos, comodatos e cobranças.',
      price: 5,
      icon: 'Repeat',
    },
    {
      title: 'Mercado Pago',
      category: 'Gateway gratuito',
      description: 'Configure as credenciais operacionais do Mercado Pago da conta.',
      price: 0,
      icon: 'CreditCard',
    },
  ],
  benefits: [
    'Dashboard com indicadores em tempo real',
    'Acesse do computador, tablet ou celular',
    'Exporte relatórios em PDF',
    'Personalize cores e fonte do painel',
  ],
  adaptBenefits: [
    'Cadastro guiado pela sua operação',
    'Revise os módulos antes de começar',
    'Ative apps conforme sua necessidade',
    'Loja, atendimento, IA e gateways no mesmo ecossistema',
  ],
  included: [
    'Vendas e PDV',
    'Financeiro completo',
    'Controle de estoque',
    'Organização de clientes',
    'Relatórios e dashboards',
    'Cupom e impressão térmica',
    'Catálogo público por link',
    'Personalização de aparência',
  ],
  faqs: [
    {
      q: 'Preciso de cartão de crédito para testar?',
      a: 'Não. O teste de 7 dias é totalmente gratuito e não pedimos cartão de crédito para começar.',
    },
    {
      q: 'O que acontece depois dos 7 dias grátis?',
      a: 'A mensalidade de R$ 70 passa a valer pelo sistema completo. Você pode cancelar quando quiser, sem multa ou fidelidade.',
    },
    {
      q: 'Como funcionam os apps adicionais?',
      a: 'São módulos opcionais, como CORE IA, WhatsApp, Atendimento, Loja Virtual e Contratos. Você ativa e desativa direto na App Store; apps pagos entram na mensalidade de forma proporcional e apps de valor zerado aparecem como gratuitos.',
    },
    {
      q: 'Posso usar em mais de um dispositivo?',
      a: 'Sim. O Gestão Fácil é 100% online e você acessa do computador, tablet ou celular, de onde estiver.',
    },
    {
      q: 'Posso escolher os módulos e a aparência?',
      a: 'Sim. O cadastro sugere módulos conforme suas atividades. Você revisa a seleção, escolhe uma paleta e uma fonte e vê uma prévia nos modos claro e escuro. Apps pagos exigem contratação posterior na App Store.',
    },
    {
      q: 'Tem fidelidade ou taxa de cancelamento?',
      a: 'Não. Você paga mês a mês e pode cancelar a qualquer momento, sem taxas escondidas.',
    },
  ],
}

export function cloneSiteConfig(config: SitePublicConfig = DEFAULT_SITE_CONFIG): SitePublicConfig {
  return JSON.parse(JSON.stringify(config))
}
