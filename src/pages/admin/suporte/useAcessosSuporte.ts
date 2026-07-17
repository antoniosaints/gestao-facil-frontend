import { ref } from 'vue'

const refreshKey = ref(0)

export function useAcessosSuporte() {
  function triggerRefresh() {
    refreshKey.value = Date.now()
  }

  return {
    refreshKey,
    triggerRefresh,
  }
}
