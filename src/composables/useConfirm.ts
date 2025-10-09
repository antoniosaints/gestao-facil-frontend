import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

const isOpen = ref<boolean>(false)
const title = ref<string>('')
const message = ref<string>('')
const confirmText = ref<string>('Confirmar')
const cancelText = ref<string>('Cancelar')
let resolveFn: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (opts: ConfirmOptions = {}): Promise<boolean> => {
    title.value = opts.title ?? 'Confirmação'
    message.value = opts.message ?? 'Tem certeza disso?'
    confirmText.value = opts.confirmText ?? 'Confirmar'
    cancelText.value = opts.cancelText ?? 'Cancelar'
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolveFn = resolve
    })
  }

  const onYes = (): void => {
    isOpen.value = false
    resolveFn?.(true)
  }

  const onNo = (): void => {
    isOpen.value = false
    resolveFn?.(false)
  }

  return {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    confirm,
    onYes,
    onNo
  }
}
