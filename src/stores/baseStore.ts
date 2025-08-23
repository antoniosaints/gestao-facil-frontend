import { ref } from 'vue'
import { defineStore } from 'pinia'
import http from '@/utils/axios'
import type { Produto } from '@/types/schemas'
import { useToast } from 'vue-toastification'

const toast = useToast()

export const useBaseStore = defineStore('baseStore', () => {
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
    if (form.value.id) reset();
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
        const { data } = await get(id);
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
            unidade: data?.unidade
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
    reset,
    form,
  }
})
