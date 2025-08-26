import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useToast } from 'vue-toastification'

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
    children: [
      {
        path: '',
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
    path: '/configuracoes',
    name: 'configuracoes',
    children: [
      {
        path: '',
        name: 'configruacoes-home',
        component: () => import('@/pages/configs/ConfiguracaoPage.vue'),
        meta: {
          layout: 'main',
        },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
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

const toast = useToast()

router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem('gestao_facil:token')) {
    toast.error('Necessário efetuar login para acessar essa rota!')
    return { name: 'login' }
  }
  if (to.path === '/login' && localStorage.getItem('gestao_facil:token')) {
    return { name: 'home' }
  }
})

export default router
