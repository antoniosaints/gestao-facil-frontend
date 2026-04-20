import { handleRouteGuard } from '@/composables/useRouterControl'
import { env } from '@/utils/dotenv'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

type RouteMeta = {
  meta?: {
    isPublic?: boolean
    layout?: 'main' | 'default' | 'admin'
    permissao?: number
    modulo?: string
  }
}

type RouteInterface = RouteRecordRaw & RouteMeta

const routes: RouteInterface[] = [
  {
    path: '/',
    name: 'home',
    component: () => {
      if (env.VITE_MODE_SYSTEM === 'arena') {
        return import('@/pages/arena/comandas/Dashboard.vue')
      }
      return import('@/pages/dashboard/Dashboard.vue')
    },
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
      {
        path: 'assinantes',
        name: 'admin-assinantes',
        component: () => import('@/pages/admin/assinantes/Home.vue'),
      },
      {
        path: 'faturas',
        name: 'admin-faturas',
        component: () => import('@/pages/admin/faturas/Home.vue'),
      },
    ],
  },
  {
    path: '/administracao',
    name: 'administracao',
    redirect: { name: 'usuarios' },
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
        component: () => {
          if (env.VITE_MODE_SYSTEM === 'arena') {
            return import('@/pages/arena/vendas/ComandaListagem.vue')
          }
          return import('@/pages/vendas/VendasHome.vue')
        },
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
    path: '/agendamento/:conta',
    name: 'reservar-horario',
    component: () => {
      if (env.VITE_MODE_SYSTEM === 'arena') {
        return import('@/pages/arena/publico/ReservarHorario.vue')
      }
      return import('@/pages/errors/NotFound.vue' as string)
    },
    meta: {
      isPublic: true,
    },
  },
  {
    path: '/loja',
    name: 'loja',
    children: [
      {
        path: '',
        name: 'loja-home',
        component: () => import('@/pages/store/StorePage.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
    ],
  },
  {
    path: '/chat',
    name: 'chat',
    children: [
      {
        path: 'ia',
        name: 'ia',
        component: () => import('@/pages/agente/ChatPage.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
          modulo: 'core-ia',
        },
      },
      {
        path: 'local',
        name: 'local',
        component: () => import('@/pages/chats/ChatLocal.vue'),
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
        component: () => import('@/pages/arena/vendas/ComandaListagem.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'vendas',
        name: 'arena-vendas',
        component: () => import('@/pages/arena/vendas/VendasListagem.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'reservas',
        name: 'arena-reservas',
        component: () => import('@/pages/arena/reservas/ReservasListagem.vue'),
        meta: {
          layout: 'main',
          permissao: 2,
        },
      },
      {
        path: 'quadras',
        name: 'arena-quadras',
        component: () => import('@/pages/arena/quadras/QuadrasListagem.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'calendario',
        name: 'arena-calendario',
        component: () => import('@/pages/arena/reservas/CalendarioReservas.vue'),
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
        path: 'contas-a-receber',
        name: 'financeiro-contas-receber',
        component: () => import('@/pages/financeiro/lancamentos/ContasAReceber.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'contas-a-pagar',
        name: 'financeiro-contas-pagar',
        component: () => import('@/pages/financeiro/lancamentos/ContasAPagar.vue'),
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
        path: 'categorias',
        name: 'financeiro-categorias',
        component: () => import('@/pages/financeiro/categorias/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'contas',
        name: 'financeiro-contas',
        component: () => import('@/pages/financeiro/contas/Home.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
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
        path: 'categorias',
        name: 'produtos-categorias',
        component: () => import('@/pages/produtos/categorias/Home.vue'),
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
    path: '/assinaturas',
    name: 'assinaturas',
    redirect: { name: 'assinaturas-painel' },
    children: [
      {
        path: 'painel',
        name: 'assinaturas-painel',
        component: () => import('@/pages/assinaturas/Painel.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'assinaturas',
        name: 'assinaturas-home',
        component: () => import('@/pages/assinaturas/AssinaturasHome.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'assinaturas/:id',
        name: 'assinaturas-detalhes',
        component: () => import('@/pages/assinaturas/DetalhesAssinatura.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'planos',
        name: 'assinaturas-planos',
        component: () => import('@/pages/assinaturas/PlanosHome.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'cobrancas',
        name: 'assinaturas-cobrancas',
        component: () => import('@/pages/assinaturas/CobrancasHome.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
        },
      },
      {
        path: 'comodatos',
        name: 'assinaturas-comodatos',
        component: () => import('@/pages/assinaturas/ComodatosHome.vue'),
        meta: {
          layout: 'main',
          permissao: 3,
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
      {
        path: ':id',
        name: 'clientes-detalhes',
        component: () => import('@/pages/clientes/DetalhesCliente.vue'),
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
    component: () => {
      return env.VITE_MODE_SYSTEM === 'arena'
        ? import('@/pages/auth/LoginPageArena.vue')
        : import('@/pages/auth/LoginPage.vue')
    },
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
