import { ref } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { ContaRepository } from '@/repositories/conta-repository'

/** Instalação e credenciais são pré-requisitos distintos para as cobranças. */
export function useMercadoPagoAccess() {
  const ui = useUiStore()
  const ready = ref(false)
  const loading = ref(false)
  const failed = ref(false)
  async function refresh() {
    loading.value = true
    ready.value = false
    failed.value = false
    try {
      await ui.loadAppModules()
      if (!ui.appModulesLoaded) throw new Error('Apps indisponíveis')
      if (!ui.hasActiveModule('mercado-pago')) return
      const status = await ContaRepository.statusMercadoPago()
      ready.value = status.modo === 'OAUTH' || status.modo === 'API_KEY'
    } catch {
      failed.value = true
    } finally {
      loading.value = false
    }
  }
  return { ready, loading, failed, refresh }
}
