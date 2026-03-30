import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ComandaRepository } from '@/repositories/comanda-repository'
import { useComandaStore } from '@/stores/arena/comandaStore'

const toast = useToast()
const store = useComandaStore()

export async function deletarComanda(id: number) {
  if (!id) {
    toast.error('Comanda nao encontrada.')
    return
  }

  const confirmed = await useConfirm().confirm({
    title: 'Excluir comanda',
    message:
      'Deseja excluir esta comanda? Ao confirmar, todos os itens vinculados que puderem ser removidos serao excluidos automaticamente.',
    confirmText: 'Sim, excluir',
  })

  if (!confirmed) return

  try {
    const response = await ComandaRepository.remove(id)
    toast.success(response.message || 'Comanda excluida com sucesso.')

    if (store.selectedComanda?.id === id) {
      store.selectedComanda = null
      store.openDetalhesModal = false
    }

    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao excluir a comanda.')
  }
}
