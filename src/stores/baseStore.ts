import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Produto } from '@/types/schemas'
import { useToast } from 'vue-toastification'

const toast = useToast()

export const useBaseStore = defineStore('baseStore', () => {
  const openModal = ref(false)

  const form = ref<Produto>()

  const reset = () => {} // limpa os campos

  const openSave = () => {
    // if (form.value.id) reset(); // limpa os campos
    openModal.value = true // abre o modal
  }

  const filters = ref<Partial<Produto> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  const openUpdate = async (id: number) => {
    try {
      // const { data } = await Repository.get(id)
      // form.value = {} // passa os valores
      openModal.value = true
    } catch (error) {
      console.log(error)
      toast.error('Erro')
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
