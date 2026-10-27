import { ref } from 'vue'
import { errorMessage } from './format'
import { notifySuccess, notifyError } from './notifications'
/** Mutations are never retried here, including after a potentially committed 5xx. */
export function useDomainMutation() {
  const busy = ref(false),
    error = ref(''),
    message = ref(''),
    uncertain = ref(false)
  async function run<T>(
    operation: () => Promise<T>,
    success: string,
  ): Promise<{ value: T } | null> {
    if (busy.value || uncertain.value) return null
    busy.value = true
    error.value = ''
    message.value = ''
    try {
      const value = await operation()
      message.value = success
      notifySuccess(success)
      return { value }
    } catch (e) {
      error.value = errorMessage(e)
      const status = (e as any).response?.status
      if (!status || status >= 500) {
        uncertain.value = true
        error.value +=
          ' O resultado pode ter sido registrado. Consulte o registro e o histórico antes de iniciar outra ação.'
      }
      notifyError(error.value, uncertain.value)
      return null
    } finally {
      busy.value = false
    }
  }
  return { busy, error, message, uncertain, run }
}
