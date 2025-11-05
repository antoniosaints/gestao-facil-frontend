import { ref } from 'vue'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  colorButton?: Color
}

type Color = 'success' | 'danger' | 'warning' | 'info' | 'primary'

const isOpen = ref<boolean>(false)
const color = ref<Color>('primary')
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
    color.value = opts.colorButton ?? 'danger'
    cancelText.value = opts.cancelText ?? 'Cancelar'
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolveFn = resolve
    })
  }

  const onYes = (): void => {
    isOpen.value = false
    resolveFn?.(true)
    resolveFn = null
  }

  const onNo = (): void => {
    isOpen.value = false
    resolveFn?.(false)
    resolveFn = null
  }

  return {
    isOpen,
    title,
    color,
    message,
    confirmText,
    cancelText,
    confirm,
    onYes,
    onNo,
  }
}
