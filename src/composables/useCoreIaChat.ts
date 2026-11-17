import { ref, watch } from 'vue'
import type { SelectedCoreAudio } from './useCoreIaAudio'
import { useUiStore } from '@/stores/ui/uiStore'
import {
  GeminiRepository,
  type CoreIaAttachment,
  type CoreIaAction,
  type CoreIaSource,
  type GeminiChatImage,
} from '@/repositories/gemini-repository'

export type CoreIaMessage = {
  id: string
  text: string
  isUser: boolean
  imagePreview?: string
  transcript?: string
  audioName?: string
  actions?: CoreIaAction[]
  sources?: CoreIaSource[]
}
const messages = ref<CoreIaMessage[]>([])
const history = ref<any[]>([])
const busy = ref(false)
const phase = ref('')
const error = ref('')
const draft = ref('')
const selectedImage = ref<(GeminiChatImage & { dataUrl: string }) | null>(null)
const selectedAudio = ref<SelectedCoreAudio | null>(null)
let scope = ''
let epoch = 0
let retry: {
  text: string
  image?: CoreIaAttachment | null
  audio?: CoreIaAttachment | null
  preview?: string
  messageId: string
} | null = null
let retryDecision: { id: string; decision: 'confirm' | 'cancel' } | null = null
function add(text: string, isUser = false, extra: Partial<CoreIaMessage> = {}) {
  const message = { id: crypto.randomUUID(), text, isUser, ...extra }
  messages.value.push(message)
  return message
}
export function useCoreIaChat() {
  const ui = useUiStore()
  function clear() {
    epoch++
    messages.value = []
    history.value = []
    busy.value = false
    error.value = ''
    draft.value = ''
    selectedImage.value = null
    if (selectedAudio.value) URL.revokeObjectURL(selectedAudio.value.url)
    selectedAudio.value = null
    retry = null
    retryDecision = null
  }
  watch(
    () => `${ui.usuarioLogged?.contaId || ''}:${ui.usuarioLogged?.id || ''}`,
    (value) => {
      if (value !== scope) {
        scope = value
        clear()
      }
    },
    { immediate: true, flush: 'sync' },
  )
  async function send(
    text: string,
    image?: CoreIaAttachment | null,
    audio?: CoreIaAttachment | null,
    preview?: string,
    retrying = false,
  ) {
    if (busy.value || (!text.trim() && !image && !audio)) return false
    const requestEpoch = epoch
    const message =
      retrying && retry
        ? messages.value.find((item) => item.id === retry!.messageId)!
        : add(text || (audio ? 'Mensagem de voz' : 'Analisar imagem'), true, {
            imagePreview: preview,
            audioName: audio?.name,
          })
    retry = { text, image, audio, preview, messageId: message.id }
    retryDecision = null
    error.value = ''
    busy.value = true
    phase.value = audio
      ? 'Transcrevendo áudio e preparando resposta…'
      : 'Consultando o sistema e preparando resposta…'
    try {
      const response = await GeminiRepository.chat(text, history.value, image, audio)
      if (requestEpoch !== epoch) return false
      if (response.status !== 200 || !response.data?.reply)
        throw new Error(response.message || 'Não foi possível processar a mensagem.')
      const data = response.data
      history.value = data.history || []
      message.transcript = data.transcript
      add(data.reply, false, { actions: data.pendingActions, sources: data.sources })
      retry = null
      return true
    } catch (err: any) {
      if (requestEpoch === epoch)
        error.value =
          err?.response?.data?.message ||
          err?.message ||
          'Falha na conexão. Sua mensagem foi preservada.'
      return false
    } finally {
      if (requestEpoch === epoch) busy.value = false
    }
  }
  async function decide(action: CoreIaAction, decision: 'confirm' | 'cancel') {
    if (busy.value || action.state === 'done') return
    const requestEpoch = epoch
    busy.value = true
    error.value = ''
    phase.value =
      decision === 'confirm' ? 'Registrando a operação revisada…' : 'Cancelando a operação…'
    retryDecision = { id: action.id, decision }
    retry = null
    try {
      const response = await GeminiRepository.decide(action.id, decision, history.value)
      if (requestEpoch !== epoch) return
      if (response.status !== 200 || !response.data?.reply)
        throw new Error(response.message || 'Não foi possível processar a confirmação.')
      action.state = 'done'
      history.value = response.data.history || history.value
      add(response.data.reply)
      retryDecision = null
    } catch (err: any) {
      if (requestEpoch === epoch) {
        if (err?.response?.status === 410) {
          action.state = 'done'
          retryDecision = null
          add(err.response.data.message || 'A revisão expirou. Envie o pedido novamente.')
        } else
          error.value =
            err?.response?.data?.message ||
            'Não foi possível obter a confirmação. Tente novamente: a mesma operação não será executada duas vezes.'
      }
    } finally {
      if (requestEpoch === epoch) busy.value = false
    }
  }
  async function retryLast() {
    if (retryDecision) {
      const action = messages.value
        .flatMap((message) => message.actions || [])
        .find((action) => action.id === retryDecision!.id)
      if (action) await decide(action, retryDecision.decision)
    } else if (retry) await send(retry.text, retry.image, retry.audio, retry.preview, true)
  }
  function revisionDraft(action: CoreIaAction) {
    const index = messages.value.findIndex((message) =>
      message.actions?.some((item) => item.id === action.id),
    )
    const source = messages.value
      .slice(0, index)
      .reverse()
      .find((message) => message.isUser)
    const originalText =
      source?.text && !source.imagePreview && source.text !== 'Mensagem de voz' ? source.text : ''
    return (
      [source?.transcript, originalText].filter(Boolean).join('\n\n') ||
      `${action.title}:\n${action.fields.map((field) => `${field.label}: ${field.value}`).join('\n')}`
    )
  }
  return {
    messages,
    history,
    busy,
    phase,
    error,
    draft,
    selectedImage,
    selectedAudio,
    send,
    decide,
    retryLast,
    clear,
    revisionDraft,
  }
}
