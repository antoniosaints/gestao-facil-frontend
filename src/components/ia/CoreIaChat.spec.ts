import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import ChatPage from '@/pages/agente/ChatPage.vue'
import { GeminiRepository } from '@/repositories/gemini-repository'
import { formatCoreIaMessage } from '@/utils/coreIaMarkdown'

const state = vi.hoisted(() => ({ id: 0 }))
const ui = reactive({
  usuarioLogged: { id: state.id, contaId: 1, nome: 'Maria Silva' },
  hasActiveModule: () => true,
})
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ui }))
vi.mock('vue-toastification', () => ({ useToast: () => ({ error: vi.fn(), success: vi.fn() }) }))
vi.mock('@/repositories/gemini-repository', () => ({
  GeminiRepository: { chat: vi.fn(), decide: vi.fn() },
}))
vi.mock('@/components/ia/IaUsageIndicator.vue', () => ({
  default: { template: '<span />', methods: { refresh() {} } },
}))

let wrappers: ReturnType<typeof mount>[] = []
function chat(embedded = false) {
  const wrapper = mount(ChatPage, {
    props: { embedded },
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
  wrappers.push(wrapper)
  return wrapper
}
const action = () => ({
  id: crypto.randomUUID(),
  title: 'Cadastrar cliente',
  fields: [{ label: 'Nome', value: 'Maria' }],
  expiresAt: new Date(Date.now() + 600000).toISOString(),
})
const response = (data: any) => ({
  status: 200,
  message: 'Sucesso',
  data: {
    reply: 'Revise os dados.',
    history: [{ role: 'user', parts: [{ text: 'Cadastrar Maria' }] }],
    ...data,
  },
})
beforeEach(() => {
  ui.usuarioLogged.id++
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:test')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers = []
})

describe('Core IA — chat completo e flutuante', () => {
  for (const embedded of [false, true])
    it(`revisa e confirma cadastro no modo ${embedded ? 'flutuante' : 'completo'}`, async () => {
      const review = action()
      vi.mocked(GeminiRepository.chat).mockResolvedValue(response({ pendingActions: [review] }))
      vi.mocked(GeminiRepository.decide).mockResolvedValue(
        response({ reply: 'Cliente cadastrado com sucesso.', actionId: review.id }),
      )
      const wrapper = chat(embedded)
      await wrapper.get('textarea').setValue('Cadastre Maria')
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(GeminiRepository.chat).toHaveBeenCalledOnce()
      expect(GeminiRepository.decide).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Maria')
      expect(wrapper.get('textarea').attributes('disabled')).toBeDefined()
      await wrapper.get(`[data-action-id="${review.id}"] button`).trigger('click')
      await flushPromises()
      expect(GeminiRepository.decide).toHaveBeenCalledWith(review.id, 'confirm', expect.any(Array))
      expect(wrapper.text()).toContain('Cliente cadastrado com sucesso.')
      expect(wrapper.get('textarea').attributes('disabled')).toBeUndefined()
      expect(wrapper.find('[data-action-id] button').exists()).toBe(false)
    })
  it('corrigir cancela a revisão antes de editar e compartilhar entre as interfaces', async () => {
    const review = action()
    vi.mocked(GeminiRepository.chat).mockResolvedValue(response({ pendingActions: [review] }))
    vi.mocked(GeminiRepository.decide).mockResolvedValue(
      response({ reply: 'Operação cancelada.', actionId: review.id }),
    )
    const widget = chat(true)
    await widget.get('textarea').setValue('Cadastre Maria')
    await widget.get('form').trigger('submit')
    await flushPromises()
    const full = chat()
    expect(full.text()).toContain('Cadastre Maria')
    const correct = full
      .findAll('[data-action-id] button')
      .find((button) => button.text() === 'Corrigir')!
    await correct.trigger('click')
    await flushPromises()
    expect(GeminiRepository.decide).toHaveBeenCalledWith(review.id, 'cancel', expect.any(Array))
    expect((full.get('textarea').element as HTMLTextAreaElement).value).toBe('Cadastre Maria')
    expect((widget.get('textarea').element as HTMLTextAreaElement).value).toBe('Cadastre Maria')
  })
  it('envia arquivo de áudio, mostra transcrição e não envia imagem junto', async () => {
    vi.mocked(GeminiRepository.chat).mockResolvedValue(
      response({ reply: 'Como posso ajudar?', transcript: 'Qual foi o total de vendas?' }),
    )
    const wrapper = chat(true)
    const input = wrapper.get('input[aria-label="Selecionar áudio"]')
    const file = new File(['audio'], 'pedido.webm', { type: 'audio/webm' })
    Object.defineProperty(input.element, 'files', { configurable: true, value: [file] })
    await input.trigger('change')
    await new Promise((resolve) => setTimeout(resolve, 30))
    await flushPromises()
    expect(wrapper.find('audio').exists()).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(GeminiRepository.chat).toHaveBeenCalledWith(
      '',
      [],
      null,
      expect.objectContaining({ mimeType: 'audio/webm', data: expect.any(String) }),
    )
    expect(wrapper.text()).toContain('Ver transcrição')
    expect(wrapper.text()).toContain('Qual foi o total de vendas?')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })
  it('preserva o anexo de áudio ao desmontar o balão e abrir o chat completo', async () => {
    vi.mocked(GeminiRepository.chat).mockResolvedValue(response({ reply: 'Mensagem processada.' }))
    const widget = chat(true)
    const input = widget.get('input[aria-label="Selecionar áudio"]')
    Object.defineProperty(input.element, 'files', {
      configurable: true,
      value: [new File(['audio'], 'rascunho.webm', { type: 'audio/webm' })],
    })
    await input.trigger('change')
    await new Promise((resolve) => setTimeout(resolve, 30))
    await flushPromises()
    widget.unmount()
    wrappers = wrappers.filter((item) => item !== widget)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    const full = chat()
    expect(full.find('audio').exists()).toBe(true)
    expect(full.text()).toContain('rascunho.webm')
    await full.get('form').trigger('submit')
    await flushPromises()
    expect(GeminiRepository.chat).toHaveBeenCalledWith(
      '',
      [],
      null,
      expect.objectContaining({ name: 'rascunho.webm' }),
    )
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
  })
  it.each(['', 'Correção: o nome exato é Maria Souza.'])(
    'corrigir áudio preserva fala e complemento "%s"',
    async (complement) => {
      const review = action()
      const transcript = 'Cadastre a cliente Maria da Silva'
      vi.mocked(GeminiRepository.chat).mockResolvedValue(
        response({ pendingActions: [review], transcript }),
      )
      vi.mocked(GeminiRepository.decide).mockResolvedValue(
        response({ reply: 'Operação cancelada.' }),
      )
      const wrapper = chat()
      const input = wrapper.get('input[aria-label="Selecionar áudio"]')
      Object.defineProperty(input.element, 'files', {
        configurable: true,
        value: [new File(['audio'], 'cliente.webm', { type: 'audio/webm' })],
      })
      await input.trigger('change')
      await new Promise((resolve) => setTimeout(resolve, 30))
      if (complement) await wrapper.get('textarea').setValue(complement)
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(wrapper.get('details[open]').text()).toContain(transcript)
      await wrapper
        .findAll('[data-action-id] button')
        .find((button) => button.text() === 'Corrigir')!
        .trigger('click')
      await flushPromises()
      expect((wrapper.get('textarea').element as HTMLTextAreaElement).value).toBe(
        [transcript, complement].filter(Boolean).join('\n\n'),
      )
    },
  )
  it('preserva pedido após falha e tenta novamente sem duplicar a mensagem', async () => {
    vi.mocked(GeminiRepository.chat)
      .mockRejectedValueOnce(new Error('Sem conexão'))
      .mockResolvedValueOnce(response({ reply: 'Consulta concluída.' }))
    const wrapper = chat()
    await wrapper.get('textarea').setValue('Resumo das vendas')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Sem conexão')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(GeminiRepository.chat).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('article[aria-label="Sua mensagem"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('Consulta concluída.')
  })
  it('permite continuar quando a revisão expira', async () => {
    const review = action()
    vi.mocked(GeminiRepository.chat).mockResolvedValue(response({ pendingActions: [review] }))
    vi.mocked(GeminiRepository.decide).mockRejectedValue({
      response: { status: 410, data: { message: 'A revisão expirou.' } },
    })
    const wrapper = chat()
    await wrapper.get('textarea').setValue('Cadastre Maria')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    await wrapper.get('[data-action-id] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('A revisão expirou.')
    expect(wrapper.get('textarea').attributes('disabled')).toBeUndefined()
  })
  it('não mistura mensagens quando a conta muda durante uma requisição', async () => {
    let resolve: (value: any) => void = () => {}
    vi.mocked(GeminiRepository.chat).mockReturnValue(
      new Promise((done) => {
        resolve = done
      }),
    )
    const wrapper = chat()
    await wrapper.get('textarea').setValue('Dados da conta anterior')
    await wrapper.get('form').trigger('submit')
    ui.usuarioLogged.contaId = 2
    resolve(response({ reply: 'Segredo da conta anterior' }))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Segredo da conta anterior')
    expect(wrapper.text()).not.toContain('Dados da conta anterior')
    ui.usuarioLogged.contaId = 1
  })
  it('escapa conteúdo e não permite links executáveis', () => {
    const html = formatCoreIaMessage('<img src=x onerror=alert(1)> [clique](javascript:alert(1))')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('href="javascript:')
  })
})
