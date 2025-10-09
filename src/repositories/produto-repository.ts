import type { Produto } from '@/types/schemas'
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

export class ProdutoRepository {
  static async get(id: number) {
    const res = await http.get(`/produtos/${id}`)
    return res.data
  }

  static async remove(id: number) {
    await http.delete(`/produtos/${id}`)
  }

  static async update(produto: Partial<Produto>, id: number) {
    produto.id = id
    await http.post(`/produtos`, produto)
  }

  static async save(produto: Omit<Produto, 'id'>) {
    await http.post(`/produtos`, produto)
  }

  static async repor(reposicao: ReposicaoEstoque) {
    await http.post(`/produtos/reposicao`, reposicao)
  }

  static async resumo(id: number) {
    const { data } = await http.get(`/produtos/${id}/resumo`)
    return data
  }

  static async gerarEtiquetas(id: number, quantidade?: number) {
    const data = await http.get(
      `/produtos/${id}/etiquetas${quantidade ? `?quantidade=${quantidade}` : ''}`,
      {
        responseType: 'blob',
        headers: { 'Content-Type': 'application/pdf' },
      },
    )

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `etiquetas_produto_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  static async csvDownload() {
    const data = await http.get(`/produtos/download/csv`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'text/csv' },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'produtos_base.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
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

  static async gerarRelatorio(id: number, orderBy: 'asc' | 'desc') {
    const data = await http.get(`/produtos/relatorio/reposicao/${id}?orderBy=${orderBy}`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.download = `relatorio-reposicao-${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  static async gerarRelatorioGeral() {
    const data = await http.get(`/produtos/relatorio`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    const dataHoje = new Date()
      .toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
    a.href = url
    a.download = `relatorio-produtos-${dataHoje}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}
