import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CategoriaFinanceiro } from '@/types/schemas'

type CategoriaSelecionada = {
  id?: number
  Uid?: string
  nome: string
  parentId: number | null
  Parent?: CategoriaFinanceiro['Parent']
}

export const useCategoriasFinanceirasStore = defineStore('categoriasFinanceirasStore', () => {
  const openModal = ref(false)
  const selectedCategoria = ref<CategoriaSelecionada | null>(null)
  const filters = ref<{ update: boolean }>({
    update: false,
  })

  function openSave() {
    selectedCategoria.value = null
    openModal.value = true
  }

  function openUpdate(categoria: CategoriaFinanceiro) {
    selectedCategoria.value = {
      id: categoria.id,
      Uid: categoria.Uid,
      nome: categoria.nome,
      parentId: categoria.parentId ?? null,
      Parent: categoria.Parent ?? null,
    }
    openModal.value = true
  }

  function updateTable() {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    selectedCategoria,
    filters,
    openSave,
    openUpdate,
    updateTable,
  }
})
