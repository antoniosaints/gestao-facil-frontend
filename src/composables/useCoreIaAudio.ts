import { computed, onBeforeUnmount, ref, type Ref } from 'vue'
import type { CoreIaAttachment } from '@/repositories/gemini-repository'

export const MAX_CORE_AUDIO_BYTES = 8 * 1024 * 1024
const allowed = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/flac',
  'audio/aac',
]
export type SelectedCoreAudio = CoreIaAttachment & { url: string }
export async function prepareCoreAudio(
  file: Blob,
  name = 'Mensagem de voz',
): Promise<SelectedCoreAudio> {
  const mime = file.type.split(';')[0]?.toLowerCase().replace('audio/x-m4a', 'audio/mp4') || ''
  if (!allowed.includes(mime))
    throw new Error('Formato não suportado. Use MP3, WAV, OGG, M4A ou WebM.')
  if (!file.size || file.size > MAX_CORE_AUDIO_BYTES)
    throw new Error('O áudio deve ter conteúdo e no máximo 8 MB.')
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(new Error('Não foi possível ler o áudio.'))
    reader.readAsDataURL(file)
  })
  return { data, mimeType: mime, name, url: URL.createObjectURL(file) }
}
export function useCoreIaAudio(
  onError: (message: string) => void,
  sharedSelection?: Ref<SelectedCoreAudio | null>,
) {
  const selected = sharedSelection || ref<SelectedCoreAudio | null>(null)
  const preparing = ref(false)
  const recording = ref(false)
  const requesting = ref(false)
  const seconds = ref(0)
  const supported = computed(
    () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
  )
  let stream: MediaStream | null = null
  let recorder: MediaRecorder | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let disposed = false
  let cancelled = false
  let selectionVersion = 0
  function release() {
    if (timer) clearInterval(timer)
    timer = undefined
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
    recording.value = false
  }
  function clearPreview() {
    if (selected.value) URL.revokeObjectURL(selected.value.url)
    selected.value = null
  }
  function remove() {
    selectionVersion++
    preparing.value = false
    clearPreview()
  }
  async function select(file: File) {
    const version = ++selectionVersion
    preparing.value = true
    try {
      const audio = await prepareCoreAudio(file, file.name)
      if (disposed || version !== selectionVersion) {
        URL.revokeObjectURL(audio.url)
        return
      }
      clearPreview()
      selected.value = audio
    } catch (error) {
      onError((error as Error).message)
    } finally {
      if (version === selectionVersion) preparing.value = false
    }
  }
  async function start() {
    if (!supported.value || recording.value || requesting.value || preparing.value) return
    requesting.value = true
    cancelled = false
    const version = ++selectionVersion
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (disposed || cancelled || version !== selectionVersion) {
        release()
        return
      }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(
        (type) => MediaRecorder.isTypeSupported(type),
      )
      const activeRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorder = activeRecorder
      const chunks: Blob[] = []
      let bytes = 0
      const recordingMime = recorder.mimeType
      recorder.ondataavailable = (event) => {
        if (!event.data.size) return
        bytes += event.data.size
        chunks.push(event.data)
        if (bytes > MAX_CORE_AUDIO_BYTES) {
          cancelled = true
          stop()
          onError('O áudio atingiu 8 MB. Grave uma mensagem menor.')
        }
      }
      recorder.onerror = () => {
        cancelled = true
        if (recorder === activeRecorder) release()
        onError('Não foi possível gravar. Envie um arquivo de áudio ou tente novamente.')
      }
      recorder.onstop = async () => {
        if (recorder === activeRecorder) release()
        if (disposed || cancelled || version !== selectionVersion) return
        preparing.value = true
        try {
          const audio = await prepareCoreAudio(new Blob(chunks, { type: recordingMime }))
          if (disposed || cancelled || version !== selectionVersion) {
            URL.revokeObjectURL(audio.url)
            return
          }
          clearPreview()
          selected.value = audio
        } catch (error) {
          onError((error as Error).message)
        } finally {
          if (version === selectionVersion) preparing.value = false
        }
      }
      recorder.start(1000)
      seconds.value = 0
      recording.value = true
      timer = setInterval(() => {
        seconds.value++
        if (seconds.value >= 90) stop()
      }, 1000)
    } catch (error) {
      release()
      onError(
        (error as Error).name === 'NotAllowedError'
          ? 'Permita o microfone no navegador ou envie um arquivo de áudio.'
          : 'Microfone indisponível. Envie um arquivo de áudio.',
      )
    } finally {
      requesting.value = false
    }
  }
  function stop() {
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    release()
  }
  function cancel() {
    cancelled = true
    stop()
  }
  onBeforeUnmount(() => {
    disposed = true
    cancel()
    if (!sharedSelection) remove()
  })
  return {
    selected,
    preparing,
    recording,
    requesting,
    seconds,
    supported,
    select,
    start,
    stop,
    cancel,
    remove,
  }
}
