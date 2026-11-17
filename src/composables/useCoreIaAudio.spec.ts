import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prepareCoreAudio, useCoreIaAudio } from './useCoreIaAudio'

let api: ReturnType<typeof useCoreIaAudio>
let wrapper: ReturnType<typeof mount>
const onError = vi.fn()
const stopTrack = vi.fn()
const getUserMedia = vi.fn()
class Recorder {
  static isTypeSupported() {
    return true
  }
  state = 'inactive'
  mimeType = 'audio/webm'
  ondataavailable?: (event: any) => void
  onstop?: () => void
  onerror?: () => void
  start() {
    this.state = 'recording'
  }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio'], { type: this.mimeType }) })
    this.onstop?.()
  }
}
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.stubGlobal('MediaRecorder', Recorder)
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
  URL.createObjectURL = vi.fn(() => 'blob:recording')
  URL.revokeObjectURL = vi.fn()
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] })
  wrapper = mount(
    defineComponent({
      setup() {
        api = useCoreIaAudio(onError)
        return () => null
      },
    }),
  )
})
afterEach(() => {
  wrapper.unmount()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Core IA — microfone e arquivo de áudio', () => {
  it('libera o microfone ao descartar a gravação', async () => {
    await api.start()
    expect(api.recording.value).toBe(true)
    api.cancel()
    expect(stopTrack).toHaveBeenCalled()
    expect(api.recording.value).toBe(false)
    expect(api.selected.value).toBeNull()
  })
  it('libera tracks quando a permissão chega após desmontar o componente', async () => {
    let grant: (stream: any) => void = () => {}
    getUserMedia.mockReturnValue(
      new Promise((resolve) => {
        grant = resolve
      }),
    )
    const promise = api.start()
    wrapper.unmount()
    grant({ getTracks: () => [{ stop: stopTrack }] })
    await promise
    expect(stopTrack).toHaveBeenCalled()
    expect(api.recording.value).toBe(false)
  })
  it('encerra a gravação automaticamente em 90 segundos', async () => {
    await api.start()
    await vi.advanceTimersByTimeAsync(90000)
    expect(api.recording.value).toBe(false)
    expect(stopTrack).toHaveBeenCalled()
  })
  it('orienta o envio de arquivo quando o microfone é negado', async () => {
    getUserMedia.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
    await api.start()
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Permita o microfone'))
    expect(api.requesting.value).toBe(false)
  })
  it('descarta leitura de arquivo que termina depois da limpeza da sessão', async () => {
    vi.useRealTimers()
    const selection = api.select(new File(['audio'], 'pedido.webm', { type: 'audio/webm' }))
    api.remove()
    await selection
    expect(api.selected.value).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording')
  })
  it('rejeita formatos, áudio vazio e arquivo acima de 8 MB', async () => {
    for (const file of [
      new Blob(['x'], { type: 'text/html' }),
      new Blob([], { type: 'audio/wav' }),
      new Blob([new Uint8Array(8 * 1024 * 1024 + 1)], { type: 'audio/wav' }),
    ])
      await expect(prepareCoreAudio(file)).rejects.toThrow()
    await flushPromises()
  })
})
