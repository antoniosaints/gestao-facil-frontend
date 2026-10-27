import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { h } from 'vue'
import { createModalWorkspace, modalWorkspaceKey } from '../application/modalWorkspace'
const api = vi.hoisted(() => ({
  context: vi.fn(),
  summary: vi.fn(),
  enter: vi.fn(),
  open: vi.fn(),
  move: vi.fn(),
  close: vi.fn(),
  confirm: vi.fn(),
}))
vi.mock('../adapters/domain', () => ({
  CaixaRepository: {
    contexto: api.context,
    resumoCaixa: api.summary,
    entrarCaixa: api.enter,
    abrirCaixa: api.open,
    movimentarCaixa: api.move,
    fecharCaixa: api.close,
  },
}))
vi.mock('../application/confirmation', () => ({ useConfirmation: () => api.confirm }))
import CashPage from '../pages/CashPage.vue'
import RecordsTable from '../components/RecordsTable.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import { Select } from '@/components/ui/select'
import { cashSession, cashSummary } from './previewCash'
const wrappers: ReturnType<typeof mount>[] = []
async function open() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/modofacil/caixa', component: CashPage },
      { path: '/:pathMatch(.*)*', component: { template: '<div />' } },
    ],
  })
  await router.push('/modofacil/caixa')
  const workspace = createModalWorkspace(() => true)
  const wrapper = mount(
    { render: () => h(RouterView) },
    {
      global: {
        plugins: [router],
        provide: { [modalWorkspaceKey as symbol]: workspace },
        stubs: {
          ModalView: {
            props: ['title'],
            template:
              '<div role="dialog"><h2>{{ title }}</h2><slot name="header-actions" /><slot /></div>',
          },
        },
      },
    },
  )
  wrappers.push(wrapper)
  await flushPromises()
  return { wrapper, workspace }
}
const button = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper
    .findAll('button')
    .find((b) => b.attributes('aria-label') === label || b.text().trim() === label)!
const movements = (wrapper: ReturnType<typeof mount>) =>
  wrapper
    .findAllComponents(RecordsTable)
    .find((t) => t.props('caption') === 'Movimentações do caixa')!
