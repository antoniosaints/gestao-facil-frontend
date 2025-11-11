import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Produto } from '@/@types/schemas'
import { useToast } from 'vue-toastification'
import { ProdutoRepository } from '@/repositories/produto-repository'

const toast = useToast()

export const useProdutoStore = defineStore('produtoStore', () => {
  const openModal = ref(false)
  const openModalLote = ref(false)
  const openModalReposicao = ref(false)
  const openModalEtiquetas = ref(false)
  const openModalRelatorio = ref(false)
  const openModalRelatorioGeral = ref(false)
  const idMutation = ref<number | null>(null)
  const selectedIds = ref<number[]>([])

  function resetSelectedIds() {
    selectedIds.value = []
  }

  function addSelectedId(id: number) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id)
    }
  }

  function removeSelectedId(id: number) {
    const index = selectedIds.value.indexOf(id)
    if (index !== -1) {
      selectedIds.value.splice(index, 1)
    }
  }

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
    controlaEstoque: false,
    producaoLocal: false,
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
      controlaEstoque: false,
      producaoLocal: false,
      custoMedioProducao: undefined,
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
    resetSelectedIds()
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
        controlaEstoque: data?.controlaEstoque,
        producaoLocal: data?.producaoLocal,
        custoMedioProducao: data?.custoMedioProducao || undefined,
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
    openModalEtiquetas,
    openModalRelatorio,
    openModalRelatorioGeral,
    openModalLote,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
    idMutation,
    selectedIds,
    addSelectedId,
    resetSelectedIds,
    removeSelectedId,
  }
})
