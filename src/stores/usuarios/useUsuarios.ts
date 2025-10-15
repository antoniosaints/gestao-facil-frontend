import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type Usuarios } from '@/types/schemas'
import { UsuarioRepository } from '@/repositories/usuario-repository'

export const useUsuarioStore = defineStore('usuarioStore', () => {
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)

  const base = ref<Usuarios>({
    nome: '',
    status: 'ATIVO',
    email: '',
    gerencialMode: false,
    permissao: 'usuario',
    senha: '',
    telefone: '',
    id: undefined,
    superAdmin: false,
    biografia: '',
    endereco: '',
    profile: '',
    pushReceiver: false,
    emailReceiver: false,
  })

  const form = ref<Usuarios>({
    ...base.value,
  })

  const reset = () => {
    form.value = {
      ...base.value,
    }
  }

  const openSave = () => {
    if (form.value.id) reset()
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const usuario = await UsuarioRepository.get(id)
    form.value = {
      ...usuario,
    }
    openModal.value = true
  }

  const filters = ref<Partial<Usuarios> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    idMutation,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
  }
})
