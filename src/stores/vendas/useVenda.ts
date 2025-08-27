import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Vendas } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { VendaRepository } from '@/repositories/venda-repository'

const toast = useToast()

export const useVendasStore = defineStore('vendasStore', () => {
  const openModal = ref(false)

  const form = ref<Vendas>({
    id: undefined,
    status: 'ORCAMENTO',
    data: new Date(),
    desconto: 0,
    faturado: false,
    valor: 0,
  })

  const reset = () => {
    form.value = {
      id: undefined,
      status: 'ORCAMENTO',
      data: new Date(),
      desconto: 0,
      faturado: false,
      valor: 0,
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }

  const filters = ref<Partial<Vendas> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    try {
      const { data } = await VendaRepository.get(id)
      form.value = {
        id: id,
        status: data?.status,
        data: data?.data,
        desconto: data?.desconto,
        faturado: data?.faturado,
        valor: data?.valor,
      }
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao buscar os dados!')
    }
  }

  return {
    openModal,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
