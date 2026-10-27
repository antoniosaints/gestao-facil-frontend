import http from '@/utils/axios'
import type { AxiosRequestConfig } from 'axios'

// Only equivalent, authenticated reads using the same backend handlers belong
// here. Scoped histories, edit DTOs and mutations must keep their own contracts.
const reads: Record<string, string> = {
  '/modofacil/produtos': '/produtos',
  '/modofacil/produtos/categorias': '/produtos/categorias',
  '/modofacil/pessoas': '/clientes/getDataTable',
  '/modofacil/vendas': '/vendas',
  '/modofacil/vendas/caixa/contexto': '/vendas/pdv/contexto',
  '/modofacil/vendas/caixa/resumo': '/vendas/pdv/resumoCaixa',
  '/modofacil/vendas/caixa/painel': '/vendas/pdv/resumo',
  '/modofacil/servicos': '/servicos/lista/tabela',
  '/modofacil/servicos/ordens': '/servicos/lista/ordens/tabela',
  '/modofacil/estoque/movimentacoes': '/produtos/movimentacoes',
  '/modofacil/estoque/movimentacoes/resumo': '/produtos/movimentacoes/resumo',
  '/modofacil/financeiro/contas': '/lancamentos/contas',
  '/modofacil/financeiro/categorias': '/lancamentos/categorias',
  '/modofacil/financeiro/contas/opcoes': '/lancamentos/contas/select2',
  '/modofacil/financeiro/categorias/opcoes': '/lancamentos/categorias/select2',
  '/modofacil/produtos/categorias/opcoes': '/produtos/categorias/select2',
  '/modofacil/financeiro/categorias/arvore': '/lancamentos/categorias/arvore',
  '/modofacil/financeiro/resumo': '/lancamentos/dashboard/visao-geral',
  '/modofacil/financeiro/lancamentos': '/lancamentos/getDataTable',
  '/modofacil/financeiro/cobrancas': '/lancamentos/cobrancas/lista',
  '/modofacil/relatorios/produtos': '/produtos/relatorio',
  '/modofacil/relatorios/produtos/vendas': '/produtos/relatorio/vendas',
  '/modofacil/relatorios/produtos/lucro': '/produtos/relatorio/lucro',
  '/modofacil/relatorios/vendas/pdf': '/vendas/relatorios/resumo-pdf',
  '/modofacil/relatorios/financeiro/dre': '/lancamentos/relatorios/dre',
  '/modofacil/relatorios/financeiro/atrasadas': '/lancamentos/relatorios/parcelas-atrasadas',
  '/modofacil/relatorios/financeiro/clientes': '/lancamentos/relatorios/resumo-clientes',
  '/modofacil/relatorios/financeiro/totais': '/lancamentos/relatorios/totais',
  '/modofacil/relatorios/financeiro/demonstrativo': '/lancamentos/relatorios/demonstrativo',
  '/modofacil/relatorios/financeiro/demonstrativo/csv': '/lancamentos/relatorios/demonstrativo/csv',
  '/modofacil/relatorios/financeiro/demonstrativo/pdf': '/lancamentos/relatorios/demonstrativo/pdf',
}
function legacyRead(path: string) {
  if (reads[path]) return reads[path]
  if (/^\/modofacil\/produtos\/(?:\d+(?:\/variantes)?|variantes\/\d+)$/.test(path))
    return path.replace('/modofacil', '')
  if (/^\/modofacil\/pessoas\/\d+$/.test(path))
    return path.replace('/modofacil/pessoas', '/clientes')
  if (/^\/modofacil\/vendas\/\d+$/.test(path)) return path.replace('/modofacil', '')
  if (/^\/modofacil\/servicos\/\d+$/.test(path)) return path.replace('/modofacil', '')
  if (/^\/modofacil\/financeiro\/lancamentos\/\d+$/.test(path))
    return path.replace('/modofacil/financeiro/lancamentos', '/lancamentos')
  return undefined
}

/** A missing record is also a 404; only an explicitly missing route allows fallback. */
export async function isMissingRoute(error: unknown, path: string, method = 'GET') {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response
  if (response?.status !== 404) return false
  let body = response.data
  if (body instanceof Blob) body = await body.text()
  if (typeof body === 'string') {
    const missing = body.match(/Cannot (GET|PATCH|POST|PUT|DELETE) ([^\s<]+)/)
    return Boolean(
      missing && missing[1] === method && (missing[2] === path || missing[2] === `/api${path}`),
    )
  }
  const data = body as { code?: string; error?: { code?: string } } | null
  return ['route_not_found', 'endpoint_not_found'].includes(data?.error?.code || data?.code || '')
}

export async function readCompatible(
  path: string,
  config: AxiosRequestConfig,
  fallback = legacyRead(path),
) {
  try {
    return { response: await http.get(path, config), path }
  } catch (error) {
    if (!fallback || !(await isMissingRoute(error, path))) throw error
    return { response: await http.get(fallback, config), path: fallback }
  }
}
