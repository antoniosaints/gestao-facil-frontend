import type { SidebarMenuType } from '@/types/sidebar'

export const sidebarMenuOptions: SidebarMenuType[] = [
  {
    nome: 'Dashboard',
    icone: 'fa-solid fa-chart-line',
    color: 'orange',
    link: '/',
  },
  {
    nome: 'Vendas',
    icone: 'fa-solid fa-tags',
    color: 'green',
    link: '/vendas',
  },
  {
    nome: 'Produtos',
    icone: 'fa-solid fa-boxes',
    color: 'blue',
    link: '/produtos',
  },
  {
    nome: 'Financeiro',
    icone: 'fa-solid fa-coins',
    color: 'emerald',
    children: [
      {
        nome: 'Painel',
        link: '/financeiro/painel',
        icone: 'fa-solid fa-chart-pie',
        color: 'emerald',
      },
      {
        nome: 'Lançamentos',
        link: '/financeiro/lancamentos',
        icone: 'fa-solid fa-coins',
        color: 'emerald',
      },
    ],
  },
  {
    nome: 'Clientes',
    icone: 'fa-solid fa-users',
    color: 'violet',
    link: '/clientes',
  },
  {
    nome: 'Desenvolvimento',
    divisor: true,
  },
  {
    nome: 'Serviços',
    icone: 'fa-solid fa-screwdriver-wrench',
    color: 'yellow',
    link: '/servicos',
    children: [
      // { nome: "Painel", link: "/financeiro/painel", icone: "fa-solid fa-chart-pie" },
      // { nome: "Lançamentos", link: "/financeiro/lancamentos", icone: "fa-solid fa-coins" },
    ],
  },
  {
    nome: 'Notas Fiscais',
    icone: 'fa-solid fa-receipt',
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
    icone: 'fa-solid fa-user',
    color: 'purple',
    link: '/usuarios',
  },
  {
    nome: 'Configurações',
    icone: 'fa-solid fa-cog',
    color: 'indigo',
    link: '/configuracoes',
  },
  {
    nome: 'Assinatura',
    divisor: true,
  },
  {
    nome: 'Modo Admin',
    color: 'violet',
    icone: 'fa-solid fa-lock',
    link: '/admin',
  },
  {
    nome: 'Perfil',
    color: 'blue',
    icone: 'fa-solid fa-user',
    link: '/perfil',
  }
]
