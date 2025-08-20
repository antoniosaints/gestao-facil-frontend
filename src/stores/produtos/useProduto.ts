import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'

export const useProdutoStore = defineStore('produtoStore', () => {
  const id = ref(0)

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

  return {
    id,
    get,
    remove,
    save,
    update,
  }
})
