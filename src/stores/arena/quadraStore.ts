import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ArenaQuadras } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { ArenaQuadrasRepository } from '@/repositories/quadras-repository'

const toast = useToast()
const padrao: ArenaQuadras = {
  id: undefined,
  name: '',
  active: true,
  precoHora: undefined,
  aprovarSemPagamento: false,
  description: '',
  permitirReservaOnline: true,
  tempoMinimo: 60,
  tempoReserva: 60,
}

export const useQuadraStore = defineStore('quadraStore', () => {
  const openModal = ref(false)

  const form = ref<ArenaQuadras>({
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

  const filters = ref<Partial<ArenaQuadras> & { update: boolean }>({
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
      toast.error('Erro ao editar a quadra!')
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
