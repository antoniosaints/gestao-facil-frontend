import { handleRouteGuard } from '@/composables/useRouterControl'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

type RouteMeta = {
  meta?: {
    isPublic?: boolean
    layout?: 'main' | 'default' | 'admin'
    permissao?: number
  }
}

type RouteInterface = RouteRecordRaw & RouteMeta

const routes: RouteInterface[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/dashboard/Dashboard.vue'),
    meta: {
      layout: 'main',
    },
  },
  {
    path: '/publico',
    name: 'publico',
    meta: {
      isPublic: true,
    },
    children: [
      {
        path: ':contaId/cadastro',
        name: 'publico-cadastro',
        component: () => import('@/pages/clientes/publico/CadastroCliente.vue'),
        meta: {
          isPublic: true,
        },
      },
      {
        path: ':contaId/ordem-servico/:ordemId',
        name: 'publico-ordem-servico-assinatura',
        component: () => import('@/pages/servicos/os/publico/OrdemServicoCliente.vue'),
        meta: {
          isPublic: true,
        },
      },
    ],
  },
  {
    path: '/site',
    name: 'site-page',
    meta: {
      isPublic: true,
    },
    children: [
      {
        path: '',
        name: 'site-home',
        component: () => import('@/pages/site/HomePage.vue'),
      },
      {
        path: 'cadastro',
        name: 'site-sobre',
        component: () => import('@/pages/site/CadastroSite.vue'),
      },
      {
        path: 'termos-politica',
        name: 'site-termos-politica',
        component: () => import('@/pages/site/TermosPolitica.vue'),
      },
    ],
  },
  {
    path: '/admin',
    name: 'admin-page',
    redirect: { name: 'admin-home' },
    meta: {
      permissao: 100,
      layout: 'admin',
    },
    children: [
      {
        path: '',
        name: 'admin-home',
        component: () => import('@/pages/admin/dashboard/DashboardAdmin.vue'),
      },
    ],
  },
  {
    path: '/reservar-horario/:conta',
    name: 'reservar-horario',
    component: () => import('@/pages/publico/ReservarHorario.vue'),
  },
  {
    path: '/administracao',
    name: 'administracao',
    children: [
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/pages/usuarios/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 4,
        },
      },
    ],
  },
  {
    path: '/changelog',
    name: 'changelog',
    redirect: { name: 'changelog-home' },
    children: [
      {
        path: '',
        name: 'changelog-home',
        component: () => import('@/pages/configs/ChangelogPage.vue'),
        meta: {
          layout: 'main',
          permissao: 1,
        },
      },
    ],
  },
  {
    path: '/vendas',
    name: 'vendas',
    children: [
      {
        path: '',
        name: 'vendas-home',
        component: () => import('@/pages/vendas/VendasHome.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'dashboard',
        name: 'vendas-dashboard',
        component: () => import('@/pages/vendas/dashboard/DashboardVendas.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'pdv',
        name: 'vendas-pdv',
        component: () => import('@/pages/vendas/formulario/PDV.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
    ],
  },
  {
    path: '/arena',
    name: 'arena',
    children: [
      {
        path: '',
        name: 'arena-dashboard',
        component: () => import('@/pages/arena/comandas/Dashboard.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'comandas',
        name: 'arena-comandas',
        component: () => import('@/pages/arena/comandas/ComandaListagem.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'calendario',
        name: 'arena-calendario',
        component: () => import('@/pages/arena/comandas/CalendarioReservas.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
    ],
  },
  {
    path: '/financeiro',
    name: 'financeiro',
    redirect: { name: 'lancamentos-financeiro' },
    children: [
      {
        path: 'lancamentos',
        name: 'lancamentos-financeiro',
        component: () => import('@/pages/financeiro/lancamentos/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'acompanhamento',
        name: 'lancamentos-acompanhamento',
        component: () => import('@/pages/financeiro/lancamentos/AcompanhamentoMensal.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'cobrancas',
        name: 'lancamentos-cobrancas',
        component: () => import('@/pages/financeiro/cobrancas/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 4,
        },
      },
      {
        path: 'detalhes',
        name: 'lancamentos-financeiro-detalhes',
        component: () => import('@/pages/financeiro/lancamentos/Detalhes.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'painel',
        name: 'lancamentos-financeiro-dashboard',
        component: () => import('@/pages/financeiro/lancamentos/Dashboard.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
    ],
  },
  {
    path: '/produtos',
    name: 'produtos',
    children: [
      {
        path: '',
        name: 'produtos-home',
        component: () => import('@/pages/produtos/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 4,
        },
      },
      {
        path: 'detalhes',
        name: 'produtos-detalhes',
        component: () => import('@/pages/produtos/others/DetalhesProduto.vue'),
        meta: {
          layout: 'main',
          permissao: 4,
        },
      },
      {
        path: 'dashboard',
        name: 'produtos-dashboard',
        component: () => import('@/pages/produtos/dashboard/DashboardProdutos.vue'),
        meta: {
          layout: 'main',
          permissao: 4,
        },
      },
    ],
  },
  {
    path: '/assinatura',
    name: 'assinatura',
    redirect: { name: 'assinatura-resumo' },
    children: [
      {
        path: 'assinar',
        name: 'assinatura-home',
        component: () => import('@/pages/assinatura/AssinaturaPage.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'resumo',
        name: 'assinatura-resumo',
        component: () => import('@/pages/assinatura/ResumoAssinatura.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
    ],
  },
  {
    path: '/servicos',
    name: 'servicos',
    redirect: { name: 'servicos-listagem' },
    children: [
      {
        path: '',
        name: 'servicos-listagem',
        component: () => import('@/pages/servicos/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'os',
        name: 'servicos-ordens-servicos',
        component: () => import('@/pages/servicos/os/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'painel',
        name: 'perfil-servicos',
        component: () => import('@/pages/servicos/Dashboard.vue'),
        meta: {
          layout: 'main',
          permissao: 5,
        },
      },
    ],
  },
  {
    path: '/usuario',
    name: 'usuario',
    redirect: { name: 'perfil-usuario' },
    children: [
      {
        path: 'perfil',
        name: 'perfil-usuario',
        component: () => import('@/pages/perfil/PerfilUsuario.vue'),
        meta: {
          layout: 'main',
          permissao: 1,
        },
      },
    ],
  },
  {
    path: '/clientes',
    name: 'clientes',
    children: [
      {
        path: '',
        name: 'clientes-tabela',
        component: () => import('@/pages/clientes/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
    ],
  },
  {
    path: '/configuracoes',
    name: 'configuracoes',
    children: [
      {
        path: '',
        name: 'configuracoes-home',
        component: () => import('@/pages/configs/ConfiguracaoPage.vue'),
        meta: {
          layout: 'main',
          permissao: 5,
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: {
      isPublic: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: () => import('@/pages/errors/NotFound.vue' as string),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from) => handleRouteGuard(to, from))

export default router
