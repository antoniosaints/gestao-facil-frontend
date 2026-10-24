import { ref, watch } from 'vue'

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

function settle(value: boolean) {
  const resolve = resolveFn
  resolveFn = null
  isOpen.value = false
  resolve?.(value)
}

// Escape, overlay e gesto do drawer também são cancelamentos.
watch(isOpen, (open) => {
  if (!open) settle(false)
}, { flush: 'sync' })

export function useConfirm() {
  const confirm = (opts: ConfirmOptions = {}): Promise<boolean> => {
    settle(false)
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
    settle(true)
  }

  const onNo = (): void => {
    settle(false)
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
