import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'
import { POSITION, useToast } from 'vue-toastification'

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

const toast = useToast()

export const useProdutoStore = defineStore('produtoStore', () => {
  const openModal = ref(false)

  const form = ref<Produto>({
    id: undefined,
    codigo: '',
    descricao: '',
    entradas: true,
    estoque: 0,
    minimo: 0,
    nome: '',
    preco: '',
    precoCompra: '',
    saidas: true,
    unidade: '',
    status: 'ATIVO',
  })

  const reset = () => {
    form.value = {
      id: undefined,
      codigo: '',
      descricao: '',
      entradas: true,
      estoque: 0,
      minimo: 0,
      nome: '',
      preco: '',
      precoCompra: '',
      saidas: true,
      unidade: 'un',
      status: 'ATIVO',
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }

  const filters = ref<Partial<Produto> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    try {
      const { data } = await get(id)
      form.value = {
        id: id,
        nome: data?.nome,
        codigo: data?.codigo,
        preco: data?.preco,
        precoCompra: data?.precoCompra,
        estoque: data?.estoque,
        minimo: data?.minimo,
        descricao: data?.descricao,
        entradas: data?.entradas,
        saidas: data?.saidas,
        unidade: data?.unidade,
      }
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar o produto')
    }
  }

  const get = async (id: number) => {
    const res = await http.get(`/produtos/${id}`)
    return res.data
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

  const sendCsvUpload = async (file: File) => {
    const data = new FormData()
    data.append('arquivo', file)
    await http.post('/produtos/importar/csv', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
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
    openModal,
    openSave,
    openUpdate,
    updateTable,
    get,
    filters,
    remove,
    save,
    update,
    getAllSelect2,
    getOneSelect2,
    gerarRelatorio,
    sendCsvUpload,
    csvDownload,
    gerarEtiquetas,
    gerarRelatorioGeral,
    resumo,
    repor,
    reset,
    form,
  }
})
