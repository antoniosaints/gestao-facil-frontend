import { forms } from './application/formDialogs'
import type { RouteRecordRaw } from 'vue-router'
const page = (
  path: string,
  name: string,
  component: () => Promise<any>,
  permissao = 1,
  extra: Record<string, unknown> = {},
): RouteRecordRaw => ({ path, name: `modofacil-${name}`, component, meta: { permissao, ...extra } })
export const modoFacilRoutes: RouteRecordRaw[] = [
  {
    path: '/modofacil',
    component: () => import('./layouts/ModoFacilLayout.vue'),
    meta: { layout: 'default' },
    children: [
      page('', 'inicio', () => import('./pages/DashboardPage.vue')),
      page('produtos', 'produtos', () => import('./pages/ProductsPage.vue'), 4),
      page('produtos/categorias', 'categorias', () => import('./pages/CategoriesPage.vue'), 4),
      page('produtos/:produtoBaseId', 'produto', () => import('./pages/ProductDetailPage.vue'), 4),
      page(
        'estoque/movimentacoes',
        'movimentacoes',
        () => import('./pages/StockHistoryPage.vue'),
        4,
      ),
      page('vendas', 'vendas', () => import('./pages/SalesPage.vue'), 2),
      page('vendas/:id', 'venda', () => import('./pages/SaleDetailPage.vue'), 2),
      page('caixa', 'caixa', () => import('./pages/CashPage.vue'), 2),
      page('financeiro', 'financeiro', () => import('./pages/FinancePage.vue'), 3),
      page(
        'financeiro/cadastros',
        'financeiro-cadastros',
        () => import('./pages/FinanceCatalogsPage.vue'),
        3,
      ),
      page(
        'financeiro/cobrancas',
        'financeiro-cobrancas',
        () => import('./pages/ChargesPage.vue'),
        3,
      ),
      page(
        'financeiro/lancamentos/:id',
        'lancamento',
        () => import('./pages/FinanceDetailPage.vue'),
        3,
      ),
      page('servicos', 'servicos', () => import('./pages/ServicesPage.vue'), 2),
      page('servicos/ordens', 'ordens', () => import('./pages/OrdersPage.vue'), 2),
      page('servicos/ordens/:id', 'ordem', () => import('./pages/OrderDetailPage.vue'), 2),
      page('pessoas', 'pessoas', () => import('./pages/PeoplePage.vue'), 2),
      page('pessoas/:id', 'pessoa', () => import('./pages/PersonDetailPage.vue'), 2),
      page('configuracoes', 'configuracoes', () => import('./pages/SettingsPage.vue'), 4),
      page('relatorios', 'relatorios', () => import('./pages/ReportsPage.vue')),
      page('recursos/:modulo?', 'recursos', () => import('./pages/CoveragePage.vue')),
      ...Object.values(forms).map(
        (form): RouteRecordRaw => ({
          path: form.legacyPath,
          redirect: { path: form.background },
        }),
      ),
      page(':pathMatch(.*)*', '404', () => import('./pages/NotFoundPage.vue')),
    ],
  },
]
