import { ref } from 'vue'

export type StoreToastVariant = 'success' | 'error' | 'info'

export interface StoreToastItem {
  id: number
  message: string
  variant: StoreToastVariant
  duration: number
}

// Estado em nível de módulo: um único "hub" de toasts compartilhado por toda a loja.
const toasts = ref<StoreToastItem[]>([])
let seq = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function dismiss(id: number) {
  const index = toasts.value.findIndex((toast) => toast.id === id)
  if (index >= 0) toasts.value.splice(index, 1)
  const timer = timers.get(id)
  if (timer) { clearTimeout(timer); timers.delete(id) }
}

function push(message: string, variant: StoreToastVariant, duration: number) {
  const id = ++seq
  toasts.value.push({ id, message, variant, duration })
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration))
  return id
}

/**
 * Toast próprio da loja virtual — visual profissional e alinhado à marca,
 * independente do vue-toastification usado no painel administrativo.
 */
export function useStoreToast() {
  return {
    toasts,
    dismiss,
    success: (message: string, duration = 4000) => push(message, 'success', duration),
    error: (message: string, duration = 5000) => push(message, 'error', duration),
    info: (message: string, duration = 4000) => push(message, 'info', duration),
  }
}
