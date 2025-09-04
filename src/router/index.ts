import { useUiStore } from '@/stores/ui/uiStore'
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

router.beforeEach((to, from) => {
  const toast = useToast()
  const storeUi = useUiStore()
  if (window.innerWidth < 768) {
    storeUi.openSidebar = false
  }
  if (!to.meta?.isPublic && !localStorage.getItem('gestao_facil:token')) {
    toast.info('Necessário efetuar login para acessar essa rota!')
    return { name: 'login' }
  }
  if (to.path === '/login' && localStorage.getItem('gestao_facil:token')) {
    return { name: 'home' }
  }

  if (to.meta?.permissao) {
    const level = Number(to.meta?.permissao)

    if (level > 6) {
      toast.info('Você não tem permissão para acessar essa rota!')
      return { name: from.name }
    }
  }
})

export default router
