import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'

export const useProdutoStore = defineStore('produtoStore', () => {
  const id = ref(0)
  const data = ref<Produto>()

  const dataDefault = ref<Produto>({
    unidade: '',
    descricao: '',
    entradas: false,
    estoque: 0,
    minimo: 0,
    nome: '',
    preco: 0,
    precoCompra: 0,
    saidas: false,
    status: '',
    Uid: '',
  })

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
  }
})
