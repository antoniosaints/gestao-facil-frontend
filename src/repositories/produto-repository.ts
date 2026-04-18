import type { ProdutoBase, ProdutoCategoria, ProdutoVariante } from '@/types/schemas'
import http from '@/utils/axios'

type ReposicaoEstoque = {
  produtoId: number
  quantidade: number
  custo?: number
  data?: string
  notaFiscal?: string
  status?: string
  tipo?: 'ENTRADA' | 'SAIDA'
  clienteFornecedor?: number
  desconto?: number
  frete?: number
  vendaId?: number
}

type ProductReportType = 'catalogo' | 'movimentacoes' | 'vendas' | 'lucro'
type ProductReportScope = 'produto-base' | 'variante'

type ProductReportParams = {
  reportType: ProductReportType
  scope?: ProductReportScope
  targetId?: number
  inicio?: string
  fim?: string
  orderBy?: 'asc' | 'desc'
}

function downloadBlob(data: BlobPart, filename: string) {
  const blob = data instanceof Blob ? data : new Blob([data])
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

function getTodayFileSuffix() {
  return new Date()
    .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-')
}

export class ProdutoRepository {
  static async get(id: number) {
    const res = await http.get(`/produtos/${id}`)
    return res.data
  }

  static async remove(id: number) {
    await http.delete(`/produtos/${id}`)
  }

  static async update(produto: Partial<ProdutoBase>, id: number) {
    produto.id = id
    await http.post(`/produtos`, produto)
  }

  static async save(produto: Omit<ProdutoBase, 'id'>) {
    await http.post(`/produtos`, produto)
  }

  static async resumo(id: number) {
    const { data } = await http.get(`/produtos/${id}/resumo`)
    return data
  }

  static async csvDownload() {
    const data = await http.get(`/produtos/download/csv`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'text/csv' },
    })

    downloadBlob(data.data, 'produtos_base.csv')
  }

  static async sendCsvUpload(file: File) {
    const data = new FormData()
    data.append('arquivo', file)
    await http.post('/produtos/importar/csv', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  static async gerarRelatorioGeral(inicio?: string, fim?: string) {
    const data = await http.get(`/produtos/relatorio`, {
      params: {
        inicio,
        fim,
      },
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    downloadBlob(data.data, `relatorio-catalogo-produtos-${getTodayFileSuffix()}.pdf`)
  }

  static async gerarRelatorioVendas(scope: ProductReportScope, targetId: number, inicio?: string, fim?: string) {
    const data = await http.get(`/produtos/relatorio/vendas`, {
      params: {
        targetType: scope === 'produto-base' ? 'BASE' : 'VARIANTE',
        targetId,
        inicio,
        fim,
      },
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    downloadBlob(data.data, `relatorio-vendas-produto-${getTodayFileSuffix()}.pdf`)
  }

  static async gerarRelatorioLucro(scope: ProductReportScope, targetId: number, inicio?: string, fim?: string) {
    const data = await http.get(`/produtos/relatorio/lucro`, {
      params: {
        targetType: scope === 'produto-base' ? 'BASE' : 'VARIANTE',
        targetId,
        inicio,
        fim,
      },
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    downloadBlob(data.data, `relatorio-lucro-produto-${getTodayFileSuffix()}.pdf`)
  }

  static async gerarRelatorio(params: ProductReportParams) {
    if (params.reportType === 'catalogo') {
      return this.gerarRelatorioGeral(params.inicio, params.fim)
    }

    if (params.reportType === 'vendas') {
      if (!params.scope || !params.targetId) {
        throw new Error('Selecione um produto base ou variante para gerar o relatório de vendas.')
      }
      return this.gerarRelatorioVendas(params.scope, params.targetId, params.inicio, params.fim)
    }

    if (params.reportType === 'lucro') {
      if (!params.scope || !params.targetId) {
        throw new Error('Selecione um produto base ou variante para gerar o relatório de lucro.')
      }
      return this.gerarRelatorioLucro(params.scope, params.targetId, params.inicio, params.fim)
    }

    if (!params.targetId) {
      throw new Error('Selecione uma variante para gerar o relatório de movimentações.')
    }

    return ProdutoVarianteRepository.gerarRelatorio(params.targetId, params.orderBy || 'desc')
  }

  static async getResumoGeral(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/resumo-geral`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getReposicoesMensais(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/reposicao-mensal`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getTicketMedioMensal(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/ticket-medio`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getProdutosMenosSaidas(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/menos-saida`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getProdutosMaisSaidas(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/mais-repostos`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getFluxoEstoqueMensal(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/fluxo-estoque`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getDistribuicaoCategorias() {
    const { data } = await http.get(`/produtos/graficos/categorias`)
    return data
  }

  static async getSaudeEstoque() {
    const { data } = await http.get(`/produtos/graficos/saude-estoque`)
    return data
  }

  static async getLucroMedioProdutos(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/lucro-medio`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getGiroEstoqueProdutos(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/giro-estoque`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }

  static async getMargemContribuicao(inicio?: string, fim?: string) {
    const { data } = await http.get(`/produtos/graficos/margem-media`, {
      params: {
        inicio,
        fim,
      },
    })
    return data
  }
}

export class ProdutoVarianteRepository {
  static async get(id: number) {
    const res = await http.get(`/produtos/variantes/${id}`)
    return res.data
  }

  static async list(produtoBaseId: number) {
    const res = await http.get(`/produtos/${produtoBaseId}/variantes`)
    return res.data
  }

  static async save(produto: Partial<ProdutoVariante> & { produtoBaseId: number }) {
    await http.post(`/produtos/variantes`, produto)
  }

  static async remove(id: number) {
    await http.delete(`/produtos/variantes/${id}`)
  }

  static async resumo(id: number) {
    const { data } = await http.get(`/produtos/variantes/${id}/resumo`)
    return data.data
  }

  static async repor(reposicao: ReposicaoEstoque) {
    await http.post(`/produtos/reposicao`, reposicao)
  }

  static async gerarEtiquetas(id: number, quantidade?: number) {
    const data = await http.get(
      `/produtos/${id}/etiquetas${quantidade ? `?quantidade=${quantidade}` : ''}`,
      {
        responseType: 'blob',
        headers: { 'Content-Type': 'application/pdf' },
      },
    )

    downloadBlob(data.data, `etiquetas-produto-${id}-${getTodayFileSuffix()}.pdf`)
  }

  static async gerarRelatorio(id: number, orderBy: 'asc' | 'desc') {
    const data = await http.get(`/produtos/relatorio/reposicao/${id}?orderBy=${orderBy}`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    downloadBlob(data.data, `relatorio-movimentacoes-variante-${getTodayFileSuffix()}.pdf`)
  }
}

export class ProdutoCategoriaRepository {
  static async list() {
    const { data } = await http.get(`/produtos/categorias`, {
      params: {
        page: 1,
        pageSize: 200,
      },
    })
    return data
  }

  static async save(categoria: Partial<ProdutoCategoria>) {
    await http.post(`/produtos/categorias`, categoria)
  }

  static async remove(id: number) {
    await http.delete(`/produtos/categorias/${id}`)
  }
}
