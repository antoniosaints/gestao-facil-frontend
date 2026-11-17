import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import LancamentoModal from './LancamentoModal.vue'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { LancamentosRepository } from '@/repositories/lancamento-repository'

vi.mock('@/repositories/lancamento-repository', () => ({
  LancamentosRepository: {
    save: vi.fn(),
    saveComContrapartida: vi.fn(),
    atualizarLancamento: vi.fn(),
  },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => ({ hasActiveModule: () => false }) }))
vi.mock('@/stores/clientes/useClientes', () => ({
  useClientesStore: () => ({ openSave: vi.fn() }),
}))
vi.mock('vue-toastification', () => ({
  POSITION: { BOTTOM_RIGHT: 'bottom-right' },
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}))
const passthrough = { template: '<div><slot /></div>' }
const modal = {
  props: ['open', 'title', 'description'],
  template: '<section v-if="open"><h1>{{title}}</h1><slot /></section>',
}
const switchStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<button type="button" role="switch" :aria-checked="modelValue" @click="$emit(\'update:modelValue\',!modelValue)"></button>',
}
let wrappers: ReturnType<typeof mount>[] = []
function setup(edit = false) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useLancamentosStore()
  Object.assign(store.form, {
    id: edit ? 20 : null,
    descricao: 'Empréstimo QA',
    categoriaId: 7,
    clienteId: 8,
    contasFinanceiroId: 9,
    valorTotal: 100.01,
    dataLancamento: '2026-11-17T12:00:00.000Z',
  })
  store.openModal = true
  const wrapper = mount(LancamentoModal, {
    global: {
      plugins: [pinia],
      directives: { maska: {} },
      stubs: {
        ModalView: modal,
        Calendarpicker: true,
        Select2Ajax: true,
        FormularioContas: true,
        FormularioCategorias: true,
        Switch: switchStub,
        Select: passthrough,
        SelectContent: passthrough,
        SelectItem: passthrough,
        SelectTrigger: passthrough,
        SelectValue: true,
      },
    },
  })
  wrappers.push(wrapper)
  return { store, wrapper }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(LancamentosRepository.save).mockResolvedValue(undefined)
  vi.mocked(LancamentosRepository.saveComContrapartida).mockResolvedValue({})
  vi.mocked(LancamentosRepository.atualizarLancamento).mockResolvedValue({} as any)
})
afterEach(() => {
  wrappers.forEach((w) => w.unmount())
  wrappers = []
})
describe('Opção de receita e despesa no formulário financeiro', () => {
  it('mantém o cadastro simples na rota atual por padrão', async () => {
    const { wrapper } = setup()
    expect(wrapper.get('#criarReceitaDespesa').attributes('aria-checked')).toBe('false')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(LancamentosRepository.save).toHaveBeenCalledOnce()
    expect(LancamentosRepository.saveComContrapartida).not.toHaveBeenCalled()
  })
  it('envia os dados uma única vez para a criação do par e reinicia a opção ao concluir', async () => {
    const { wrapper, store } = setup()
    await wrapper.get('#criarReceitaDespesa').trigger('click')
    expect(wrapper.text()).toContain('Resumo dos dois lançamentos')
    expect(wrapper.text()).toContain('Receita: +R$')
    expect(wrapper.text()).toContain('Despesa: −R$')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(LancamentosRepository.save).not.toHaveBeenCalled()
    expect(LancamentosRepository.saveComContrapartida).toHaveBeenCalledWith(
      expect.objectContaining({
        descricao: 'Empréstimo QA',
        valorTotal: 100.01,
        clienteId: 8,
        categoriaId: 7,
        contasFinanceiroId: 9,
        chaveOperacao: expect.stringMatching(/^[0-9a-f-]{36}$/),
      }),
    )
    expect(store.openModal).toBe(false)
    store.openModal = true
    await flushPromises()
    expect(wrapper.get('#criarReceitaDespesa').attributes('aria-checked')).toBe('false')
  })
  it('preserva a chave para tentar novamente após falha e bloqueia cliques simultâneos', async () => {
    let reject: (e: Error) => void = () => {}
    vi.mocked(LancamentosRepository.saveComContrapartida).mockImplementationOnce(
      () =>
        new Promise((_resolve, r) => {
          reject = r
        }),
    )
    const { wrapper } = setup()
    await wrapper.get('#criarReceitaDespesa').trigger('click')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(LancamentosRepository.saveComContrapartida).toHaveBeenCalledOnce()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    reject(new Error('Falha de conexão'))
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    const calls = vi.mocked(LancamentosRepository.saveComContrapartida).mock.calls
    expect(calls).toHaveLength(2)
    expect(calls[1][0].chaveOperacao).toBe(calls[0][0].chaveOperacao)
  })
  it('não oferece criação duplicada na edição de um lançamento existente', async () => {
    const { wrapper } = setup(true)
    expect(wrapper.find('#criarReceitaDespesa').exists()).toBe(false)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(LancamentosRepository.atualizarLancamento).toHaveBeenCalledOnce()
    expect(LancamentosRepository.saveComContrapartida).not.toHaveBeenCalled()
  })
})
