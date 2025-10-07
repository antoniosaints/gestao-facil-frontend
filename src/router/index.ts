import { handleRouteGuard } from '@/composables/useRouterControl'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/pages/dashboard/Dashboard.vue'),
    meta: {
      layout: 'main',
    },
  },
  {
    path: '/site',
    name: 'site-page',
    component: () => import('@/pages/site/HomePage.vue'),
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
        },
      },
      {
        path: 'dashboard',
        name: 'vendas-dashboard',
        component: () => import('@/pages/vendas/dashboard/DashboardVendas.vue'),
        meta: {
          layout: 'main',
        },
      },
      {
        path: 'pdv',
        name: 'vendas-pdv',
        component: () => import('@/pages/vendas/formulario/PDV.vue'),
        meta: {
          layout: 'main',
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
        },
      },
      {
        path: 'detalhes',
        name: 'lancamentos-financeiro-detalhes',
        component: () => import('@/pages/financeiro/lancamentos/Detalhes.vue'),
        meta: {
          layout: 'main',
        },
      },
      {
        path: 'painel',
        name: 'lancamentos-financeiro-dashboard',
        component: () => import('@/pages/financeiro/lancamentos/Dashboard.vue'),
        meta: {
          layout: 'main',
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
        },
      },
      {
        path: 'detalhes',
        name: 'produtos-detalhes',
        component: () => import('@/pages/produtos/others/DetalhesProduto.vue'),
        meta: {
          layout: 'main',
        },
      },
      {
        path: 'dashboard',
        name: 'produtos-dashboard',
        component: () => import('@/pages/produtos/dashboard/DashboardProdutos.vue'),
        meta: {
          layout: 'main',
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
        },
      },
      {
        path: 'resumo',
        name: 'assinatura-resumo',
        component: () => import('@/pages/assinatura/ResumoAssinatura.vue'),
        meta: {
          layout: 'main',
        },
      },
    ],
  },
  {
    path: '/servicos',
    name: 'servicos',
    redirect: { name: 'perfil-usuario' },
    children: [
      {
        path: 'painel',
        name: 'perfil-servicos',
        component: () => import('@/pages/servicos/Dashboard.vue'),
        meta: {
          layout: 'main',
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
          permissao: 3,
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
          permissao: 6,
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