beforeEach(() => {
  vi.clearAllMocks()
  api.context.mockResolvedValue({
    caixaAtivo: cashSession,
    caixasAbertos: [],
    pdvs: [cashSession.pdv],
  })
  api.summary.mockResolvedValue(cashSummary)
  api.confirm.mockResolvedValue(true)
  api.enter.mockResolvedValue({})
  api.move.mockResolvedValue({})
})
afterEach(() => wrappers.splice(0).forEach((w) => w.unmount()))
describe('caixa no padrão do Modo Fácil', () => {
  it('mostra dados do turno, indicadores, pagamentos e acesso à nova venda', async () => {
    const { wrapper, workspace } = await open()
    expect(wrapper.text()).toContain('Balcão principal')
    expect(wrapper.text()).toContain('João Silva')
    expect(
      wrapper
        .getComponent(DetailMetrics)
        .props('metrics')
        .map((row) => row.value),
    ).toEqual(['R$ 260,00', 'R$ 420,00', 'R$ 50,00', 'R$ 30,00'])
    expect(
      movements(wrapper)
        .props('rows')
        .map((row) => row.id),
    ).toEqual([4, 3, 2, 1])
    expect(wrapper.find('[href="/modofacil/vendas/12"]').exists()).toBe(true)
    await button(wrapper, 'Fazer venda neste caixa').trigger('click')
    expect(workspace.current.value?.target.form).toBe('venda-nova')
  })
  it('busca sem acentos e filtra pelo tipo de movimento', async () => {
    const { wrapper } = await open()
    await wrapper.get('input[type=search]').setValue('deposito')
    expect(
      movements(wrapper)
        .props('rows')
        .map((row) => row.id),
    ).toEqual([4])
    await wrapper.get('input[type=search]').setValue('')
    wrapper
      .getComponent({ name: 'FormSelect' })
      .getComponent(Select)
      .vm.$emit('update:modelValue', JSON.stringify('REFORCO'))
    await flushPromises()
    expect(
      movements(wrapper)
        .props('rows')
        .map((row) => row.id),
    ).toEqual([3])
  })
  it('pagina o histórico sem alterar o resumo do turno', async () => {
    api.summary.mockResolvedValue({
      ...cashSummary,
      movimentos: Array.from({ length: 23 }, (_, index) => ({
        id: index + 1,
        tipo: 'REFORCO',
        valor: 10,
        descricao: `Movimento ${index + 1}`,
      })),
    })
    const { wrapper } = await open()
    expect(movements(wrapper).props('rows')).toHaveLength(10)
    await wrapper.get('[aria-label="Próxima página"]').trigger('click')
    expect(movements(wrapper).props('rows')[0].id).toBe(13)
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[0].value).toBe('R$ 260,00')
  })
  it.each([
    ['Adicionar dinheiro', 'Reforço de dinheiro'],
    ['Retirar dinheiro', 'Retirada / sangria'],
    ['Fechar caixa', 'Fechar caixa'],
  ])('o atalho %s abre a operação correta', async (label, expected) => {
    const { wrapper } = await open()
    await button(wrapper, label).trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=dialog]').get('[role=combobox]').text()).toBe(expected)
    expect(api.confirm).not.toHaveBeenCalled()
    expect(api.move).not.toHaveBeenCalled()
    expect(api.close).not.toHaveBeenCalled()
  })
  it('mostra a diferença de fechamento sem enviar a operação', async () => {
    const { wrapper } = await open()
    await button(wrapper, 'Fechar caixa').trigger('click')
    expect(wrapper.get('[role=dialog]').text()).not.toContain('Diferença na conferência')
    await wrapper.get('[role=dialog] input[inputmode=decimal]').setValue('250')
    expect(wrapper.get('[role=dialog]').text()).toContain('-R$ 10,00')
    await wrapper.get('[role=dialog] input[inputmode=decimal]').setValue('260')
    expect(wrapper.get('[role=dialog]').text()).toContain('Diferença na conferência')
    expect(api.close).not.toHaveBeenCalled()
  })
  it('recusa movimento zero antes de pedir confirmação ou enviar', async () => {
    const { wrapper } = await open()
    await button(wrapper, 'Adicionar dinheiro').trigger('click')
    await wrapper.get('[role=dialog] input[inputmode=decimal]').setValue('0')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role=dialog]').text()).toContain('maior que zero')
    expect(api.confirm).not.toHaveBeenCalled()
    expect(api.move).not.toHaveBeenCalled()
  })
  it('remove o resumo antigo quando deixa de haver caixa ativo', async () => {
    const { wrapper } = await open()
    api.context.mockResolvedValueOnce({ caixaAtivo: null, caixasAbertos: [], pdvs: [] })
    await button(wrapper, 'Atualizar').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum caixa em uso')
    expect(wrapper.findComponent(DetailMetrics).exists()).toBe(false)
    expect(wrapper.find('table').exists()).toBe(false)
    await button(wrapper, 'Abrir caixa').trigger('click')
    expect(wrapper.get('[role=dialog]').text()).toContain('Saldo inicial')
  })
  it('permite escolher o caixa aberto pelo ID correto', async () => {
    api.context.mockResolvedValueOnce({
      caixaAtivo: null,
      caixasAbertos: [{ ...cashSession, id: 9 }],
      pdvs: [],
    })
    const { wrapper } = await open()
    await button(wrapper, `Entrar no caixa ${cashSession.codigo}`).trigger('click')
    await flushPromises()
    expect(api.enter).toHaveBeenCalledExactlyOnceWith({ caixaId: 9 })
    expect(wrapper.findComponent(DetailMetrics).exists()).toBe(true)
  })
  it('uma falha no resumo não mostra valores antigos e pode ser recuperada', async () => {
    const { wrapper } = await open()
    api.summary.mockRejectedValueOnce(new Error('Resumo indisponível'))
    await button(wrapper, 'Atualizar').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role=alert]').text()).toContain('Resumo indisponível')
    expect(movements(wrapper).props('rows')).toEqual([])
    expect(wrapper.getComponent(DetailMetrics).props('metrics')[1].value).toBe('Não informado')
    await wrapper.get('[role=alert] button').trigger('click')
    await flushPromises()
    expect(movements(wrapper).props('rows')).toHaveLength(4)
  })
})
