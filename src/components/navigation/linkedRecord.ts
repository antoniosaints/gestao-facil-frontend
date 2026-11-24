import type { RouteLocationRaw } from 'vue-router'

export type LinkedRecordKind =
  | 'cliente'
  | 'venda'
  | 'lancamento'
  | 'conta'
  | 'categoria'
  | 'ordem'
  | 'produto'
  | 'categoriaProduto'
  | 'assinatura'
  | 'emprestimo'

export function linkedRecordId(value: unknown) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const linkedRecordNames: Record<LinkedRecordKind, string> = {
  cliente: 'cadastro do cliente ou fornecedor',
  venda: 'venda',
  lancamento: 'lançamento financeiro',
  conta: 'conta financeira',
  categoria: 'categoria financeira',
  ordem: 'ordem de serviço',
  produto: 'produto',
  categoriaProduto: 'categoria do produto',
  assinatura: 'contrato',
  emprestimo: 'empréstimo',
}

export function linkedRecordRoute(
  kind: LinkedRecordKind,
  value: unknown,
  variant?: unknown,
  modoFacil = false,
): RouteLocationRaw | null {
  const id = linkedRecordId(value)
  if (!id) return null
  switch (kind) {
    case 'cliente':
      return { name: modoFacil ? 'modofacil-pessoa' : 'clientes-detalhes', params: { id } }
    case 'venda':
      return { name: modoFacil ? 'modofacil-venda' : 'vendas-detalhes', params: { id } }
    case 'lancamento':
      return modoFacil
        ? { name: 'modofacil-lancamento', params: { id } }
        : { name: 'lancamentos-financeiro-detalhes', query: { id } }
    case 'conta':
      return {
        name: modoFacil ? 'modofacil-financeiro-conta' : 'financeiro-conta-detalhes',
        params: { id },
      }
    case 'categoria':
      return modoFacil
        ? { name: 'modofacil-financeiro-cadastros', query: { tab: 'categorias', categoria: id } }
        : { name: 'financeiro-categorias', query: { categoria: id } }
    case 'ordem':
      return { name: modoFacil ? 'modofacil-ordem' : 'servicos-ordem-detalhes', params: { id } }
    case 'produto': {
      const varianteId = linkedRecordId(variant) ?? undefined
      return modoFacil
        ? { name: 'modofacil-produto', params: { produtoBaseId: id }, query: { varianteId } }
        : { name: 'produtos-detalhes', query: { id, varianteId } }
    }
    case 'categoriaProduto':
      return {
        name: modoFacil ? 'modofacil-categorias' : 'produtos-categorias',
        query: { categoria: id },
      }
    case 'assinatura':
      return { name: 'assinaturas-detalhes', params: { id } }
    case 'emprestimo':
      return {
        name: modoFacil ? 'modofacil-financeiro-emprestimos' : 'financeiro-emprestimos',
        query: { emprestimo: id },
      }
  }
}
