import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ComandaVenda } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { ArenaQuadrasRepository } from '@/repositories/quadras-repository'

const toast = useToast()
const padrao: ComandaVenda = {
  id: undefined,
  abertura: new Date(),
  clienteNome: '',
  status: 'ABERTA',
}

export const useComandaStore = defineStore('comandaStore', () => {
  const openModal = ref(false)

  const form = ref<ComandaVenda>({
    ...padrao,
  })

  const reset = () => {
    form.value = {
      ...padrao,
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }

  const filters = ref<Partial<ComandaVenda> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    try {
      const { data } = await ArenaQuadrasRepository.get(id)
      form.value = {
        ...data,
      }
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar a comanda!')
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
