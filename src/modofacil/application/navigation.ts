import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { specializedModule } from './specialized'
import type { Configuration } from '../adapters/configuration'
const equivalents: Record<string, string> = {
  home: '/modofacil',
  'dashboard-main': '/modofacil',
  'produtos-home': '/modofacil/produtos',
  'produtos-listagem': '/modofacil/produtos',
  'produtos-categorias': '/modofacil/produtos/categorias',
  'produtos-reposicao': '/modofacil/estoque/reposicao',
  'produtos-movimentacoes': '/modofacil/estoque/movimentacoes',
  'vendas-home': '/modofacil/vendas',
  'vendas-caixas': '/modofacil/caixa',
  'servicos-listagem': '/modofacil/servicos',
  'servicos-ordens-servicos': '/modofacil/servicos/ordens',
  'clientes-tabela': '/modofacil/pessoas',
  'lancamentos-financeiro': '/modofacil/financeiro',
  'financeiro-contas-receber': '/modofacil/financeiro',
  'financeiro-contas-pagar': '/modofacil/financeiro',
}
export function experienceDestination(
  to: RouteLocationNormalized,
  config: Configuration | null,
  completeModule: string | null = null,
): RouteLocationRaw | true {
  if (
    to.meta.isPublic ||
    to.path.startsWith('/admin') ||
    to.path === '/assinatura' ||
    to.path.startsWith('/assinatura/') ||
    to.path.startsWith('/configuracoes') ||
    to.path === '/vendas/pdv'
  )
    return true
  if (!config) return true
  if (
    config.modo === 'NORMAL' &&
    to.path.startsWith('/modofacil') &&
    to.path !== '/modofacil/configuracoes'
  )
    return { name: 'home', replace: true }
  if (config.modo !== 'FACIL') return true
  if (to.name === 'produtos-detalhes')
    return {
      path: `/modofacil/produtos/${to.params.id || to.query.id || ''}`,
      query: to.query,
      replace: true,
    }
  if (to.name === 'lancamentos-financeiro-detalhes')
    return {
      path: `/modofacil/financeiro/lancamentos/${to.params.id || to.query.id}`,
      query: to.query,
      replace: true,
    }
  if (to.name === 'clientes-detalhes')
    return {
      path: `/modofacil/pessoas/${to.params.id || to.query.id}`,
      query: to.query,
      replace: true,
    }
  const unsupported = specializedModule(to.path)
  if (unsupported && completeModule !== unsupported)
    return { path: `/modofacil/recursos/${unsupported}`, replace: true }
  const path = equivalents[String(to.name)]
  return path ? { path, query: to.query, replace: true } : true
}
