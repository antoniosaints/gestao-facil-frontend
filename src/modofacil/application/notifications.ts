import { watch, type WatchSource } from 'vue'
import { POSITION, TYPE, useToast } from 'vue-toastification'
import '../assets/toasts.css'

function notify(type: TYPE, text: string) {
  const message = text.trim()
  if (!message) return
  // One visible notification even when a form and its dialog report the same result.
  // Updating also restarts the timer for a later operation with the same message.
  try {
    useToast().update(
      `modofacil:${type}:${message}`,
      {
        content: message,
        options: {
          type,
          position: POSITION.TOP_RIGHT,
          toastClassName: ['mf-theme', 'mf-toast', `mf-toast--${type}`],
          bodyClassName: 'mf-toast-body',
          timeout: type === TYPE.SUCCESS ? 4500 : type === TYPE.WARNING ? 10000 : 7000,
          closeOnClick: false,
          pauseOnHover: true,
          pauseOnFocusLoss: true,
          hideProgressBar: true,
          accessibility: {
            toastRole: type === TYPE.SUCCESS ? 'status' : 'alert',
            closeButtonLabel: 'Fechar notificação',
          },
        },
      },
      true,
    )
  } catch {
    // Notification delivery must never change the result of a confirmed write.
    console.warn('Não foi possível exibir a notificação do Modo Fácil.')
  }
}

export function notifySuccess(message: string) {
  notify(TYPE.SUCCESS, message)
}

export function notifyError(message: string, uncertain = false) {
  const needsVerification =
    uncertain ||
    /antes de repetir|antes de iniciar outra|pode ter sido|não foi possível confirmar/i.test(
      message,
    )
  notify(needsVerification ? TYPE.WARNING : TYPE.ERROR, message)
}

// Shared inline feedback covers validation and loading errors as well as the
// older forms that do not use useDomainMutation. Loading itself stays inline.
export function useFeedbackToasts(
  error: WatchSource<string | undefined>,
  message?: WatchSource<string | undefined>,
) {
  watch(
    error,
    (value) => {
      if (value) notifyError(value)
    },
    { immediate: true },
  )
  if (message)
    watch(
      message,
      (value) => {
        if (value) notifySuccess(value)
      },
      { immediate: true },
    )
}
