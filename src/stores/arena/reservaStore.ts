import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ArenaAgendamentos } from '@/types/schemas'
import { useToast } from 'vue-toastification'
import { ArenaReservasRepository } from '@/repositories/reservas-repository'

const toast = useToast()
const padrao: ArenaAgendamentos = {
  id: undefined,
  quadraId: undefined,
  endAt: new Date(),
  status: 'PENDENTE',
  recorrente: false,
  startAt: new Date(),
}

export const useReservaStore = defineStore('reservaStore', () => {
  const openModal = ref(false)

  const form = ref<ArenaAgendamentos>({
    ...padrao,
  })

  const reset = () => {
    form.value = {
      ...padrao,
    }
  }

  const openSave = (startAt?: string) => {
    if (form.value.id) reset()
    if (startAt) form.value.startAt = startAt
    openModal.value = true
  }

  const filters = ref<Partial<ArenaAgendamentos> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    try {
      const { data } = await ArenaReservasRepository.get(id)
      form.value = {
        ...data,
      }
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro ao editar a reserva!')
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
