import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Produto } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { ProdutoRepository } from '@/repositories/produto-repository'

const toast = useToast()

export const useProdutoStore = defineStore('produtoStore', () => {
  const openModal = ref(false)
  const openModalReposicao = ref(false)
  const idMutation = ref<number | null>(null)

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
      const { data } = await ProdutoRepository.get(id)
      form.value = {
        id: id,
        status: data?.status,
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

  return {
    openModal,
    openModalReposicao,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
    idMutation,
  }
})
