import { ref } from 'vue'
import type { RelatoBug } from '@/repositories/bug-repository'

// Estado compartilhado entre a tabela, as ações da linha e o modal de detalhe.
const refreshKey = ref(0)
const selected = ref<RelatoBug | null>(null)
const modalOpen = ref(false)

export function useBugsAdmin() {
  function triggerRefresh() {
    refreshKey.value = Date.now()
  }

  function openDetalhe(bug: RelatoBug) {
    selected.value = bug
    modalOpen.value = true
  }

  return { refreshKey, selected, modalOpen, triggerRefresh, openDetalhe }
}
