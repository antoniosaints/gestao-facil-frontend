import http from '@/utils/axios'
import { markDataChanged } from '../application/dataChanges'
import { readCompatible } from './compatibleRead'
export { resolveFileUrl } from '@/utils/fileUrl'
import {
  VendaRepository as LegacyVenda,
  type FinalizarVendaPdvPayload,
} from '@/repositories/venda-repository'
import {
  CaixaRepository as LegacyCaixa,
  type AbrirCaixaPayload,
  type MovimentarCaixaPayload,
  type FecharCaixaPayload,
} from '@/repositories/caixa-repository'
import { LancamentosRepository as LegacyFinance } from '@/repositories/lancamento-repository'
import type { Servicos } from '@/types/schemas'
import type { SaveOrdemServico } from '@/types/schemas'
export { ClienteRepository } from '@/repositories/cliente-repository'
export interface Row {
  id: number
  nome?: string
  [key: string]: any
}
export interface Page {
  rows: Row[]
  total: number
  pages: number
}
export const api = {
  async read(path: string, params: Record<string, unknown> = {}) {
    const {
      response: { data },
    } = await readCompatible(path, { params: { ...params, _mfRead: crypto.randomUUID() } })
    return data.data ?? data
  },
  async page(path: string, params: Record<string, unknown> = {}): Promise<Page> {
    const {
      response: { data },
    } = await readCompatible(path, {
      params: {
        page: 1,
        pageSize: 12,
        sortBy: 'id',
        order: 'desc',
        ...params,
        _mfRead: crypto.randomUUID(),
      },
    })
    const payload = data.data
    const rows = Array.isArray(payload) ? payload : payload?.items
    if (!Array.isArray(rows))
      throw new Error('A resposta da lista não corresponde ao contrato. Tente novamente.')
    return {
      rows,
      total: Number(data.total ?? payload?.total ?? rows.length),
      pages: Math.max(
        1,
        Number(
          data.totalPages ?? Math.ceil(Number(data.total ?? payload?.total ?? rows.length) / 12),
        ),
      ),
    }
  },
  async post(path: string, body: unknown) {
    const { data } = await http.post(path, body)
    markDataChanged(path)
    return data.data ?? data
  },
  async patch(path: string, body: unknown) {
    const { data } = await http.patch(path, body)
    markDataChanged(path)
    return data.data ?? data
  },
  async remove(path: string) {
    const { data } = await http.delete(path)
    markDataChanged(path)
    return data?.data ?? data
  },
}
export interface BasicProduct {
  nome: string
  categoriaId: number | null
  unidade: string
  preco: number
  precoCompra: number | null
  estoque?: number
  minimo: number
  descricao: string | null
}
export interface SavedProduct {
  produtoBaseId: number
  varianteId: number
  produto: Row
}
export const products = {
  get: (id: number) => api.read(`/modofacil/produtos/${id}`),
  variants: (id: number) => api.read(`/modofacil/produtos/${id}/variantes`),
  create: (body: BasicProduct, chaveOperacao: string): Promise<SavedProduct> =>
    api.post('/modofacil/produtos', { ...body, chaveOperacao }),
  update: (
    baseId: number,
    variantId: number,
    body: Partial<Omit<BasicProduct, 'estoque'>>,
  ): Promise<SavedProduct> =>
    api.patch(`/modofacil/produtos/${baseId}/variantes/${variantId}/basico`, body),
  async photo(variantId: number, file: File) {
    const body = new FormData()
    body.append('file', file)
    const { data } = await http.post(`/modofacil/produtos/variantes/${variantId}/imagem`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    markDataChanged('/modofacil/produtos')
    return data.data
  },
}

// Legacy reads here are metrics, exports and cashier operations absent from the
// dedicated API. Mutations with a dedicated contract use that boundary.
export const VendaRepository = {
  painel: (inicio?: string, fim?: string) => api.read('/vendas/resumo/painel', { inicio, fim }),
  getCupomPDF: (id: number) => download(`/modofacil/vendas/${id}/cupom-pdf`, `venda-${id}.pdf`),
  create: (body: unknown) => api.post('/modofacil/vendas', body),
  settle: (id: number, body: unknown) => api.post(`/modofacil/vendas/${id}/efetivar`, body),
  reverse: (id: number) => api.post(`/modofacil/vendas/${id}/estornar`, {}),
  finalizarVendaPdv: (body: FinalizarVendaPdvPayload) =>
    api.post('/modofacil/vendas/caixa/finalizar-venda', body),
}
export const CaixaRepository = {
  contexto: (): ReturnType<typeof LegacyCaixa.contexto> =>
    api.read('/modofacil/vendas/caixa/contexto'),
  abrirCaixa: (body: AbrirCaixaPayload) => api.post('/modofacil/vendas/caixa/abrir', body),
  movimentarCaixa: (body: MovimentarCaixaPayload) =>
    api.post('/modofacil/vendas/caixa/movimentar', body),
  async fecharCaixa(body: FecharCaixaPayload) {
    const { data } = await http.put('/modofacil/vendas/caixa/fechar', body)
    markDataChanged('/modofacil/vendas')
    return data.data
  },
  entrarCaixa: (body: { caixaId: number }) => api.post('/modofacil/vendas/caixa/entrar', body),
  resumoCaixa: (id: number) => api.read('/modofacil/vendas/caixa/resumo', { id }),
}
export const LancamentosRepository = {
  getDashboardVisaoGeral: async (
    params: Parameters<typeof LegacyFinance.getDashboardVisaoGeral>[0],
  ) => ({
    data: await api.read('/modofacil/financeiro/resumo', params as Record<string, unknown>),
  }),
  reverse: (id: number) => api.post(`/modofacil/financeiro/parcelas/${id}/estornar`, {}),
  pagarParcela: (id: number, body: Parameters<typeof LegacyFinance.pagarParcela>[1]) =>
    api.post(`/modofacil/financeiro/parcelas/${id}/pagar`, body),
}
export const ServicoRepository = {
  saveOrUpdate: (body: Omit<Servicos, 'descricao'> & { descricao?: string | null }) =>
    api.post('/modofacil/servicos', {
      ...(body.id ? { id: body.id } : {}),
      nome: body.nome,
      preco: body.preco,
      descricao: body.descricao,
      ...(typeof body.status === 'boolean' ? { status: body.status } : {}),
    }),
}
export const OrdensServicoRepository = {
  getPainel: (inicio: string, fim: string) =>
    api.read('/servicos/ordens/dashboard/painel', { inicio, fim }),
  settle: (id: number, body: unknown) =>
    api.post(`/modofacil/servicos/ordens/${id}/efetivar`, body),
  reverse: (id: number) => api.post(`/modofacil/servicos/ordens/${id}/estornar`, {}),
  getDetalhes: (id: number) => api.read(`/modofacil/servicos/ordens/${id}`),
  getOsPdf: (
    id: number,
    uid: string,
    withPix = false,
    semAssinatura = false,
    cobrancaId?: number | null,
  ) =>
    download(`/modofacil/servicos/ordens/${id}/pdf`, `${uid}.pdf`, {
      withPix,
      semAssinatura,
      cobrancaId,
    }),
  save: (body: Omit<SaveOrdemServico, 'id'>) => api.post('/modofacil/servicos/ordens', body),
}

async function download(path: string, filename: string, params: Record<string, unknown> = {}) {
  const {
    response: { data },
  } = await readCompatible(path, {
    responseType: 'blob',
    params: { ...params, _mfRead: crypto.randomUUID() },
  })
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data]))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
export const reports = {
  salesPdf: (inicio: string, fim: string) =>
    download('/modofacil/relatorios/vendas/pdf', 'vendas.pdf', { inicio, fim }),
  productPdf: (inicio?: string, fim?: string, orderBy = 'nome', model = 'simples') =>
    download('/modofacil/relatorios/produtos', 'produtos.pdf', { inicio, fim, orderBy, model }),
  financeExport: (params: Record<string, unknown>, formato: 'pdf' | 'csv') =>
    download(
      `/modofacil/relatorios/financeiro/demonstrativo/${formato}`,
      `demonstrativo.${formato}`,
      params,
    ),
  finance: async (params: Record<string, unknown>) => ({
    data: await api.read('/modofacil/relatorios/financeiro/demonstrativo', params),
  }),
}
