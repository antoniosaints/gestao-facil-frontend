import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'

export const useProdutoStore = defineStore('produtoStore', () => {
  const id = ref(0)
  const data = ref<Produto>()

  const dataDefault = ref<Partial<Produto>>({})

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

  const gerarRelatorio = async (id: number, orderBy: "asc" | "desc") => {
    const data = await http.get(`/produtos/relatorio/reposicao/${id}?orderBy=${orderBy}`, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    const url = window.URL.createObjectURL(data.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-reposicao.pdf'
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
    gerarRelatorio
  }
})
