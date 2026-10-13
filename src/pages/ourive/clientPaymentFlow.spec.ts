import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Ordens from './Ordens.vue'
import OrdemDetalhe from './OrdemDetalhe.vue'
import ClientPaymentFields from './ClientPaymentFields.vue'

const mocks = vi.hoisted(() => ({
  order: vi.fn(),
  create: vi.fn(),
  payment: vi.fn(),
  update: vi.fn(),
  push: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  receive: true,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
  useRoute: () => ({ params: { id: '42' } }),
}))
vi.mock('vue-toastification', () => ({
  useToast: () => ({ info: mocks.info, error: mocks.error, success: vi.fn() }),
}))
vi.mock('@/stores/ui/uiStore', () => ({
  useUiStore: () => ({
    usuarioLogged: {},
    hasOuriveCapability: (value: string) => value === 'RECEBER' && mocks.receive,
  }),
}))
vi.mock('@/hooks/authorize', () => ({ hasPermission: () => false }))
vi.mock('@/utils/axios', () => ({ default: {} }))
vi.mock('@/composables/useSocketEvent', () => ({ useSocketEvent: vi.fn() }))
vi.mock('@/repositories/ourive-repository', () => ({
  OuriveRepository: {
    ordem: mocks.order,
    criarOrdem: mocks.create,
    atualizarPagamentoCliente: mocks.payment,
    atualizarOrdem: mocks.update,
    ordens: async () => ({ items: [] }),
    predefinicoes: async () => ({ pecas: [], metais: [] }),
    equipe: async () => [],
  },
}))

enableAutoUnmount(afterEach)

const dialog = {
  props: ['open'],
  template: '<section v-if="open"><slot /></section>',
}
const input = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template:
    '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
}
const global = {
  renderStubDefaultSlot: true,
  stubs: {
    Dialog: dialog,
    Button: { template: '<button><slot /></button>' },
    Input: input,
  },
}
const sampleOrder = (extra = {}) => ({
  id: 42,
  tipo: 'ENCOMENDA',
  status: 'RECEBIDA',
  codigoRastreio: 'OUR-42',
  antecipacaoCliente: '0.00',
  formaPagamentoCliente: null,
  ordemServico: { descricao: 'Par de alianças', garantia: '90 dias' },
  pecas: [],
  etapas: [],
  orcamentos: [],
  materiais: [],
  eventos: [],
  comissoes: [],
  ...extra,
})
const button = (wrapper: ReturnType<typeof shallowMount>, text: string) => {
  const result = wrapper.findAll('button').find((item) => item.text() === text)
  if (!result) throw new Error(`Botão não encontrado: ${text}`)
  return result
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.receive = true
  mocks.order.mockResolvedValue(sampleOrder())
  mocks.create.mockResolvedValue({ id: 42 })
  mocks.payment.mockResolvedValue({ ordemId: 42 })
  mocks.update.mockResolvedValue({ id: 42 })
})

describe('Fluxo de pagamento do cliente', () => {
  it('envia o valor brasileiro e o método ao criar uma encomenda', async () => {
    const wrapper = shallowMount(Ordens, { global })
    await flushPromises()
    await button(wrapper, 'Nova ordem').trigger('click')
    await wrapper
      .findAll('button')
      .find((item) => item.text().includes('Iniciar encomenda'))!
      .trigger('click')
    await wrapper.get('textarea').setValue('Par de alianças')
    await wrapper.get('input[placeholder="Peça a produzir"]').setValue('Aliança')
    const fields = wrapper.getComponent(ClientPaymentFields)
    fields.vm.$emit('update:amount', '1.075,25')
    fields.vm.$emit('update:method', 'PIX')
    await button(wrapper, 'Criar encomenda').trigger('click')
    await flushPromises()
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'ENCOMENDA',
        antecipacaoCliente: 1075.25,
        formaPagamentoCliente: 'PIX',
      }),
    )
    expect(mocks.push).toHaveBeenCalledWith({ name: 'ourive-ordem', params: { id: 42 } })
  })

  it('registra o pagamento na ordem criada e recarrega o detalhe', async () => {
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    await button(wrapper, 'Pagamento do cliente').trigger('click')
    const fields = wrapper.getComponent(ClientPaymentFields)
    fields.vm.$emit('update:amount', '1075,25')
    fields.vm.$emit('update:method', 'CARTAO')
    await button(wrapper, 'Salvar pagamento').trigger('click')
    await flushPromises()
    expect(mocks.payment).toHaveBeenCalledWith(42, {
      antecipacaoCliente: 1075.25,
      formaPagamentoCliente: 'CARTAO',
    })
    expect(mocks.order).toHaveBeenCalledTimes(2)
    expect(wrapper.findComponent(ClientPaymentFields).exists()).toBe(false)
  })

  it('hidrata a antecipação existente sem perder centavos e exige o método', async () => {
    mocks.order.mockResolvedValue(sampleOrder({ antecipacaoCliente: '1075.25' }))
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    await button(wrapper, 'Pagamento do cliente').trigger('click')
    expect(wrapper.getComponent(ClientPaymentFields).props('amount')).toBe('1075,25')
    await button(wrapper, 'Salvar pagamento').trigger('click')
    expect(mocks.info).toHaveBeenCalledWith('Informe a forma de pagamento do cliente.')
    expect(mocks.payment).not.toHaveBeenCalled()
  })

  it('mantém o formulário aberto em caso de erro da API', async () => {
    mocks.payment.mockRejectedValue({
      response: { data: { error: { message: 'Ordem faturada.' } } },
    })
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    await button(wrapper, 'Pagamento do cliente').trigger('click')
    await button(wrapper, 'Salvar pagamento').trigger('click')
    await flushPromises()
    expect(mocks.error).toHaveBeenCalledWith('Ordem faturada.')
    expect(wrapper.findComponent(ClientPaymentFields).exists()).toBe(true)
  })

  it('envia antecipação e método também na edição geral da OS', async () => {
    mocks.order.mockResolvedValue(
      sampleOrder({ antecipacaoCliente: '1075.25', formaPagamentoCliente: 'PIX' }),
    )
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    await button(wrapper, 'Editar informações').trigger('click')
    const fields = wrapper.getComponent(ClientPaymentFields)
    expect(fields.props('amount')).toBe('1075,25')
    expect(fields.props('method')).toBe('PIX')
    fields.vm.$emit('update:amount', '1200,50')
    fields.vm.$emit('update:method', 'DINHEIRO')
    const save = wrapper
      .findAll('button')
      .find((item) => item.text().includes('Salvar alterações'))!
    await save.trigger('click')
    await flushPromises()
    expect(mocks.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        antecipacaoCliente: 1200.5,
        formaPagamentoCliente: 'DINHEIRO',
      }),
    )
  })

  it('oculta o pagamento para quem não pode receber ordens', async () => {
    mocks.receive = false
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    expect(wrapper.findAll('button').some((item) => item.text() === 'Pagamento do cliente')).toBe(
      false,
    )
  })

  it('oculta a ação para ordens faturadas', async () => {
    mocks.order.mockResolvedValue(sampleOrder({ faturadaEm: '2026-10-12T12:00:00Z' }))
    const wrapper = shallowMount(OrdemDetalhe, { global })
    await flushPromises()
    expect(wrapper.findAll('button').some((item) => item.text() === 'Pagamento do cliente')).toBe(
      false,
    )
  })
})
