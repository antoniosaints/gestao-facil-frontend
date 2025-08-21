import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'

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

export const useProdutoStore = defineStore('produtoStore', () => {
  const id = ref<number | null>(null)
  const data = ref<Produto>()

  const base = ref<Partial<Produto>>({
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    preco: 0,
    precoCompra: 0,
    saidas: true,
    unidade: 'UND',
    status: 'ATIVO',
  })

  const reset = () => {
    id.value = null
    base.value = {
      codigo: '',
      descricao: '',
      entradas: true,
      estoque: 0,
      minimo: 0,
      nome: '',
      preco: 0,
      precoCompra: 0,
      saidas: true,
      unidade: 'UND',
      status: 'ATIVO',
    }
    data.value = undefined
  }

  const get = async (id: number) => {
    const data = await http.get(`/produtos/${id}`)
    return data.data
  }

  const remove = async (id: number) => {
    await http.delete(`/produtos/${id}`)
  }

  const update = async (produto: Partial<Produto>, id: number) => {
    produto.id = id
    await http.post(`/produtos`, produto)
  }

  const save = async (produto: Omit<Produto, 'id'>) => {
    await http.post(`/produtos`, produto)
  }

  const repor = async (reposicao: ReposicaoEstoque) => {
    await http.post(`/produtos/reposicao`, reposicao)
  }

  const resumo = async (id: number) => {
    const { data } = await http.get(`/produtos/${id}/resumo`)
    return data
  }

  const gerarEtiquetas = async (id: number) => {
    const data = await http.get(`/produtos/${id}/etiquetas`, {
      responseType: 'blob',
      headers: { 'Content-Type': 'application/pdf' },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    a.download = `etiquetas_produto_${id}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const csvDownload = async () => {
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

  const gerarRelatorio = async (id: number, orderBy: 'asc' | 'desc') => {
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

  const gerarRelatorioGeral = async () => {
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

  const getAllSelect2 = async (q: string | undefined) => {
    const { data } = await http.get('/produtos?search=' + (q || ''))

    return data.data.map((row: any) => {
      return {
        id: row.id,
        label: row.nome,
      }
    })
  }
  const getOneSelect2 = async (id: number | string) => {
    const { data } = await http.get('/produtos/' + id)

    return {
      id: data.data.id,
      label: data.data.nome,
    }
  }

  return {
    id,
    get,
    remove,
    save,
    update,
    getAllSelect2,
    getOneSelect2,
    gerarRelatorio,
    csvDownload,
    gerarEtiquetas,
    gerarRelatorioGeral,
    resumo,
    repor,
    reset,
    data,
    base,
  }
})
